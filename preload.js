const { contextBridge, ipcRenderer } = require('electron');

// Synchronously restore Firebase auth into localStorage BEFORE the page/Firebase loads.
// Firebase's browserLocalPersistence reads localStorage at init time, so this must
// happen here (the preload shares localStorage with the page).
const savedEntries = ipcRenderer.sendSync('auth-get-localStorage-sync');
for (const [key, value] of Object.entries(savedEntries || {})) {
  try { localStorage.setItem(key, value); } catch (_) {}
}

contextBridge.exposeInMainWorld('electronAPI', {
  searchTracklist: (videoUrl) =>
    ipcRenderer.invoke('search-tracklist', { videoUrl }),
  searchByAuthor: (videoUrl, authorName) =>
    ipcRenderer.invoke('search-by-author', { videoUrl, authorName }),
  openExternal: (url) =>
    ipcRenderer.invoke('open-external', url),
  openInBrowser: (url) =>
    ipcRenderer.invoke('open-in-browser', url),
  openInPrivate: (url) =>
    ipcRenderer.invoke('open-in-private', url),
  copyToClipboard: (text) =>
    ipcRenderer.invoke('copy-to-clipboard', text),
  saveFile: (opts) =>
    ipcRenderer.invoke('save-file', opts),
  loadHistory: () =>
    ipcRenderer.invoke('load-history'),
  saveToHistory: (entry) =>
    ipcRenderer.invoke('save-to-history', entry),
  deleteHistoryItem: (id) =>
    ipcRenderer.invoke('delete-history-item', id),
  toggleFavorite: (id) =>
    ipcRenderer.invoke('toggle-favorite', id),
  authStoreGet: (key) =>
    ipcRenderer.invoke('auth-store-get', key),
  authStoreSet: (key, value) =>
    ipcRenderer.invoke('auth-store-set', key, value),
  authStoreDelete: (key) =>
    ipcRenderer.invoke('auth-store-delete', key),
  authSaveLocalStorage: (entries) =>
    ipcRenderer.invoke('auth-save-localStorage', entries),
  authClearLocalStorage: () =>
    ipcRenderer.invoke('auth-clear-localStorage'),
});
