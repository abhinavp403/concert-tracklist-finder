const { contextBridge, ipcRenderer } = require('electron');

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
});
