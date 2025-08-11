import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon } from '@ionic/react';
import { alertCircle, refresh, home } from 'ionicons/icons';
import { monitoringService } from '../../services/monitoring.service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Generate unique error ID
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to monitoring service
    monitoringService.logError('ErrorBoundary', error, {
      errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    if (this.state.error && this.state.errorId) {
      // Create error report
      const errorReport = {
        errorId: this.state.errorId,
        message: this.state.error.message,
        stack: this.state.error.stack,
        componentStack: this.state.errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Send error report (could be email, support system, etc.)
      const subject = encodeURIComponent(`Error Report - ${this.state.errorId}`);
      const body = encodeURIComponent(`
Error Report Details:

Error ID: ${errorReport.errorId}
Message: ${errorReport.message}
Timestamp: ${errorReport.timestamp}
URL: ${errorReport.url}

Stack Trace:
${errorReport.stack}

Component Stack:
${errorReport.componentStack}

User Agent:
${errorReport.userAgent}
      `);

      window.open(`mailto:support@neuralhack.com?subject=${subject}&body=${body}`);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary-container" style={{ 
          padding: '20px', 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--ion-color-light)'
        }}>
          <IonCard style={{ maxWidth: '500px', width: '100%' }}>
            <IonCardHeader>
              <IonCardTitle style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                color: 'var(--ion-color-danger)'
              }}>
                <IonIcon icon={alertCircle} />
                Oops! Algo salió mal
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ marginBottom: '20px' }}>
                <p>
                  Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado 
                  automáticamente y trabajará para solucionarlo.
                </p>
                
                {this.state.errorId && (
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--ion-color-medium)',
                    fontFamily: 'monospace',
                    backgroundColor: 'var(--ion-color-light)',
                    padding: '8px',
                    borderRadius: '4px',
                    marginTop: '10px'
                  }}>
                    ID del Error: {this.state.errorId}
                  </p>
                )}

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details style={{ marginTop: '15px' }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--ion-color-medium)' }}>
                      Detalles técnicos (desarrollo)
                    </summary>
                    <pre style={{ 
                      fontSize: '11px', 
                      backgroundColor: 'var(--ion-color-light)',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '200px',
                      marginTop: '10px'
                    }}>
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px' 
              }}>
                <IonButton 
                  expand="block" 
                  onClick={this.handleRetry}
                  color="primary"
                >
                  <IonIcon icon={refresh} slot="start" />
                  Intentar de nuevo
                </IonButton>

                <IonButton 
                  expand="block" 
                  fill="outline"
                  onClick={this.handleGoHome}
                  color="medium"
                >
                  <IonIcon icon={home} slot="start" />
                  Ir al inicio
                </IonButton>

                <IonButton 
                  expand="block" 
                  fill="clear"
                  onClick={this.handleReportError}
                  color="medium"
                  size="small"
                >
                  Reportar este error
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;