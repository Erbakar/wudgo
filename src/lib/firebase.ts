import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
// @ts-ignore
import firebaseAppletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseAppletConfig?.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig?.authDomain,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig?.projectId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig?.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig?.messagingSenderId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || firebaseAppletConfig?.appId,
};

const app = initializeApp(firebaseConfig);

// Database ID handles with priority: ENV > CONFIG > (default)
const databaseId = (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || firebaseAppletConfig?.firestoreDatabaseId || '(default)';

export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// --- Error Handling & Debugging ---

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    providerInfo: any[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Specific check for unauthorized domain
  if (errorMessage.includes('auth/unauthorized-domain')) {
    console.error('CRITICAL: Bu domain (wutgo.netlify.app vb.) Firebase Console üzerinden yetkilendirilmemiş. ');
    console.error('Çözüm: Firebase Console > Authentication > Settings > Authorized Domains kısmına bu adresi ekleyin.');
    alert('Hata: Bu site Firebase üzerinde yetkilendirilmemiş. Lütfen Firebase Console üzerinden domain ayarlarını yapın.');
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL: Call getFromServer to test the connection.
async function testConnection() {
  try {
    // Only test if we have a config
    if (firebaseConfig.apiKey) {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firestore connection successful");
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || msg.includes('network-error')) {
      console.error("Firebase çevrimdışı veya bağlantı hatası. Lütfen API key'lerin ve Authorized Domains ayarlarının doğru olduğunu kontrol edin.");
    } else if (msg.includes('permission-denied')) {
       console.log("Firestore yetki hatası (normal olabilir)");
    } else {
      console.warn("Firestore connection test failed:", error);
    }
  }
}

testConnection();
