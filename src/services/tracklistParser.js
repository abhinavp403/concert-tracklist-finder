// Tracklist parser – detects tracklist patterns in YouTube comments

// Timestamp pattern: matches 0:00, 00:00, 1:23:45, etc.
const TIMESTAMP_RE = /(?:^|\s)(\d{1,2}:\d{2}(?::\d{2})?)\s*/gm;

// Keywords that suggest a tracklist
const TRACKLIST_KEYWORDS = [
  'tracklist', 'track list', 'setlist', 'set list', 'playlist',
  'song list', 'songs:', 'tracks:', 'set:', 'lineup',
];

function scoreComment(comment) {
  const text = comment.text;
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  // Count timestamp occurrences
  const timestamps = text.match(TIMESTAMP_RE) || [];
  const timestampCount = timestamps.length;

  // Check for tracklist keywords (case-insensitive)
  const lower = text.toLowerCase();
  const keywordHits = TRACKLIST_KEYWORDS.filter((kw) => lower.includes(kw)).length;

  // Count numbered list entries (e.g., "1.", "2.", "01.")
  const numberedLines = lines.filter((l) => /^\s*\d{1,3}[\.\)\-\:]/.test(l)).length;

  // Heuristic: need at least 3 timestamps OR 3 numbered items to be a tracklist
  if (timestampCount < 3 && numberedLines < 3 && keywordHits === 0) {
    return 0;
  }

  const score =
    timestampCount * 3 +
    numberedLines * 2 +
    keywordHits * 5 +
    Math.min(comment.likes, 50) * 0.1 +
    Math.min(lines.length, 40) * 0.2;

  return score;
}

function parseTrackEntries(text) {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const entries = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Try to match: timestamp followed by track name
    const tsMatch = trimmed.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]?\s*(.+)/);
    if (tsMatch) {
      entries.push({ timestamp: tsMatch[1], title: tsMatch[2].trim() });
      continue;
    }

    // Try: track name followed by timestamp
    const tsEndMatch = trimmed.match(/^(.+?)\s*[-–—]?\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*$/);
    if (tsEndMatch && tsEndMatch[1].trim().length > 1) {
      entries.push({ timestamp: tsEndMatch[2], title: tsEndMatch[1].trim() });
      continue;
    }

    // Try: numbered list entry (e.g., "1. Song Name" or "1) Song Name")
    const numMatch = trimmed.match(/^\d{1,3}[\.\)\-\:]\s*(.+)/);
    if (numMatch) {
      // Check if this numbered entry also has a timestamp
      const inner = numMatch[1];
      const innerTs = inner.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]?\s*(.+)/);
      if (innerTs) {
        entries.push({ timestamp: innerTs[1], title: innerTs[2].trim() });
      } else {
        entries.push({ timestamp: null, title: inner.trim() });
      }
      continue;
    }
  }

  return entries;
}

function findTracklists(comments) {
  const scored = comments
    .map((comment) => ({
      ...comment,
      score: scoreComment(comment),
      tracks: parseTrackEntries(comment.text),
    }))
    .filter((c) => c.score > 0 && c.tracks.length >= 2)
    .sort((a, b) => b.score - a.score);

  // Return top 5 candidates
  return scored.slice(0, 5);
}

module.exports = { findTracklists, scoreComment, parseTrackEntries };
