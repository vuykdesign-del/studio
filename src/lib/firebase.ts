import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Use emulator if in development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    // Check if emulator is already running
    if (!((db as any)._settings.host.includes('localhost'))) {
        try {
            console.log("Connecting to Firestore emulator");
            connectFirestoreEmulator(db, 'localhost', 8080);
        } catch (e) {
            console.error(e);
        }
    }
}


const contractionsCollection = collection(db, "contractions");

export { db, contractionsCollection };
