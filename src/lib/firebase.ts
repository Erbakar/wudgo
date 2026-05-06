import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// @ts-ignore
import firebaseAppletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseAppletConfig?.apiKey || "AIzaSyAG3-7ZOOO5XNZ7k_M0zecIFxRftZ8Jcp0",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig?.authDomain || "kadirerbakar-1507893838072.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig?.projectId || "kadirerbakar-1507893838072",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig?.storageBucket || "kadirerbakar-1507893838072.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig?.messagingSenderId || "270658559422",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || firebaseAppletConfig?.appId || "1:270658559422:web:2d5c1eb9e49a8e59c4adef",
};

const app = initializeApp(firebaseConfig);

// Database ID handles with priority: ENV > CONFIG > (default)
const databaseId = (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || firebaseAppletConfig?.firestoreDatabaseId || '(default)';

export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
