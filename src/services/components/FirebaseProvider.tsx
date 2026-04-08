import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  authActionLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [authActionLoading, setAuthActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
              role: 'user' // Default role
            });
          }
        } catch (error) {
          console.error("Error syncing user profile:", error);
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
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("El navegador bloqueó la ventana de inicio de sesión. Por favor, permite las ventanas emergentes (popups) para este sitio.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Silently ignore or log - usually means user closed the window or clicked twice
        console.warn("Popup request cancelled or another one was pending.");
      } else if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
        alert("Hubo un error interno en la conexión con Google. Por favor, refresca la página e intenta de nuevo.");
      } else {
        alert("No se pudo iniciar sesión: " + (error.message || "Error desconocido"));
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
    <FirebaseContext.Provider value={{ user, loading, authActionLoading, login: handleLogin, logout: handleLogout }}>
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
