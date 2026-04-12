// YouTube Data API v3 – comment fetcher and video metadata
// Fetches top-level comments, paginating up to ~500 comments

const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 400) {
          try {
            const body = JSON.parse(data);
            const msg = body.error?.message || `HTTP ${res.statusCode}`;
            reject(new Error(msg));
          } catch {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
          return;
        }
        resolve(JSON.parse(data));
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchComments(videoId, apiKey, maxPages = 10) {
  const comments = [];
  let pageToken = '';

  for (let page = 0; page < maxPages; page++) {
    const url =
      `https://www.googleapis.com/youtube/v3/commentThreads` +
      `?part=snippet` +
      `&videoId=${encodeURIComponent(videoId)}` +
      `&maxResults=100` +
      `&order=relevance` +
      `&textFormat=plainText` +
      `&key=${encodeURIComponent(apiKey)}` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');

    const data = await httpsGet(url);

    for (const item of data.items || []) {
      const snippet = item.snippet?.topLevelComment?.snippet;
      if (snippet) {
        comments.push({
          author: snippet.authorDisplayName,
          text: snippet.textDisplay,
          likes: snippet.likeCount || 0,
          publishedAt: snippet.publishedAt,
          commentId: item.snippet.topLevelComment.id,
        });
      }
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return comments;
}

async function fetchVideoMetadata(videoId, apiKey) {
  const url =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?part=snippet` +
    `&id=${encodeURIComponent(videoId)}` +
    `&key=${encodeURIComponent(apiKey)}`;

  const data = await httpsGet(url);
  const item = data.items?.[0];
  if (!item) return null;

  const snippet = item.snippet;
  const thumbnails = snippet.thumbnails;
  return {
    title: snippet.title,
    channelTitle: snippet.channelTitle,
    publishedAt: snippet.publishedAt,
    thumbnailUrl: thumbnails?.medium?.url || thumbnails?.default?.url || null,
    description: snippet.description || '',
  };
}

module.exports = { fetchComments, fetchVideoMetadata };
