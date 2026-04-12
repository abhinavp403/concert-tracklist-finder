import React from 'react';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function HistoryPanel({ history, onSelect, onDelete, onToggleFavorite }) {
  const sorted = [...history].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return new Date(b.searchedAt) - new Date(a.searchedAt);
  });

  return (
    <div className="mt-4 space-y-2">
      {sorted.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-3 bg-white border border-gray-200 hover:border-gray-300 rounded-lg px-4 py-3 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700 transition-colors"
        >
          {entry.videoMetadata?.thumbnailUrl ? (
            <img
              src={entry.videoMetadata.thumbnailUrl}
              alt=""
              className="w-16 rounded flex-shrink-0 object-cover"
              style={{ height: '36px' }}
            />
          ) : (
            <div className="w-16 flex-shrink-0 flex items-center justify-center text-gray-400 dark:text-gray-600 text-xl" style={{ height: '36px' }}>
              🎵
            </div>
          )}

          <button onClick={() => onSelect(entry)} className="flex-1 text-left min-w-0 cursor-pointer">
            <p className="text-gray-800 dark:text-gray-200 text-sm truncate">
              {entry.videoMetadata?.title || entry.videoId}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
              {entry.videoMetadata?.channelTitle && (
                <span>{entry.videoMetadata.channelTitle} · </span>
              )}
              {timeAgo(entry.searchedAt)}
            </p>
          </button>

          <button
            onClick={() => onToggleFavorite(entry.id)}
            className={`flex-shrink-0 text-lg transition-colors cursor-pointer ${
              entry.favorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400 dark:text-gray-700 dark:hover:text-yellow-400'
            }`}
            title={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            ★
          </button>

          <button
            onClick={() => onDelete(entry.id)}
            className="flex-shrink-0 text-gray-300 hover:text-red-400 dark:text-gray-700 dark:hover:text-red-400 transition-colors cursor-pointer text-sm"
            title="Remove from history"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
