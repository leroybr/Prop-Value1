import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FirebaseProvider } from './components/FirebaseProvider.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <FirebaseProvider>
          <App />
        </FirebaseProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}