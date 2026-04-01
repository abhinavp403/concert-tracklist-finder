const fs = require('fs');

class HistoryStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  read() {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch {
      return [];
    }
  }

  write(entries) {
    fs.writeFileSync(this.filePath, JSON.stringify(entries, null, 2), 'utf8');
  }

  add(entry) {
    const existing = this.read();
    // Preserve the favorite flag if this video was saved before
    const prev = existing.find((e) => e.videoId === entry.videoId);
    const updated = [
      { ...entry, id: entry.videoId, favorite: prev?.favorite ?? false },
      ...existing.filter((e) => e.videoId !== entry.videoId),
    ].slice(0, 50);
    this.write(updated);
    return updated;
  }

  remove(id) {
    const updated = this.read().filter((e) => e.id !== id);
    this.write(updated);
    return updated;
  }

  toggleFavorite(id) {
    const updated = this.read().map((e) =>
      e.id === id ? { ...e, favorite: !e.favorite } : e
    );
    this.write(updated);
    return updated;
  }
}

module.exports = HistoryStore;
