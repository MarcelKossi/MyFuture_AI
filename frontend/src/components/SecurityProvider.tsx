/**
 * Fournisseur de contexte pour les fonctionnalités de sécurité
 * Centralise la gestion de sécurité dans l'application
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { useCSPMonitor } from '@/hooks/useCSPMonitor';
import { setupDefaultRateLimit } from '@/lib/rateLimit';
import { toast } from 'sonner';

interface SecurityContextType {
  validateUserInput: (input: string, fieldName: string) => boolean;
  sanitizeAndValidate: (input: string, fieldName: string) => string | null;
  logSecurityAlert: (alert: {
    type: 'XSS_ATTEMPT' | 'INJECTION_ATTEMPT' | 'RATE_LIMIT' | 'INVALID_INPUT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
  }) => void;
  getSecurityMetrics: () => {
    totalAlerts: number;
    alertsByType: Record<string, number>;
    lastAlert?: any;
    isUnderAttack: boolean;
  };
  alertHistory: Array<{
    type: 'XSS_ATTEMPT' | 'INJECTION_ATTEMPT' | 'RATE_LIMIT' | 'INVALID_INPUT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    timestamp: Date;
    userAgent?: string;
    ip?: string;
  }>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
  showToasts?: boolean;
}

/**
 * Fournisseur de sécurité qui encapsule l'application
 */
export const SecurityProvider: React.FC<SecurityProviderProps> = ({ 
  children, 
  showToasts = true 
}) => {
  const security = useSecurityMonitor();
  const cspMonitor = useCSPMonitor();

  // Configuration initiale des règles de limitation
  useEffect(() => {
    setupDefaultRateLimit();
  }, []);

  // Surveille les alertes critiques et affiche des notifications
  useEffect(() => {
    if (!showToasts) return;

    const checkForCriticalAlerts = () => {
      const metrics = security.getSecurityMetrics();
      
      if (metrics.lastAlert && metrics.lastAlert.severity === 'CRITICAL') {
        const alertTime = new Date(metrics.lastAlert.timestamp).getTime();
        const now = Date.now();
        
        // Affiche une notification si l'alerte est récente (moins de 5 secondes)
        if (now - alertTime < 5000) {
          toast.error('Alerte de sécurité détectée', {
            description: 'Une tentative d\'attaque a été bloquée.',
            duration: 5000,
          });
        }
      }

      if (metrics.isUnderAttack) {
        toast.warning('Activité suspecte détectée', {
          description: 'Surveillance de sécurité renforcée activée.',
          duration: 3000,
        });
      }
    };

    const interval = setInterval(checkForCriticalAlerts, 2000);
    return () => clearInterval(interval);
  }, [security, showToasts]);

  // Surveillance des erreurs JavaScript globales
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      security.logSecurityAlert({
        type: 'INVALID_INPUT',
        severity: 'MEDIUM',
        message: `Global JS Error: ${event.message} at ${event.filename}:${event.lineno}`
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      security.logSecurityAlert({
        type: 'INVALID_INPUT',
        severity: 'MEDIUM',
        message: `Unhandled Promise Rejection: ${event.reason}`
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [security]);

  // Protection contre les tentatives de modification du DOM
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Détecte les scripts injectés
            if (element.tagName?.toLowerCase() === 'script') {
              security.logSecurityAlert({
                type: 'XSS_ATTEMPT',
                severity: 'CRITICAL',
                message: 'Script element injected into DOM'
              });
              
              // Supprime le script malveillant
              element.remove();
            }
            
            // Détecte les iframes non autorisées
            if (element.tagName?.toLowerCase() === 'iframe') {
              const src = element.getAttribute('src');
              if (src && !src.startsWith(window.location.origin)) {
                security.logSecurityAlert({
                  type: 'XSS_ATTEMPT',
                  severity: 'HIGH',
                  message: `Unauthorized iframe detected: ${src}`
                });
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [security]);

  return (
    <SecurityContext.Provider value={{
      ...security,
      alertHistory: security.alertHistory
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte de sécurité
 */
export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  
  return context;
};

/**
 * HOC pour protéger un composant avec la surveillance de sécurité
 */
export function withSecurity<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function SecurityProtectedComponent(props: P) {
    return (
      <SecurityProvider>
        <Component {...props} />
      </SecurityProvider>
    );
  };
}