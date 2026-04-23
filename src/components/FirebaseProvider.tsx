import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  authActionLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            const userData: any = {
              uid: currentUser.uid,
              email: currentUser.email,
              createdAt: serverTimestamp(),
              role: 'user'
            };
            if (currentUser.displayName) userData.displayName = currentUser.displayName;
            if (currentUser.photoURL) userData.photoURL = currentUser.photoURL;
            
            await setDoc(userRef, userData);
          }
        } catch (error: any) {
          if (!error.message?.includes('offline')) {
            console.error("Error syncing user profile:", error);
          } else {
            console.warn("Profile sync postponed: Client is currently offline.");
          }
          // Don't throw here to avoid blocking the app, but log it
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (authActionLoading) return;
    
    setAuthActionLoading(true);
    setError(null);
    try {
      console.log("Initiating Google Login...");
      await loginWithGoogle();
      console.log("Login successful");
    } catch (error: any) {
      console.error("DEBUG - Login Error Code:", error.code);
      console.error("DEBUG - Login Error Message:", error.message);
      
      if (error.code === 'auth/popup-blocked') {
        setError("El navegador bloqueó la ventana de inicio de sesión. Por favor, permite las ventanas emergentes (popups) para este sitio.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.warn("Popup request cancelled.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setError("Error de configuración: Este dominio no está autorizado en la consola de Firebase. Debes agregar '" + window.location.hostname + "' a los dominios autorizados.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setError("Error de configuración: El proveedor de Google no está habilitado en tu consola de Firebase.");
      } else {
        setError("Error (" + error.code + "): " + (error.message || "Error desconocido"));
      }
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, authActionLoading, error, setError, login: handleLogin, logout: handleLogout }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
