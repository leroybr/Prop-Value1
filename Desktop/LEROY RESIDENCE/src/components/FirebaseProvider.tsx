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
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if guest mode was previously selected
    const isGuestStored = localStorage.getItem('prop_value_guest_mode') === 'true';
    if (isGuestStored) {
      setUser({
        uid: 'guest-local',
        email: 'invitado@propvalue.cl',
        displayName: 'Invitado Local',
        emailVerified: true,
        isAnonymous: true,
        photoURL: 'https://ui-avatars.com/api/?name=Invitado&background=0284c7&color=fff'
      } as any);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If we are in guest mode, don't let onAuthStateChanged sign us out or clear user unless they manually log out
      if (localStorage.getItem('prop_value_guest_mode') === 'true') {
        setLoading(false);
        return;
      }

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

  const loginAsGuest = () => {
    setError(null);
    localStorage.setItem('prop_value_guest_mode', 'true');
    setUser({
      uid: 'guest-local',
      email: 'invitado@propvalue.cl',
      displayName: 'Invitado Local',
      emailVerified: true,
      isAnonymous: true,
      photoURL: 'https://ui-avatars.com/api/?name=Invitado&background=0284c7&color=fff'
    } as any);
    setLoading(false);
  };

  const handleLogin = async () => {
    if (authActionLoading) return;
    
    setAuthActionLoading(true);
    setError(null);
    try {
      localStorage.removeItem('prop_value_guest_mode');
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
        const domain = window.location.hostname;
        setError(`Error de configuración: Este dominio (${domain}) no está autorizado en la consola de Firebase. Debes agregarlo en Authentication > Settings > Authorized Domains.`);
      } else if (error.code === 'auth/operation-not-allowed') {
        setError("Error de configuración: El proveedor de Google no está habilitado en tu consola de Firebase.");
      } else if (error.code?.includes('identitytoolkit') || error.message?.includes('identitytoolkit') || error.message?.includes('getprojectconfig')) {
        setError("La API de Autenticación de Google/Firebase está temporalmente restringida en la Consola de Cloud. Puedes ingresar usando el 'Modo Invitado' para continuar sin restricciones.");
        console.warn("Suppressed background identitytoolkit error:", error);
      } else {
        setError("Error (" + error.code + "): " + (error.message || "Error desconocido"));
      }
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('prop_value_guest_mode');
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setUser(null);
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, authActionLoading, error, setError, login: handleLogin, loginAsGuest, logout: handleLogout }}>
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
