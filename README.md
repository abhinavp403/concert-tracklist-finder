# 🎵 Concert Tracklist Finder

A desktop app that finds tracklists for YouTube concert and DJ set videos by scanning and scoring comments using a heuristic parser.

Built with **Electron + React + Vite**.

---

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

## Usage

1. Enter your YouTube Data API key when prompted (saved locally)
2. Paste a YouTube concert or DJ set URL
3. Click **Find Tracklist**
4. The app fetches up to ~1,000 comments and surfaces the top 5 tracklist candidates

## How It Works

Comments are scored using a weighted heuristic:

| Signal | Weight |
|---|---|
| Timestamp patterns (`0:00`, `1:23:45`) | ×3 per match |
| Numbered list lines | ×2 per line |
| Keywords (`tracklist`, `setlist`, etc.) | ×5 per match |
| Comment likes | capped at 50 |
| Line count | capped at 40 |

Only comments with a score > 0 and at least 2 parsed tracks are returned.

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
├── main.js                          # Electron main process + IPC handlers
├── preload.js                       # Secure context bridge (renderer ↔ main)
├── src/
│   ├── App.jsx                      # Root React component
│   ├── components/
│   │   ├── SearchBar.jsx            # URL input + submit button
│   │   └── TracklistResults.jsx     # Expandable tracklist display
│   └── services/
│       ├── youtube.js               # YouTube Data API comment fetcher
│       └── tracklistParser.js       # Tracklist detection heuristic
└── vite.config.js
```