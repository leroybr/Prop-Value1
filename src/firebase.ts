import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

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
export const db = getFirestore(app);

// Analytics solo si es compatible (evita errores en SSR/Vercel)
export const analytics = typeof window !== "undefined" ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Si el usuario cierra la ventana, no disparamos un error fatal
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      return null;
    }
    throw error;
  }
};

export const logout = () => signOut(auth);

export default app;
