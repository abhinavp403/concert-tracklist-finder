# 🎵 Concert Tracklist Finder

A desktop app that finds tracklists for YouTube concert and DJ set videos by scanning and scoring comments (and the video description) using a heuristic parser.

Built with **Electron + React + Vite**, with **Firebase** for auth and cloud sync.

---

## Features

- 🔍 **Smart tracklist detection** — scans up to ~1,000 comments plus the video description, scores each by timestamps, numbered lines, keywords, and likes
- 🕐 **Clickable timestamps** — jump to any track directly in YouTube
- 🎵 **Per-track search** — search any track on Spotify or SoundCloud in one click
- 📤 **Export** — copy to clipboard or save as `.txt`, `.csv`, or `.json`
- 📂 **Search history** — keeps your 50 most recent searches with thumbnails and timestamps
- ⭐ **Favorites** — star searches to pin them to the top of history
- 🔗 **Source link** — jump to the original comment thread on YouTube
- 🔎 **Author search** — if no tracklist is found, search by the commenter's username
- 🌗 **Dark / light mode** — persisted across sessions
- 👤 **Account sync** — sign in with email to sync history across devices via Firebase; or continue as a guest with local-only storage

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [YouTube Data API v3](https://console.cloud.google.com/) key

## Getting Started

```bash
git clone https://github.com/abhinavp403/concert-tracklist-finder.git
cd concert-tracklist-finder
npm install
npm run dev
```

## How It Works

The app checks the video description first, then fetches up to ~1,000 comments (10 pages × 100, ordered by relevance). Each candidate is scored with a weighted heuristic:

| Signal | Weight |
|---|---|
| Timestamp patterns (`0:00`, `1:23:45`) | ×3 per match |
| Numbered list lines | ×2 per line |
| Keywords (`tracklist`, `setlist`, etc.) | ×5 per match |
| Comment likes | capped at 50 |
| Line count | capped at 40 |

Only results with a score > 0 and at least 2 parsed tracks are returned (up to 5).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server + Electron with hot reload |
| `npm run build` | Vite build only (outputs to `dist/`) |
| `npm start` | Build then launch Electron |
| `npm run package:mac` | Package as macOS `.dmg` |
| `npm run package:win` | Package as Windows `.exe` installer |

## Project Structure

```
concert-tracklist-finder/
├── main.js                            # Electron main process + IPC handlers
├── preload.js                         # Secure context bridge (renderer ↔ main)
├── src/
│   ├── App.jsx                        # Root React component, auth + history state
│   ├── components/
│   │   ├── AuthScreen.jsx             # Sign in / create account / guest screen
│   │   ├── HistoryPanel.jsx           # Recent searches with favorites
│   │   ├── SearchBar.jsx              # URL input + submit button
│   │   └── TracklistResults.jsx       # Expandable results, export, timestamp links
│   └── services/
│       ├── youtube.js                 # YouTube Data API comment + metadata fetcher
│       ├── tracklistParser.js         # Tracklist detection heuristic
│       ├── firebase.js                # Firebase app init
│       ├── cloudHistory.js            # Firestore history read/write/migrate
│       └── historyStore.js            # Local (electron-store) history fallback
└── vite.config.js
```