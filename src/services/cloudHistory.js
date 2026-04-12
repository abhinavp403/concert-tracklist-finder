import { db } from './firebase.js';
import {
  collection, doc, setDoc, deleteDoc, getDoc, getDocs,
  query, orderBy, limit,
} from 'firebase/firestore';

const MAX_HISTORY = 50;

const histRef = (uid, videoId) => doc(db, 'users', uid, 'history', videoId);
const histCol = (uid) => collection(db, 'users', uid, 'history');

export async function loadCloudHistory(uid) {
  const q = query(histCol(uid), orderBy('searchedAt', 'desc'), limit(MAX_HISTORY));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

export async function addToCloudHistory(uid, entry) {
  // Preserve existing favorite flag if the video was searched before
  const existing = await getDoc(histRef(uid, entry.videoId));
  const favorite = existing.exists() ? (existing.data().favorite ?? false) : false;
  await setDoc(histRef(uid, entry.videoId), { ...entry, id: entry.videoId, favorite });
  return loadCloudHistory(uid);
}

export async function removeFromCloudHistory(uid, videoId) {
  await deleteDoc(histRef(uid, videoId));
  return loadCloudHistory(uid);
}

export async function toggleCloudFavorite(uid, videoId, currentFavorite) {
  await setDoc(histRef(uid, videoId), { favorite: !currentFavorite }, { merge: true });
  return loadCloudHistory(uid);
}

// Uploads any local history entries that aren't already in Firestore.
// Called once on sign-in so existing history isn't lost.
export async function migrateToCloud(uid, localEntries, existingCloudEntries) {
  const cloudIds = new Set(existingCloudEntries.map(e => e.videoId || e.id));
  const toMigrate = localEntries.filter(e => !cloudIds.has(e.videoId || e.id));
  if (toMigrate.length === 0) return existingCloudEntries;
  await Promise.all(
    toMigrate.map(entry =>
      setDoc(histRef(uid, entry.videoId || entry.id), {
        ...entry,
        id: entry.videoId || entry.id,
        favorite: entry.favorite ?? false,
      })
    )
  );
  return loadCloudHistory(uid);
}
