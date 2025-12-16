/**
 * Système de limitation de taux pour prévenir les abus
 * Protection contre le spam et les attaques par déni de service
 */

import { safeGetLocalStorage, safeSetLocalStorage } from './storage';

/**
 * Configuration d'une règle de limitation
 */
interface RateLimitRule {
  readonly maxAttempts: number;
  readonly windowMs: number;
  readonly blockDurationMs: number;
}

/**
 * Enregistrement d'une tentative
 */
interface AttemptRecord {
  readonly count: number;
  readonly firstAttempt: number;
  readonly lastAttempt: number;
  readonly blockedUntil?: number;
}

/**
 * Résultat d'une vérification de limitation
 */
interface RateLimitResult {
  readonly allowed: boolean;
  readonly remainingAttempts: number;
  readonly resetTime: number;
  readonly retryAfter?: number;
}

/**
 * Gestionnaire de limitation de taux
 */
export class RateLimiter {
  private rules: Map<string, RateLimitRule> = new Map();
  private readonly storagePrefix = 'rateLimit_';

  /**
   * Définit une règle de limitation pour une action
   * @param action - Nom de l'action à limiter
   * @param rule - Règle de limitation
   */
  setRule(action: string, rule: RateLimitRule): void {
    this.rules.set(action, rule);
  }

  /**
   * Vérifie si une action est autorisée
   * @param action - Action à vérifier
   * @param identifier - Identifiant unique (IP, utilisateur, etc.)
   * @returns Résultat de la vérification
   */
  checkLimit(action: string, identifier: string = 'default'): RateLimitResult {
    const rule = this.rules.get(action);
    if (!rule) {
      // Pas de règle = autorisé
      return {
        allowed: true,
        remainingAttempts: Infinity,
        resetTime: 0
      };
    }

    const key = this.getStorageKey(action, identifier);
    const now = Date.now();
    const record = this.getAttemptRecord(key);

    // Vérifier si actuellement bloqué
    if (record.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: record.blockedUntil,
        retryAfter: record.blockedUntil - now
      };
    }

    // Vérifier si la fenêtre de temps a expiré
    const windowStart = now - rule.windowMs;
    const isNewWindow = record.firstAttempt < windowStart;

    if (isNewWindow) {
      // Nouvelle fenêtre, réinitialiser
      return {
        allowed: true,
        remainingAttempts: rule.maxAttempts - 1,
        resetTime: now + rule.windowMs
      };
    }

    // Dans la fenêtre actuelle
    const remainingAttempts = rule.maxAttempts - record.count;
    
    if (remainingAttempts > 0) {
      return {
        allowed: true,
        remainingAttempts: remainingAttempts - 1,
        resetTime: record.firstAttempt + rule.windowMs
      };
    }

    // Limite atteinte, bloquer
    const blockedUntil = now + rule.blockDurationMs;
    this.updateAttemptRecord(key, {
      ...record,
      blockedUntil
    });

    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: blockedUntil,
      retryAfter: rule.blockDurationMs
    };
  }

  /**
   * Enregistre une tentative d'action
   * @param action - Action effectuée
   * @param identifier - Identifiant unique
   * @returns Résultat après enregistrement
   */
  recordAttempt(action: string, identifier: string = 'default'): RateLimitResult {
    const result = this.checkLimit(action, identifier);
    
    if (result.allowed) {
      const key = this.getStorageKey(action, identifier);
      const record = this.getAttemptRecord(key);
      const now = Date.now();
      
      // Mise à jour de l'enregistrement
      const newRecord: AttemptRecord = {
        count: record.count + 1,
        firstAttempt: record.firstAttempt || now,
        lastAttempt: now
      };

      this.updateAttemptRecord(key, newRecord);
    }

    return result;
  }

  /**
   * Réinitialise les compteurs pour une action
   * @param action - Action à réinitialiser
   * @param identifier - Identifiant unique
   */
  resetLimit(action: string, identifier: string = 'default'): void {
    const key = this.getStorageKey(action, identifier);
    safeSetLocalStorage(key, null);
  }

  /**
   * Nettoie les anciens enregistrements
   */
  cleanup(): void {
    const now = Date.now();
    const keys = this.getAllRateLimitKeys();
    
    keys.forEach(key => {
      const record = this.getAttemptRecord(key);
      const rule = this.extractRuleFromKey(key);
      
      if (rule) {
        const isExpired = now - record.lastAttempt > rule.windowMs + rule.blockDurationMs;
        if (isExpired) {
          safeSetLocalStorage(key, null);
        }
      }
    });
  }

  /**
   * Obtient la clé de stockage pour une action
   */
  private getStorageKey(action: string, identifier: string): string {
    return `${this.storagePrefix}${action}_${identifier}`;
  }

  /**
   * Récupère l'enregistrement des tentatives
   */
  private getAttemptRecord(key: string): AttemptRecord {
    const defaultRecord: AttemptRecord = {
      count: 0,
      firstAttempt: 0,
      lastAttempt: 0
    };

    return safeGetLocalStorage(key, defaultRecord);
  }

  /**
   * Met à jour l'enregistrement des tentatives
   */
  private updateAttemptRecord(key: string, record: AttemptRecord): void {
    safeSetLocalStorage(key, record);
  }

  /**
   * Récupère toutes les clés de limitation de taux
   */
  private getAllRateLimitKeys(): string[] {
    const keys: string[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.storagePrefix)) {
          keys.push(key);
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des clés de limitation:', error);
    }

    return keys;
  }

  /**
   * Extrait la règle à partir de la clé de stockage
   */
  private extractRuleFromKey(key: string): RateLimitRule | null {
    const actionPart = key.replace(this.storagePrefix, '').split('_')[0];
    return this.rules.get(actionPart) || null;
  }
}

/**
 * Instance globale du limiteur de taux
 */
export const globalRateLimiter = new RateLimiter();

/**
 * Configuration des règles par défaut
 */
export const setupDefaultRateLimit = () => {
  // Limitation pour la génération de PDF
  globalRateLimiter.setRule('pdf_generation', {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000 // 5 minutes
  });

  // Limitation pour le partage de résultats
  globalRateLimiter.setRule('share_results', {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 2 * 60 * 1000 // 2 minutes
  });

  // Limitation pour l'upload de fichiers
  globalRateLimiter.setRule('file_upload', {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 10 * 60 * 1000 // 10 minutes
  });

  // Limitation pour les calculs d'orientation
  globalRateLimiter.setRule('orientation_calculation', {
    maxAttempts: 20,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 30 * 1000 // 30 secondes
  });

  // Limitation pour les erreurs de validation
  globalRateLimiter.setRule('validation_error', {
    maxAttempts: 50,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 60 * 1000 // 1 minute
  });
};

/**
 * Décorateur pour appliquer une limitation de taux à une fonction
 * @param action - Action à limiter
 * @param identifier - Fonction pour obtenir l'identifiant (optionnel)
 */
export function withRateLimit<T extends (...args: any[]) => any>(
  action: string,
  identifier?: (...args: Parameters<T>) => string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: Parameters<T>) {
      const id = identifier ? identifier(...args) : 'default';
      const result = globalRateLimiter.recordAttempt(action, id);

      if (!result.allowed) {
        throw new Error(
          `Action limitée: ${action}. Réessayez dans ${Math.ceil((result.retryAfter || 0) / 1000)} secondes.`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Hook React pour la limitation de taux
 * @param action - Action à limiter
 * @param identifier - Identifiant unique
 */
export const useRateLimit = (action: string, identifier?: string) => {
  const check = () => globalRateLimiter.checkLimit(action, identifier);
  const record = () => globalRateLimiter.recordAttempt(action, identifier);
  const reset = () => globalRateLimiter.resetLimit(action, identifier);

  return { check, record, reset };
};