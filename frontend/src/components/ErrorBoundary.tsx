/**
 * Composant Error Boundary pour capturer et gérer les erreurs React
 * Améliore la sécurité et l'expérience utilisateur
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary sécurisé qui capture les erreurs JavaScript
 * et empêche l'exposition d'informations sensibles
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log sécurisé de l'erreur (sans exposer de données sensibles)
    const sanitizedError = {
      message: error.message,
      name: error.name,
      componentStack: errorInfo.componentStack?.split('\n').slice(0, 5).join('\n'), // Limite les infos de stack
      timestamp: new Date().toISOString()
    };

    console.error('ErrorBoundary caught an error:', sanitizedError);

    // Appel du callback personnalisé si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  /**
   * Recharge la page pour récupérer d'une erreur
   */
  handleReload = () => {
    window.location.reload();
  };

  /**
   * Retourne à la page d'accueil
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * Tente de récupérer en réinitialisant l'état
   */
  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Interface d'erreur personnalisée si fournie
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface d'erreur par défaut
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-red-500">
                <AlertTriangle className="h-full w-full" />
              </div>
              <CardTitle className="text-red-700">
                Une erreur inattendue s'est produite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-gray-600">
                <p>
                  Nous nous excusons pour ce problème. L'erreur a été enregistrée 
                  et notre équipe en a été informée.
                </p>
              </div>

              {/* Détails de l'erreur en mode développement seulement */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700 max-h-32 overflow-y-auto">
                  <strong>Erreur:</strong> {this.state.error.message}
                  {this.state.errorInfo && (
                    <>
                      <br />
                      <strong>Composant:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {this.state.errorInfo.componentStack?.split('\n').slice(0, 3).join('\n')}
                      </pre>
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réessayer
                </Button>
                
                <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Button>
                
                <Button onClick={this.handleReload} variant="ghost" className="w-full">
                  Recharger la page
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500">
                Si le problème persiste, veuillez contacter notre support.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;