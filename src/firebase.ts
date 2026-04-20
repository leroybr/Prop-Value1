import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Usamos las variables de entorno configuradas en Vercel, con fallback al JSON local
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId;

// Debug log to check if keys are present (obfuscated)
console.log("Firebase Config Check:", {
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId,
  hasApiKey: !!firebaseConfig.apiKey,
  apiKeyPrefix: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 6)}...` : "MISSING",
  source: import.meta.env.VITE_FIREBASE_API_KEY ? "Environment" : "JSON Fallback"
});

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined") {
  console.error("CRITICAL ERROR: Firebase API Key is missing! Check your Vercel Environment Variables or firebase-applet-config.json.");
}

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use initializeFirestore with settings and databaseId
// We use experimentalForceLongPolling and useFetchStreams: false to maximize compatibility
// in restricted network environments (like some corporate proxies or sandboxes)
const dbSettings = {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  ignoreUndefinedProperties: true,
};

// If firestoreDatabaseId is empty or undefined, Firestore uses '(default)'
export const db = initializeFirestore(app, dbSettings, firestoreDatabaseId || '(default)');

export const googleProvider = new GoogleAuthProvider();

// Auth helpers
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test with detailed logging
async function testConnection() {
  console.log("Starting Firestore connection test...");
  try {
    // Try to get a document from the server to verify connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test: SUCCESS (Server reached)");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Firestore connection test: FAILED", {
      error: message,
      projectId: firebaseConfig.projectId,
      databaseId: firestoreDatabaseId || '(default)'
    });
    
    if (message.includes('the client is offline')) {
      console.error("CRITICAL: The client is offline. This usually means the Firebase configuration (Project ID or Database ID) is incorrect or the database hasn't been provisioned.");
    }
  }
}
testConnection();
