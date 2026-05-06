import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
// @ts-ignore
import firebaseAppletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyAG3-7ZOOO5XNZ7k_M0zecIFxRftZ8Jcp0",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "kadirerbakar-1507893838072.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "kadirerbakar-1507893838072",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "kadirerbakar-1507893838072.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "270658559422",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:270658559422:web:2d5c1eb9e49a8e59c4adef",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();