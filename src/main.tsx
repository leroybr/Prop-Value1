import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FirebaseProvider } from './components/FirebaseProvider';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
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