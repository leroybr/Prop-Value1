import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ErrorBoundary component to catch and display runtime errors gracefully.
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error (ErrorBoundary):', error, errorInfo);
  }

  // Handle unhandled promise rejections
  private handlePromiseRejection = (event: PromiseRejectionEvent) => {
    if (event.defaultPrevented) return;

    try {
      const reason = event.reason;
      const message = reason?.message || String(reason) || '';
      const code = reason?.code || '';
      const name = reason?.name || '';
      const stack = reason?.stack || '';

      // Expanded suppression list for background/platform errors in AI Studio sandbox
      const isSuppressedError = 
        message.toLowerCase().includes('installations') || 
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('403') ||
        message.toLowerCase().includes('interaction') ||
        message.toLowerCase().includes('not allowed') ||
        message.toLowerCase().includes('indexeddb') ||
        message.toLowerCase().includes('identitytoolkit') ||
        message.toLowerCase().includes('getprojectconfig') ||
        message.toLowerCase().includes('projectconfigservice') ||
        message.toLowerCase().includes('securetoken') ||
        message.toLowerCase().includes('googleapis') ||
        message.toLowerCase().includes('heartbeat') ||
        message.toLowerCase().includes('appcheck') ||
        message.toLowerCase().includes('blocked') ||
        message.toLowerCase().includes('cross-origin') ||
        message.toLowerCase().includes('failed to fetch') ||
        message.toLowerCase().includes('networkerror') ||
        message.toLowerCase().includes('resizeobserver') ||
        message.toLowerCase().includes('resize observer') ||
        message.toLowerCase().includes('analytics') ||
        message.toLowerCase().includes('extension') ||
        message.toLowerCase().includes('maps.googleapis') ||
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('storage') ||
        code.includes('installations') ||
        code.includes('permission') ||
        code.includes('auth/network-error') ||
        code.includes('auth/requests-to-this-api-identitytoolkit-method') ||
        code.includes('identitytoolkit') ||
        code.includes('failed-precondition') ||
        name.includes('Installations') ||
        stack.toLowerCase().includes('extension');

      if (isSuppressedError) {
        // Silently swallow these background errors as they don't break the actual app logic
        // but can trigger the ErrorBoundary incorrectly.
        console.debug('[ErrorBoundary] Suppressed background rejection:', message || code);
        event.preventDefault();
        return;
      }
    } catch (err) {
      // Fallback
    }

    console.debug('Background promise rejection (logged but not breaking UI):', event.reason);
    // REMOVED: this.setState({ hasError: true }) to prevent background noise from crashing the whole app
  };

  private handleGlobalError = (event: ErrorEvent) => {
    try {
      const message = event.message || '';
      if (message.toLowerCase().includes('identitytoolkit') || 
          message.toLowerCase().includes('getprojectconfig') ||
          message.toLowerCase().includes('googleapis') ||
          message.toLowerCase().includes('securetoken') ||
          message.toLowerCase().includes('blocked') ||
          message.toLowerCase().includes('resizeobserver') ||
          message.toLowerCase().includes('extension') ||
          message.toLowerCase().includes('failed to fetch') ||
          message.toLowerCase().includes('networkerror') ||
          message.toLowerCase().includes('script error')) {
        console.debug('[ErrorBoundary] Suppressed global error:', message);
        event.preventDefault();
        return;
      }
    } catch (err) {
      // Fallback
    }
  };

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    window.addEventListener('error', this.handleGlobalError);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Lo sentimos, ha ocurrido un error inesperado.";
      
      try {
        if (this.state.error) {
          const message = this.state.error.message || String(this.state.error);
          // Attempt to parse Firestore error if it's a JSON string
          if (message.startsWith('{')) {
            try {
              const firestoreError = JSON.parse(message);
              if (firestoreError && typeof firestoreError === 'object' && firestoreError.error) {
                errorMessage = `Error de base de datos (${firestoreError.operationType || 'operación'}): ${firestoreError.error}`;
              }
            } catch (e) {
              errorMessage = message;
            }
          } else {
            errorMessage = message;
          }
        }
      } catch (e) {
        console.warn("ErrorBoundary: Failed to process error message", e);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Ups! Algo salió mal</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition-colors"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
