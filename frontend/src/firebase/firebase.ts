import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration for GeoGuard AI
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAUEE1gC3r_ahb63xHyKK4A9wsEhPbSbnQ",
  authDomain: "geoguard-a16a6.firebaseapp.com",
  projectId: "geoguard-a16a6",
  storageBucket: "geoguard-a16a6.firebasestorage.app",
  messagingSenderId: "512841674512",
  appId: "1:512841674512:web:529bf6d1eedaaacdf9ff95",
  measurementId: "G-RVGS1G76LJ"
};

// Initialize Firebase App as a single instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and Google Auth Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider options
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Verification Console Logs
console.log('🔥 [Firebase Auth] Initialized successfully!');
console.log(`📌 [Firebase Auth] Project ID: ${firebaseConfig.projectId}`);
console.log(`🔑 [Firebase Auth] Active API Key: ${firebaseConfig.apiKey.substring(0, 10)}...`);

export default app;
