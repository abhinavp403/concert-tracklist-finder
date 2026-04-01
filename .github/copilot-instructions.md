# Copilot Instructions

## Commands

```bash
npm run dev      # Start Vite dev server + Electron (hot reload)
npm run build    # Vite build only (outputs to dist/)
npm start        # Build then launch Electron
```

There are no tests or linters configured.

## Architecture

This is an **Electron + React + Vite** desktop app with two distinct process contexts:

- **Main process** (`main.js`, `src/services/`): Node.js/CommonJS (`require`/`module.exports`). Handles YouTube API calls and tracklist parsing. Communicates with the renderer via IPC.
- **Renderer process** (`src/`): React + ESM (`import`/`export`). Runs inside Electron's browser window, built by Vite.

### IPC Flow

1. User submits a YouTube URL in `SearchBar.jsx`
2. `App.jsx` calls `window.electronAPI.searchTracklist(url)`
3. `preload.js` bridges this to `ipcRenderer.invoke('search-tracklist', ...)`
4. `main.js` handles `'search-tracklist'`: extracts video ID → `fetchComments()` → `findTracklists()` → returns result
5. Result flows back to `TracklistResults.jsx` for display

### Key Modules

- `src/services/youtube.js` — fetches up to ~1000 comments (10 pages × 100) from YouTube Data API v3, ordered by relevance. Uses Node's built-in `https` module (no fetch, no axios).
- `src/services/tracklistParser.js` — scores comments with a weighted heuristic (timestamps ×3, numbered lines ×2, keywords ×5, likes capped at 50, line count capped at 40). Returns top 5 results with score > 0 and ≥ 2 parsed tracks.

## Key Conventions

- **Module system split**: Services (`src/services/`) and Electron files (`main.js`, `preload.js`) use CommonJS. All `src/` React files use ESM. Do not mix them — adding `import` to a service file or `require` to a component will break the build.
- **YouTube API key**: Hardcoded in `main.js` at line 30. Keep API calls in the main process only; the renderer never calls YouTube directly.
- **IPC is the only renderer↔main bridge**: The renderer has no Node access (`nodeIntegration: false`, `contextIsolation: true`). Any new backend functionality must go through a new `ipcMain.handle` + `contextBridge.exposeInMainWorld` pair.
- **Tailwind v4**: Uses the Vite plugin (`@tailwindcss/vite`), not PostCSS. No `tailwind.config.js` — configuration goes in CSS if needed.
- **Dev mode detection**: `isDev = !app.isPackaged` (not `electron-is-dev` despite it being installed). Dev loads `http://localhost:5173`; production loads `dist/index.html`.
- **Track entry shape**: `{ timestamp: string | null, title: string }`. Timestamp is `null` for numbered-list entries without a time code.
