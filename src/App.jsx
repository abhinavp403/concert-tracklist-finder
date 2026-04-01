import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase.js';
import {
  loadCloudHistory,
  addToCloudHistory,
  removeFromCloudHistory,
  toggleCloudFavorite,
  migrateToCloud,
} from './services/cloudHistory.js';
import SearchBar from './components/SearchBar';
import TracklistResults from './components/TracklistResults';
import HistoryPanel from './components/HistoryPanel';
import AuthScreen from './components/AuthScreen';

export default function App() {
  // null = auth state still loading, false = signed out, object = signed-in user
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? false);
    });
    return unsubscribe;
  }, []);

  // Load history when auth state resolves, migrating local history to cloud on sign-in
  useEffect(() => {
    if (user === null) return;
    if (user) {
      (async () => {
        const [cloudHistory, localHistory] = await Promise.all([
          loadCloudHistory(user.uid),
          window.electronAPI.loadHistory(),
        ]);
        // Merge any local-only entries into Firestore so nothing is lost
        const merged = await migrateToCloud(user.uid, localHistory, cloudHistory);
        setHistory(merged);
      })();
    } else if (isGuest) {
      window.electronAPI.loadHistory().then(setHistory);
    }
  }, [user, isGuest]);

  const handleSearch = async (url) => {
    setShowHistory(false);
    setLoading(true);
    setError(null);
    setResults(null);
    setCurrentUrl(url);

    try {
      const res = await window.electronAPI.searchTracklist(url);
      if (res.error) {
        setError(res.error);
      } else {
        setResults(res);
        const entry = { ...res, searchUrl: url, searchedAt: new Date().toISOString() };
        if (user) {
          addToCloudHistory(user.uid, entry).then(setHistory);
        } else {
          window.electronAPI.saveToHistory(entry).then(setHistory);
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Searches comments by a specific author username. Returns true if found.
  const handleAuthorSearch = async (authorName) => {
    if (!currentUrl) return false;
    try {
      const res = await window.electronAPI.searchByAuthor(currentUrl, authorName);
      if (res.error) return false;
      setResults(res);
      return res.tracklists && res.tracklists.length > 0;
    } catch {
      return false;
    }
  };

  const handleHistorySelect = (entry) => {
    setResults(entry);
    setCurrentUrl(entry.searchUrl ?? null);
    setShowHistory(false);
    setError(null);
  };

  const handleDeleteHistory = (id) => {
    if (user) {
      removeFromCloudHistory(user.uid, id).then(setHistory);
    } else {
      window.electronAPI.deleteHistoryItem(id).then(setHistory);
    }
  };

  const handleToggleFavorite = (id) => {
    if (user) {
      const entry = history.find(e => e.id === id);
      toggleCloudFavorite(user.uid, id, entry?.favorite ?? false).then(setHistory);
    } else {
      window.electronAPI.toggleFavorite(id).then(setHistory);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setHistory([]);
    setResults(null);
    setError(null);
    setCurrentUrl(null);
    setShowHistory(false);
    setIsGuest(false);
  };

  // Spinner while Firebase resolves the initial auth state
  if (user === null) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center${isDark ? ' dark' : ''}`}>
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auth screen when signed out and not in guest mode
  if (user === false && !isGuest) {
    return (
      <AuthScreen
        onGuest={() => setIsGuest(true)}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100${isDark ? ' dark' : ''}`}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Top bar: theme toggle | spacer | user info + history */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={toggleTheme}
              className="text-lg w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            <div className="flex items-center gap-2">
              {user && (
                <>
                  <span className="text-xs text-gray-400 dark:text-gray-600 hidden sm:inline truncate max-w-[140px]" title={user.email}>
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs px-2 py-1.5 rounded-md border border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-400 dark:border-gray-700 dark:text-gray-500 dark:hover:text-red-400 dark:hover:border-red-700 transition-colors cursor-pointer"
                    title="Sign out"
                  >
                    Sign out
                  </button>
                </>
              )}
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors cursor-pointer ${
                    showHistory
                      ? 'bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                      : 'border-gray-300 text-gray-400 hover:text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  📂 History ({history.length})
                </button>
              )}
            </div>
          </div>

          {/* Title + subtitle */}
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎵 Concert Tracklist Finder
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Paste a YouTube concert URL to find tracklists from comments
            </p>
          </div>
        </div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* History panel */}
        {showHistory && (
          <HistoryPanel
            history={history}
            onSelect={handleHistorySelect}
            onDelete={handleDeleteHistory}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* Error */}
        {!showHistory && error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-600 text-sm dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {!showHistory && loading && (
          <div className="mt-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-gray-400 dark:text-gray-400 text-sm">
              Scanning comments for tracklists…
            </p>
          </div>
        )}

        {/* Results */}
        {!showHistory && results && !loading && <TracklistResults data={results} onAuthorSearch={handleAuthorSearch} />}
      </div>
    </div>
  );
}


