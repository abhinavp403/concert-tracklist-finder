import React, { useState } from 'react';

export default function SearchBar({ onSearch, loading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim() && !loading) {
      onSearch(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        disabled={loading}
        className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-600"
      />
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 rounded-lg font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? 'Searching…' : 'Find Tracklist'}
      </button>
    </form>
  );
}

