● The project is built and ready at Documents\concert-tracklist-finder. Here's a summary:

  🎵 Concert Tracklist Finder

  To run:

   cd Documents\concert-tracklist-finder
   npm run dev

  How it works:

   1. Enter your YouTube Data API key (saved in localStorage)
   2. Paste a YouTube concert/set URL
   3. Click Find Tracklist — the app fetches up to ~1000 comments via the API
   4. A heuristic parser scores comments by: timestamp patterns (0:00, 1:23:45), numbered lists, keywords like
  "tracklist"/"setlist", and likes
   5. Top 5 matching comments are displayed with parsed track entries

  Key files:

  ┌───────────────────────────────────────┬───────────────────────────────┐
  │ File                                  │ Purpose                       │
  ├───────────────────────────────────────┼───────────────────────────────┤
  │ main.js                               │ Electron main process + IPC   │
  ├───────────────────────────────────────┼───────────────────────────────┤
  │ preload.js                            │ Secure context bridge         │
  ├───────────────────────────────────────┼───────────────────────────────┤
  │ src/services/youtube.js               │ YouTube API comment fetcher   │
  ├───────────────────────────────────────┼───────────────────────────────┤
  │ src/services/tracklistParser.js       │ Tracklist detection heuristic │
  ├───────────────────────────────────────┼───────────────────────────────┤
  │ src/App.jsx                           │ Main React UI                 │
  ├───────────────────────────────────────┼───────────────────────────────┤
  │ src/components/SearchBar.jsx          │ URL input + button            │
  ├───────────────────────────────────────┼───────────────────────────────┤
  │ src/components/TracklistResults.jsx   │ Expandable tracklist display  │
  └───────────────────────────────────────┴───────────────────────────────┘

  Scripts: npm run dev (dev mode), npm run build (build only), npm start (build + launch)