import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { initializeFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot, serverTimestamp, getDocFromServer } from "firebase/firestore";
import firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: "AIzaSyArRSsiRFswNi7FaGMROnlpOKsvlrwfVuY",
  authDomain: "prop-value.firebaseapp.com",
  projectId: "prop-value",
  storageBucket: "prop-value.firebasestorage.app",
  messagingSenderId: "373190765598",
  appId: "1:373190765598:web:0d41a13f36afc3d814920f",
  measurementId: "G-K5QEZVTT7T"
};

// Evita inicializar múltiples veces (causa común de Error Boundary)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportar servicios de forma segura
export const auth = getAuth(app);

// Analytics solo si es compatible (evita errores en SSR/Vercel)
export const analytics = typeof window !== "undefined" ? isSupported().then(yes => yes ? getAnalytics(app) : null).catch(() => null) : null;

// Ajustes de red CRÍTICOS para evitar el estado "offline" en el iframe
const dbSettings = {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  ignoreUndefinedProperties: true,
};

// Inicializar Firestore con configuraciones personalizadas y especificar el ID de base de datos
export const db = initializeFirestore(app, dbSettings, firebaseConfigJson.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Si el usuario cierra la ventana o se cancela la petición, no disparamos un error fatal
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      console.warn("Inicio de sesión cancelado por el usuario.");
      return null;
    }
    console.error("Error al iniciar sesión con Google:", error);
    throw error;
  }
};

// Helper para cerrar sesión
export const logout = () => signOut(auth);

// Manejador de errores para Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const authInfo = {
    userId: auth.currentUser?.uid || 'anonymous',
    email: auth.currentUser?.email || '',
    emailVerified: auth.currentUser?.emailVerified || false,
    isAnonymous: auth.currentUser?.isAnonymous || false,
    providerInfo: auth.currentUser?.providerData.map(p => ({
      providerId: p.providerId,
      displayName: p.displayName || '',
      email: p.email || '',
    })) || []
  };

  const errorInfo = {
    error: message,
    operationType,
    path,
    authInfo
  };

  const errorString = JSON.stringify(errorInfo);
  console.error(`Firestore Error [${operationType}] en ${path}:`, errorString);
  throw new Error(errorString);
}

// Re-exportamos funciones necesarias para App.tsx y otros componentes
export { 
  collection, addDoc, doc, setDoc, getDoc, getDocs, 
  query, where, orderBy, limit, onSnapshot, 
  serverTimestamp, onAuthStateChanged, getDocFromServer
};
export type { User };

export default app;
