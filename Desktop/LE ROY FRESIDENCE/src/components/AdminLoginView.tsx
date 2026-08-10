import React, { useState, useEffect } from 'react';
import { loginWithGoogle, auth, onAuthStateChanged } from '../firebase';

interface AdminLoginViewProps {
  onSuccess: () => void;
  onCancel: () => void;
  mode?: 'login' | 'logout';
}

const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onSuccess, onCancel, mode = 'login' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState('');

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // El código original era 2024 o similar
    if (pin === '2024' || pin === 'LEROY2024') {
      onSuccess();
    } else {
      setError('Código incorrecto. Por favor intente de nuevo.');
      setPin('');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle();
      if (result.user.email !== 'janiceleroy@gmail.com') {
        setError(`Acceso denegado: La cuenta ${result.user.email} no está autorizada. Usa janiceleroy@gmail.com.`);
        await auth.signOut();
      } else {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Se cerró la ventana de inicio de sesión antes de completar.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(`Este dominio (${window.location.hostname}) no está autorizado en Firebase. Por favor, agrégalo en la consola.`);
      } else {
        setError(`Error al iniciar sesión: ${err.message || 'Error desconocido'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Background Blur Overlay */}
      <div className="absolute inset-0 bg-leroy-black/40 backdrop-blur-md" onClick={onCancel}></div>
      
      {/* Login Card */}
      <div className="relative bg-white w-full max-w-md p-8 shadow-2xl border border-gray-100 animate-fadeIn">
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl text-leroy-black mb-2">
            {mode === 'login' ? 'Acceso Administrador' : 'Confirmar Salida'}
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {mode === 'login' ? 'Identifícate con tu cuenta de Google' : 'Cierra tu sesión de forma segura'}
          </p>
        </div>

        <div className="space-y-6">
          {mode === 'login' ? (
            <form onSubmit={handlePinLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Código de Acceso</label>
                <input 
                  autoFocus
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full border-b border-gray-200 py-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-leroy-orange transition-colors"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-leroy-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-leroy-orange transition-all shadow-lg"
              >
                Entrar con Código
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-[8px] uppercase tracking-widest">
                  <span className="bg-white px-4 text-leroy-orange font-bold">Recomendado para Sincronización Cloud</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-4 bg-leroy-black text-white py-4 px-6 hover:bg-leroy-orange transition-all group shadow-lg"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-700">
                  {isLoading ? 'Conectando...' : 'Entrar con Google'}
                </span>
              </button>
            </form>
          ) : (
            <button 
              onClick={onSuccess}
              className="w-full bg-leroy-orange text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-leroy-black transition-all shadow-lg"
            >
              Cerrar Sesión
            </button>
          )}

          {error && (
            <p className="text-center text-[9px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
              {error}
            </p>
          )}

          <button 
            type="button"
            onClick={onCancel}
            className="w-full text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-leroy-black transition-colors"
          >
            Cancelar
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <span className="font-serif italic text-gray-300 text-sm">LeRoy Residence Security System</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginView;
