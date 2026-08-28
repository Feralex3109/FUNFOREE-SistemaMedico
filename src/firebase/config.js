import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD0T6lscGy7LUqnbgPBWpjNFt8TzTgmu5Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "system-of-medical.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "system-of-medical",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "system-of-medical.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "312691646728",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:312691646728:web:8409338f8a4286626c4cbd",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XNLNNZE0ZZ",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch(() => undefined);

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain
);

export default app;
