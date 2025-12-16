/**
 * Hook de surveillance des violations de Content Security Policy (CSP)
 * Détecte et rapporte les tentatives d'exécution de code non autorisé
 */

import { useEffect, useCallback } from 'react';
import { globalErrorHandler, ErrorCodes, AppError } from '@/lib/errorHandler';

interface CSPViolation {
  blockedURI: string;
  violatedDirective: string;
  originalPolicy: string;
  disposition: string;
  lineNumber?: number;
  columnNumber?: number;
  sourceFile?: string;
  statusCode?: number;
}

/**
 * Hook pour surveiller les violations CSP
 */
export const useCSPMonitor = () => {
  const handleCSPViolation = useCallback((event: SecurityPolicyViolationEvent) => {
    const violation: CSPViolation = {
      blockedURI: event.blockedURI || 'unknown',
      violatedDirective: event.violatedDirective || 'unknown',
      originalPolicy: event.originalPolicy || 'unknown',
      disposition: event.disposition || 'unknown',
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      sourceFile: event.sourceFile,
      statusCode: event.statusCode
    };

    // Log de la violation
    console.warn('CSP Violation detected:', violation);

    // Créer une erreur de sécurité
    const error = new AppError(
      `CSP Violation: ${violation.violatedDirective} - ${violation.blockedURI}`,
      ErrorCodes.SECURITY_ERROR,
      403,
      true,
      'Tentative d\'exécution de code non autorisé bloquée'
    );

    globalErrorHandler.handleError(error, {
      cspViolation: violation,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Analyser la sévérité de la violation
    const severity = assessViolationSeverity(violation);
    
    if (severity === 'CRITICAL') {
      // En production, on pourrait déclencher une alerte
      console.error('CRITICAL CSP Violation - Potential attack detected');
    }
  }, []);

  /**
   * Évalue la sévérité d'une violation CSP
   */
  const assessViolationSeverity = (violation: CSPViolation): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    // Scripts inline ou eval() - très dangereux
    if (violation.violatedDirective.includes('script-src') && 
        (violation.blockedURI.includes('inline') || violation.blockedURI.includes('eval'))) {
      return 'CRITICAL';
    }

    // Tentative de chargement de ressources externes suspectes
    if (violation.blockedURI.includes('data:') || 
        violation.blockedURI.includes('javascript:') ||
        violation.blockedURI.includes('vbscript:')) {
      return 'HIGH';
    }

    // Violations de style ou image - moins critiques
    if (violation.violatedDirective.includes('style-src') || 
        violation.violatedDirective.includes('img-src')) {
      return 'MEDIUM';
    }

    return 'LOW';
  };

  /**
   * Configure les meta tags CSP si pas déjà présents
   */
  const setupCSPHeaders = useCallback(() => {
    // Vérifier si CSP est déjà configuré
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!existingCSP) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      
      // Politique stricte mais permettant le fonctionnement de l'app
      meta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Nécessaire pour React/Vite en dev
        "style-src 'self' 'unsafe-inline'", // Nécessaire pour Tailwind
        "img-src 'self' data: blob: https:",
        "font-src 'self' https:",
        "connect-src 'self' https:",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; ');
      
      document.head.appendChild(meta);
      
      console.log('CSP headers configured programmatically');
    }
  }, []);

  /**
   * Détecte les tentatives d'injection de contenu
   */
  const detectContentInjection = useCallback(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Détecter les attributs d'événements dangereux
            const dangerousAttributes = [
              'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus',
              'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup'
            ];
            
            dangerousAttributes.forEach(attr => {
              if (element.hasAttribute(attr)) {
                console.warn(`Dangerous attribute detected: ${attr} on`, element);
                
                // Supprimer l'attribut dangereux
                element.removeAttribute(attr);
                
                // Logger comme tentative d'injection
                const error = new AppError(
                  `Dangerous attribute injection: ${attr}`,
                  ErrorCodes.SECURITY_ERROR,
                  403,
                  true
                );
                
                globalErrorHandler.handleError(error);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus',
        'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup'
      ]
    });

    return () => observer.disconnect();
  }, []);

  // Installation des listeners au montage
  useEffect(() => {
    // Écouter les violations CSP
    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    
    // Configurer CSP si nécessaire
    setupCSPHeaders();
    
    // Démarrer la surveillance des injections
    const stopDetection = detectContentInjection();

    // Cleanup
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
      stopDetection();
    };
  }, [handleCSPViolation, setupCSPHeaders, detectContentInjection]);

  return {
    assessViolationSeverity,
    setupCSPHeaders
  };
};