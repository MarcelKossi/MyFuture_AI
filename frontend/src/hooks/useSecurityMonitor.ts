/**
 * Hook de surveillance de sécurité en temps réel
 * Détecte les tentatives d'attaques et les comportements suspects
 */

import { useEffect, useRef, useCallback } from 'react';
import { globalErrorHandler, ErrorCodes, AppError } from '@/lib/errorHandler';
import { globalRateLimiter } from '@/lib/rateLimit';
import { sanitizeUserInput } from '@/lib/security';

interface SecurityAlert {
  type: 'XSS_ATTEMPT' | 'INJECTION_ATTEMPT' | 'RATE_LIMIT' | 'INVALID_INPUT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

interface SecurityMetrics {
  totalAlerts: number;
  alertsByType: Record<string, number>;
  lastAlert?: SecurityAlert;
  isUnderAttack: boolean;
}

/**
 * Hook principal de surveillance de sécurité
 */
export const useSecurityMonitor = () => {
  const alertHistory = useRef<SecurityAlert[]>([]);
  const lastCheck = useRef<Date>(new Date());

  // Configuration de la limitation de taux pour la surveillance
  useEffect(() => {
    globalRateLimiter.setRule('security_validation', {
      maxAttempts: 100,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 60 * 1000 // 1 minute de blocage
    });
  }, []);

  /**
   * Enregistre une alerte de sécurité
   */
  const logSecurityAlert = useCallback((alert: Omit<SecurityAlert, 'timestamp'>) => {
    const fullAlert: SecurityAlert = {
      ...alert,
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };

    alertHistory.current.push(fullAlert);
    
    // Limite l'historique à 1000 entrées
    if (alertHistory.current.length > 1000) {
      alertHistory.current = alertHistory.current.slice(-1000);
    }

    // Log selon la sévérité
    if (fullAlert.severity === 'CRITICAL' || fullAlert.severity === 'HIGH') {
      console.error('SECURITY ALERT:', fullAlert);
      
      // En production, envoyer vers un service de monitoring
      if (process.env.NODE_ENV === 'production') {
        // Ici on pourrait envoyer vers Sentry, DataDog, etc.
      }
    } else {
      console.warn('Security Warning:', fullAlert);
    }

    // Créer une erreur pour le gestionnaire global
    const securityError = new AppError(
      `Security Alert: ${alert.type} - ${alert.message}`,
      ErrorCodes.SECURITY_ERROR,
      403,
      true
    );
    
    globalErrorHandler.handleError(securityError);
  }, []);

  /**
   * Valide une entrée utilisateur pour les tentatives d'injection
   */
  const validateUserInput = useCallback((input: string, fieldName: string): boolean => {
    const rateLimitResult = globalRateLimiter.recordAttempt('security_validation', fieldName);
    
    if (!rateLimitResult.allowed) {
      logSecurityAlert({
        type: 'RATE_LIMIT',
        severity: 'MEDIUM',
        message: `Rate limit exceeded for field: ${fieldName}`
      });
      return false;
    }

    // Détection de scripts malveillants
    const scriptPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(input)) {
        logSecurityAlert({
          type: 'XSS_ATTEMPT',
          severity: 'HIGH',
          message: `XSS attempt detected in field: ${fieldName}`
        });
        return false;
      }
    }

    // Détection d'injections SQL (même si on n'utilise pas de DB directe)
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/gi,
      /(UNION|OR|AND)\s+\d+\s*=\s*\d+/gi,
      /['";][\s]*(\bOR\b|\bAND\b)/gi
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        logSecurityAlert({
          type: 'INJECTION_ATTEMPT',
          severity: 'HIGH',
          message: `SQL injection attempt detected in field: ${fieldName}`
        });
        return false;
      }
    }

    // Validation de la longueur
    if (input.length > 10000) {
      logSecurityAlert({
        type: 'INVALID_INPUT',
        severity: 'MEDIUM',
        message: `Input too long in field: ${fieldName} (${input.length} chars)`
      });
      return false;
    }

    return true;
  }, [logSecurityAlert]);

  /**
   * Nettoie et valide une entrée utilisateur
   */
  const sanitizeAndValidate = useCallback((input: string, fieldName: string): string | null => {
    if (!validateUserInput(input, fieldName)) {
      return null;
    }

    return sanitizeUserInput(input);
  }, [validateUserInput]);

  /**
   * Calcule les métriques de sécurité
   */
  const getSecurityMetrics = useCallback((): SecurityMetrics => {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentAlerts = alertHistory.current.filter(
      alert => alert.timestamp > lastHour
    );

    const alertsByType = recentAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const criticalAlerts = recentAlerts.filter(
      alert => alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
    );

    return {
      totalAlerts: recentAlerts.length,
      alertsByType,
      lastAlert: alertHistory.current[alertHistory.current.length - 1],
      isUnderAttack: criticalAlerts.length > 5 // Plus de 5 alertes critiques en 1h
    };
  }, []);

  /**
   * Surveillance automatique en arrière-plan
   */
  useEffect(() => {
    const checkSecurityStatus = () => {
      const metrics = getSecurityMetrics();
      
      if (metrics.isUnderAttack && Date.now() - lastCheck.current.getTime() > 30000) {
        logSecurityAlert({
          type: 'RATE_LIMIT',
          severity: 'CRITICAL',
          message: `Application under attack: ${metrics.totalAlerts} alerts in last hour`
        });
        lastCheck.current = new Date();
      }
    };

    const interval = setInterval(checkSecurityStatus, 30000); // Vérification toutes les 30s
    
    return () => clearInterval(interval);
  }, [getSecurityMetrics, logSecurityAlert]);

  return {
    validateUserInput,
    sanitizeAndValidate,
    logSecurityAlert,
    getSecurityMetrics,
    alertHistory: alertHistory.current
  };
};

/**
 * Hook spécialisé pour la validation des formulaires
 */
export const useFormSecurity = () => {
  const { sanitizeAndValidate, validateUserInput } = useSecurityMonitor();

  const validateField = useCallback((value: string, fieldName: string, required = false) => {
    if (required && (!value || value.trim().length === 0)) {
      return { isValid: false, error: 'Ce champ est requis' };
    }

    if (!value || value.trim().length === 0) {
      return { isValid: true, sanitizedValue: '' };
    }

    const sanitized = sanitizeAndValidate(value, fieldName);
    
    if (sanitized === null) {
      return { 
        isValid: false, 
        error: 'Valeur non autorisée pour des raisons de sécurité' 
      };
    }

    return { isValid: true, sanitizedValue: sanitized };
  }, [sanitizeAndValidate]);

  return { validateField };
};