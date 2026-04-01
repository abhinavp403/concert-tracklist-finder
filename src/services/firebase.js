import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBUJ5ilAiCFQBrx4RXuHyuKPlyS3AogfaQ",
  authDomain: "concert-tracklist-finder.firebaseapp.com",
  projectId: "concert-tracklist-finder",
  storageBucket: "concert-tracklist-finder.firebasestorage.app",
  messagingSenderId: "651397772458",
  appId: "1:651397772458:web:5fa2c846ca191c9e12ccd3",
};

const app = initializeApp(firebaseConfig);

// browserLocalPersistence keeps the user signed in across app restarts
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

export const db = getFirestore(app);
