import React, { useState } from 'react';

function tsToSeconds(ts) {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function SoundCloudIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M1.175 12.225c-.015 0-.03.002-.044.003C.504 12.27 0 12.79 0 13.425c0 .637.51 1.153 1.138 1.153h.037l.006-.001h14.35c.624 0 1.13-.504 1.13-1.126V9.887c0-2.105-1.708-3.812-3.813-3.812-.37 0-.727.053-1.063.15C11.297 4.55 9.65 3.45 7.75 3.45c-2.68 0-4.856 2.07-4.981 4.72-.02.001-.04.001-.06.001-1.491 0-2.7 1.208-2.7 2.7 0 1.09.652 2.034 1.597 2.466-.009.1-.014.201-.014.304h-.417zm20.463-2.063c-.08 0-.16.005-.239.014C21.172 8.48 19.744 7.2 18.028 7.2c-.386 0-.755.066-1.1.186-.386-1.703-1.913-2.976-3.753-2.976-2.117 0-3.833 1.716-3.833 3.833 0 .056.002.112.005.167-.04-.003-.08-.004-.12-.004-1.629 0-2.95 1.32-2.95 2.95s1.321 2.95 2.95 2.95H21.638c1.306 0 2.362-1.056 2.362-2.362s-1.056-2.362-2.362-2.362v-.42z"/>
    </svg>
  );
}

function VideoMetadataCard({ metadata, videoId }) {
  const date = new Date(metadata.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const openVideo = () => {
    window.electronAPI.openExternal(`https://www.youtube.com/watch?v=${videoId}`);
  };

  return (
    <div className="mt-6 flex gap-4 bg-white border border-gray-200 rounded-lg p-4 items-start dark:bg-gray-900 dark:border-gray-800">
      {metadata.thumbnailUrl && (
        <img
          src={metadata.thumbnailUrl}
          alt="Video thumbnail"
          className="w-32 rounded flex-shrink-0 object-cover"
          style={{ height: '72px' }}
        />
      )}
      <div className="min-w-0 flex-1">
        <button
          onClick={openVideo}
          className="text-gray-800 font-semibold text-sm hover:text-purple-600 dark:text-gray-100 dark:hover:text-purple-400 transition-colors text-left leading-snug"
        >
          {metadata.title}
        </button>
        <p className="text-gray-500 text-xs mt-1">{metadata.channelTitle}</p>
        <p className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">{date}</p>
      </div>
    </div>
  );
}

export default function TracklistResults({ data, onAuthorSearch }) {
  const { tracklists, totalCommentsScanned, videoId, videoMetadata } = data;
  const [expanded, setExpanded] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [authorInput, setAuthorInput] = useState('');
  const [authorLoading, setAuthorLoading] = useState(false);
  const [authorError, setAuthorError] = useState(null);

  const openAtTimestamp = (ts) => {
    const url = `https://www.youtube.com/watch?v=${videoId}&t=${tsToSeconds(ts)}s`;
    window.electronAPI.openExternal(url);
  };

  const openCommentThread = (commentId) => {
    const url = `https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`;
    window.electronAPI.openExternal(url);
  };

  const searchOnSpotify = (title) => {
    const url = `https://open.spotify.com/search/${encodeURIComponent(title)}`;
    window.electronAPI.openInBrowser(url);
  };

  const searchOnSoundCloud = (title) => {
    const url = `https://soundcloud.com/search?q=${encodeURIComponent(title)}`;
    window.electronAPI.openInBrowser(url);
  };

  const exportTxt = (tl) => {
    const header = videoMetadata
      ? `${videoMetadata.title}\n${videoMetadata.channelTitle}\n\n`
      : '';
    const tracks = tl.tracks
      .map((t, i) => `${i + 1}. ${t.timestamp ? t.timestamp + ' ' : ''}${t.title}`)
      .join('\n');
    return header + tracks;
  };

  const exportCsv = (tl) => {
    const rows = [['#', 'Timestamp', 'Title']];
    tl.tracks.forEach((t, i) =>
      rows.push([i + 1, t.timestamp || '', `"${(t.title || '').replace(/"/g, '""')}"`])
    );
    return rows.map((r) => r.join(',')).join('\n');
  };

  const exportJson = (tl) => {
    return JSON.stringify(
      {
        video: videoMetadata
          ? { title: videoMetadata.title, channel: videoMetadata.channelTitle, publishedAt: videoMetadata.publishedAt }
          : null,
        source: tl.isDescription ? 'description' : { author: tl.author },
        tracks: tl.tracks,
      },
      null,
      2
    );
  };

  const handleCopy = (tl, idx) => {
    window.electronAPI.copyToClipboard(exportTxt(tl));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSave = (tl, fmt) => {
    const content = fmt === 'txt' ? exportTxt(tl) : fmt === 'csv' ? exportCsv(tl) : exportJson(tl);
    const safeName = (videoMetadata?.title || 'tracklist')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .slice(0, 50);
    window.electronAPI.saveFile({ content, defaultName: `${safeName}.${fmt}`, ext: fmt });
  };

  const handleAuthorSubmit = async (e) => {
    e.preventDefault();
    const name = authorInput.trim();
    if (!name || !onAuthorSearch) return;
    setAuthorLoading(true);
    setAuthorError(null);
    const found = await onAuthorSearch(name);
    if (!found) setAuthorError(`No tracklist found from "${name}"`);
    setAuthorLoading(false);
  };

  if (!tracklists || tracklists.length === 0) {
    return (
      <>
        {videoMetadata && <VideoMetadataCard metadata={videoMetadata} videoId={videoId} />}
        <div className="mt-8 p-8 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-800">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">😕 No tracklists found</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm mt-2">
              Scanned {totalCommentsScanned} comments but couldn't find a tracklist.
            </p>
          </div>

          {onAuthorSearch && (
            <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-3">
                Know who posted the tracklist? Search by their username:
              </p>
              <form onSubmit={handleAuthorSubmit} className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  placeholder="e.g. @username"
                  disabled={authorLoading}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-purple-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={authorLoading || !authorInput.trim()}
                  className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
                >
                  {authorLoading ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Searching…
                    </>
                  ) : 'Search'}
                </button>
              </form>
              {authorError && (
                <p className="mt-3 text-center text-red-500 dark:text-red-400 text-sm">
                  😕 {authorError}
                </p>
              )}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {videoMetadata && <VideoMetadataCard metadata={videoMetadata} videoId={videoId} />}

      <p className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide">
        Found {tracklists.length} tracklist{tracklists.length > 1 ? 's' : ''} from{' '}
        {totalCommentsScanned} comments
      </p>

      {tracklists.map((tl, idx) => (
        <div
          key={idx}
          className={`bg-white border rounded-lg overflow-hidden transition-colors dark:bg-gray-900 ${
            expanded === idx ? 'border-purple-500 dark:border-purple-600' : 'border-gray-200 dark:border-gray-800'
          }`}
        >
          {/* Header row: expand button + optional source link */}
          <div className="flex items-stretch">
            <button
              onClick={() => setExpanded(expanded === idx ? -1 : idx)}
              className="flex-1 px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-purple-500 dark:text-purple-400 font-mono text-xs flex-shrink-0">
                  #{idx + 1}
                </span>
                {tl.isDescription ? (
                  <span className="text-xs bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700/50 rounded px-1.5 py-0.5 flex-shrink-0">
                    📄 Description
                  </span>
                ) : (
                  <span className="text-gray-700 dark:text-gray-300 text-sm truncate">{tl.author}</span>
                )}
                <span className="text-gray-400 dark:text-gray-600 text-xs flex-shrink-0">
                  {tl.tracks.length} tracks · 👍 {tl.likes}
                </span>
              </div>
              <span className="text-gray-400 dark:text-gray-600 text-xs ml-2 flex-shrink-0">
                {expanded === idx ? '▲' : '▼'}
              </span>
            </button>

            {/* Comment thread link — only for comment-sourced entries */}
            {!tl.isDescription && tl.commentId && (
              <button
                onClick={() => openCommentThread(tl.commentId)}
                className="px-4 border-l border-gray-200 dark:border-gray-800 text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-600 dark:hover:text-gray-300 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex-shrink-0 flex items-center"
                title="View source comment on YouTube"
              >
                ↗
              </button>
            )}
          </div>

          {/* Track list */}
          {expanded === idx && (
            <div className="px-5 pb-4 border-t border-gray-200 dark:border-gray-800">
              <table className="w-full mt-3">
                <tbody>
                  {tl.tracks.map((track, tIdx) => (
                    <tr
                      key={tIdx}
                      className="border-b border-gray-200/70 dark:border-gray-800/50 last:border-0"
                    >
                      <td className="py-2 pr-3 text-purple-500 dark:text-purple-400 font-mono text-xs w-16 align-top">
                        {track.timestamp ? (
                          <button
                            onClick={() => openAtTimestamp(track.timestamp)}
                            className="hover:text-purple-700 dark:hover:text-purple-200 hover:underline transition-colors cursor-pointer"
                            title="Open in YouTube"
                          >
                            {track.timestamp}
                          </button>
                        ) : '—'}
                      </td>
                      <td className="py-2 text-gray-700 dark:text-gray-200 text-sm">
                        {track.title}
                      </td>
                      <td className="py-2 pl-3 align-top">
                        <div className="flex gap-2">
                          <button
                            onClick={() => searchOnSpotify(track.title)}
                            className="text-[#1DB954] hover:text-[#1ed760] transition-colors cursor-pointer"
                            title={`Search "${track.title}" on Spotify`}
                          >
                            <SpotifyIcon />
                          </button>
                          <button
                            onClick={() => searchOnSoundCloud(track.title)}
                            className="text-[#ff5500] hover:text-[#ff7700] transition-colors cursor-pointer"
                            title={`Search "${track.title}" on SoundCloud`}
                          >
                            <SoundCloudIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Export */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-gray-400 dark:text-gray-600 text-xs">Export:</span>
                <button
                  onClick={() => handleCopy(tl, idx)}
                  className={`text-xs px-2 py-1 rounded border transition-colors cursor-pointer ${
                    copiedIdx === idx
                      ? 'border-green-500 text-green-600 dark:border-green-600 dark:text-green-400'
                      : 'border-gray-300 text-gray-400 hover:text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {copiedIdx === idx ? '✓ Copied' : '📋 Copy'}
                </button>
                {['txt', 'csv', 'json'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleSave(tl, fmt)}
                    className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-400 hover:text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                  >
                    .{fmt}
                  </button>
                ))}
              </div>

              {/* Raw comment toggle */}
              <details className="mt-4">
                <summary className="text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 text-xs cursor-pointer transition-colors">
                  Show raw {tl.isDescription ? 'description' : 'comment'}
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-950 rounded text-xs text-gray-500 whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                  {tl.text}
                </pre>
              </details>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

