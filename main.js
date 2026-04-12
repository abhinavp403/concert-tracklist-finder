const { app, BrowserWindow, ipcMain, shell, dialog, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { execFile } = require('child_process');
const { fetchComments, fetchVideoMetadata } = require('./src/services/youtube');
const { findTracklists, scoreComment, parseTrackEntries } = require('./src/services/tracklistParser');
const HistoryStore = require('./src/services/historyStore');
const Store = require('electron-store').default;

const authStore = new Store({ name: 'firebase-auth' });

const isDev = !app.isPackaged && process.env.FORCE_PROD !== '1';

let historyStore = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Concert Tracklist Finder',
    autoHideMenuBar: true,
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

const API_KEY = process.env.YOUTUBE_API_KEY;

// Opens a URL in the system browser's incognito/private mode.
// Tries Chrome → Edge → Firefox in order; falls back to shell.openExternal.
function openInPrivate(url) {
  const local = process.env.LOCALAPPDATA || '';
  const pf    = process.env.ProgramFiles  || 'C:\\Program Files';
  const pf86  = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const browsers = [
    {
      paths: [
        path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(pf,   'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      ],
      flag: '--incognito',
    },
    {
      paths: [
        path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(pf,   'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      ],
      flag: '--inprivate',
    },
    {
      paths: [
        path.join(pf,   'Mozilla Firefox', 'firefox.exe'),
        path.join(pf86, 'Mozilla Firefox', 'firefox.exe'),
      ],
      flag: '-private-window',
    },
  ];

  for (const browser of browsers) {
    for (const exePath of browser.paths) {
      if (fs.existsSync(exePath)) {
        execFile(exePath, [browser.flag, url]);
        return;
      }
    }
  }

  // Fallback if no known browser found
  shell.openExternal(url);
}

// IPC handler: open a URL in the system default browser (Spotify, SoundCloud, etc.)
ipcMain.handle('open-in-browser', (_event, url) => shell.openExternal(url));

// IPC handler: open a URL in the system browser's incognito/private mode
ipcMain.handle('open-in-private', (_event, url) => openInPrivate(url));

// IPC handler: copy text to the system clipboard
ipcMain.handle('copy-to-clipboard', (_event, text) => clipboard.writeText(text));

// IPC handler: show a save dialog and write a file
ipcMain.handle('save-file', async (_event, { content, defaultName, ext }) => {
  const filterMap = {
    txt: [{ name: 'Text Files', extensions: ['txt'] }],
    csv: [{ name: 'CSV Files', extensions: ['csv'] }],
    json: [{ name: 'JSON Files', extensions: ['json'] }],
  };
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: filterMap[ext] || [{ name: 'All Files', extensions: ['*'] }],
  });
  if (canceled || !filePath) return { success: false };
  await fs.promises.writeFile(filePath, content, 'utf8');
  return { success: true };
});

// IPC handlers: search history (persisted to userData/search-history.json)
ipcMain.handle('load-history', () => historyStore?.read() ?? []);
ipcMain.handle('save-to-history', (_event, entry) => historyStore?.add(entry) ?? []);
ipcMain.handle('delete-history-item', (_event, id) => historyStore?.remove(id) ?? []);
ipcMain.handle('toggle-favorite', (_event, id) => historyStore?.toggleFavorite(id) ?? []);

// IPC handlers: Firebase auth persistence (stored in userData/firebase-auth.json)
ipcMain.handle('auth-store-get', (_event, key) => authStore.get(key, null));
ipcMain.handle('auth-store-set', (_event, key, value) => { authStore.set(key, value); });
ipcMain.handle('auth-store-delete', (_event, key) => { authStore.delete(key); });

// Synchronous handler used by preload.js to restore Firebase localStorage before page load
ipcMain.on('auth-get-localStorage-sync', (event) => {
  event.returnValue = authStore.get('localStorage', {});
});
ipcMain.handle('auth-save-localStorage', (_event, entries) => {
  authStore.set('localStorage', entries);
});
ipcMain.handle('auth-clear-localStorage', () => {
  authStore.delete('localStorage');
});

// IPC handler: open a URL in a reusable YouTube window
let youtubeWindow = null;

ipcMain.handle('open-external', (_event, url) => {
  if (youtubeWindow && !youtubeWindow.isDestroyed()) {
    youtubeWindow.loadURL(url);
    youtubeWindow.focus();
  } else {
    youtubeWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      title: 'YouTube',
      webPreferences: { partition: 'incognito' },
    });
    youtubeWindow.loadURL(url);
    youtubeWindow.on('closed', () => { youtubeWindow = null; });
  }
});

// IPC handler: search comments by a specific author for tracklists
ipcMain.handle('search-by-author', async (_event, { videoUrl, authorName }) => {
  try {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) return { error: 'Invalid YouTube URL. Please provide a valid video link.' };

    const [comments, videoMetadata] = await Promise.all([
      fetchComments(videoId, API_KEY),
      fetchVideoMetadata(videoId, API_KEY),
    ]);

    if (!comments || comments.length === 0) {
      return { error: 'No comments found for this video.' };
    }

    const authorComments = comments.filter(c =>
      c.author.toLowerCase().includes(authorName.toLowerCase())
    );

    let tracklists = findTracklists(authorComments);

    // Fallback: if strict scoring finds nothing, show any comment from that author
    // that contains at least one parseable track entry
    if (tracklists.length === 0 && authorComments.length > 0) {
      const withTracks = authorComments
        .map(c => ({ ...c, tracks: parseTrackEntries(c.text) }))
        .filter(c => c.tracks.length >= 1);
      if (withTracks.length > 0) {
        withTracks.sort((a, b) => b.tracks.length - a.tracks.length);
        tracklists = withTracks.slice(0, 3).map(c => ({
          author: c.author,
          text: c.text,
          likes: c.likes,
          score: c.tracks.length,
          tracks: c.tracks,
          commentId: c.commentId,
        }));
      }
    }

    return { tracklists, totalCommentsScanned: comments.length, videoId, videoMetadata };
  } catch (err) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
});

// IPC handler: search for tracklists in a YouTube video's comments
ipcMain.handle('search-tracklist', async (_event, { videoUrl }) => {
  try {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return { error: 'Invalid YouTube URL. Please provide a valid video link.' };
    }

    const [comments, videoMetadata] = await Promise.all([
      fetchComments(videoId, API_KEY),
      fetchVideoMetadata(videoId, API_KEY),
    ]);

    if (!comments || comments.length === 0) {
      return { error: 'No comments found for this video.' };
    }

    let tracklists = findTracklists(comments);

    // Check video description as a potential tracklist source
    if (videoMetadata?.description) {
      const descPseudo = { text: videoMetadata.description, likes: 0 };
      const descScore = scoreComment(descPseudo);
      const descTracks = parseTrackEntries(videoMetadata.description);
      if (descScore > 0 && descTracks.length >= 2) {
        tracklists = [
          {
            author: 'Video Description',
            text: videoMetadata.description,
            likes: 0,
            score: descScore,
            tracks: descTracks,
            isDescription: true,
          },
          ...tracklists,
        ].slice(0, 5);
      }
    }

    return { tracklists, totalCommentsScanned: comments.length, videoId, videoMetadata };
  } catch (err) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
});

function extractVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1);
    }
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v');
    }
  } catch {
    // Try as plain video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  }
  return null;
}

app.whenReady().then(() => {
  historyStore = new HistoryStore(path.join(app.getPath('userData'), 'search-history.json'));
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
