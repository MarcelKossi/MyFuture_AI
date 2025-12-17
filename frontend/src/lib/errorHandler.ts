/**
 * Gestionnaire d'erreurs centralisé et sécurisé
 * Prévient l'exposition d'informations sensibles
 */

/**
 * Classe d'erreur personnalisée pour l'application
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly userMessage: string;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.userMessage = userMessage || this.getDefaultUserMessage(code);

    // Capture de la stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Messages utilisateur par défaut selon le code d'erreur
   */
  private getDefaultUserMessage(code: string): string {
    const messages: Record<string, string> = {
      VALIDATION_ERROR: 'Les données saisies ne sont pas valides',
      NETWORK_ERROR: 'Problème de connexion réseau',
      STORAGE_ERROR: 'Erreur de sauvegarde des données',
      PDF_GENERATION_ERROR: 'Erreur lors de la génération du PDF',
      FILE_UPLOAD_ERROR: 'Erreur lors du téléchargement du fichier',
      TRANSLATION_ERROR: 'Erreur de chargement des traductions',
      SECURITY_ERROR: 'Action non autorisée pour des raisons de sécurité',
      RATE_LIMIT_ERROR: 'Trop de tentatives, veuillez patienter',
      UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite'
    };

    return messages[code] || messages.UNKNOWN_ERROR;
  }

  /**
   * Sérialise l'erreur pour le logging (sans informations sensibles)
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      timestamp: this.timestamp.toISOString(),
      isOperational: this.isOperational
    };
  }
}

/**
 * Types d'erreurs communes
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  PDF_GENERATION_ERROR: 'PDF_GENERATION_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  TRANSLATION_ERROR: 'TRANSLATION_ERROR',
  SECURITY_ERROR: 'SECURITY_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

/**
 * Gestionnaire d'erreurs global
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Traite une erreur de manière sécurisée
   * @param error - Erreur à traiter
   * @param context - Contexte additonnel
   */
  handleError(error: unknown, context?: Record<string, any>): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(
        error.message,
        ErrorCodes.UNKNOWN_ERROR,
        500,
        true
      );
    } else {
      appError = new AppError(
        'Unknown error occurred',
        ErrorCodes.UNKNOWN_ERROR,
        500,
        true
      );
    }

    // Log sécurisé (sans données sensibles)
    this.logError(appError, context);

    // Ajoute à la queue pour analyse
    this.addToQueue(appError);

    return appError;
  }

  /**
   * Log sécurisé d'erreur
   * @param error - Erreur à logger
   * @param context - Contexte additionnel
   */
  private logError(error: AppError, context?: Record<string, any>): void {
    const logData = {
      ...error.toJSON(),
      context: this.sanitizeContext(context),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };

    if (error.isOperational) {
      console.warn('Operational Error:', logData);
    } else {
      console.error('System Error:', logData);
    }

    // En production, ici on pourrait envoyer vers un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      // Exemple: Sentry.captureException(error);
    }
  }

  /**
   * Sanitise le contexte pour éviter l'exposition de données sensibles
   * @param context - Contexte à sanitiser
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> {
    if (!context) return {};

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    const sanitized: Record<string, any> = {};

    Object.entries(context).forEach(([key, value]) => {
      const isSensitive = sensitiveKeys.some(sensitive => 
        key.toLowerCase().includes(sensitive)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 100) + '...[TRUNCATED]';
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  /**
   * Ajoute une erreur à la queue pour analyse
   * @param error - Erreur à ajouter
   */
  private addToQueue(error: AppError): void {
    this.errorQueue.push(error);

    // Limite la taille de la queue
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * Récupère les erreurs récentes pour analyse
   * @param limit - Nombre d'erreurs à récupérer
   */
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorQueue.slice(-limit);
  }

  /**
   * Vide la queue d'erreurs
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

/**
 * Fonctions utilitaires pour la gestion d'erreurs
 */

/**
 * Wrapper sécurisé pour les fonctions asynchrones
 * @param fn - Fonction à exécuter
 * @param errorHandler - Gestionnaire d'erreur personnalisé
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: AppError) => void
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    const appError = ErrorHandler.getInstance().handleError(error);
    errorHandler?.(appError);
    return { error: appError };
  }
}

/**
 * Wrapper sécurisé pour les fonctions synchrones
 * @param fn - Fonction à exécuter
 * @param errorHandler - Gestionnaire d'erreur personnalisé
 */
export function safeSync<T>(
  fn: () => T,
  errorHandler?: (error: AppError) => void
): { data?: T; error?: AppError } {
  try {
    const data = fn();
    return { data };
  } catch (error) {
    const appError = ErrorHandler.getInstance().handleError(error);
    errorHandler?.(appError);
    return { error: appError };
  }
}

/**
 * Crée une erreur de validation avec détails
 * @param field - Champ en erreur
 * @param value - Valeur invalide
 * @param message - Message d'erreur
 */
export function createValidationError(
  field: string,
  value: unknown,
  message: string
): AppError {
  return new AppError(
    `Validation failed for field '${field}': ${message}`,
    ErrorCodes.VALIDATION_ERROR,
    400,
    true,
    message
  );
}

/**
 * Crée une erreur de sécurité
 * @param action - Action tentée
 * @param reason - Raison du refus
 */
export function createSecurityError(
  action: string,
  reason: string
): AppError {
  return new AppError(
    `Security violation: ${action} - ${reason}`,
    ErrorCodes.SECURITY_ERROR,
    403,
    true,
    'Action non autorisée pour des raisons de sécurité'
  );
}

// Instance globale du gestionnaire d'erreurs
export const globalErrorHandler = ErrorHandler.getInstance();