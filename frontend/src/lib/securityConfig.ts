/**
 * Configuration centralisée des paramètres de sécurité
 * Définit les règles et politiques de sécurité de l'application
 */

/**
 * Configuration des en-têtes de sécurité
 */
export const SECURITY_HEADERS = {
  // Content Security Policy - Protection contre XSS
  CSP: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Pour React/Vite
    'style-src': ["'self'", "'unsafe-inline'"], // Pour Tailwind
    'img-src': ["'self'", "data:", "blob:", "https:"],
    'font-src': ["'self'", "https:"],
    'connect-src': ["'self'", "https:"],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },

  // Security headers
  HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  }
} as const;

/**
 * Patterns de détection d'attaques
 */
export const ATTACK_PATTERNS = {
  // Scripts malveillants
  XSS: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi
  ],

  // Injections SQL
  SQL_INJECTION: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(UNION|OR|AND)\s+\d+\s*=\s*\d+/gi,
    /['";][\s]*(\bOR\b|\bAND\b)/gi,
    /\/\*.*?\*\//gi,
    /--[^\r\n]*/gi,
    /\bxp_\w+/gi,
    /\bsp_\w+/gi
  ],

  // Traversée de répertoires
  PATH_TRAVERSAL: [
    /\.\.\//gi,
    /\.\.[\\/]/gi,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ],

  // Commandes système
  COMMAND_INJECTION: [
    /\b(rm|del|format|fdisk|mkfs)\b/gi,
    /[;&|`$()]/gi,
    /\b(cat|type|more|less)\b/gi,
    /\b(wget|curl|nc|netcat)\b/gi
  ]
} as const;

/**
 * Limites de sécurité
 */
export const SECURITY_LIMITS = {
  // Tailles maximales
  MAX_INPUT_LENGTH: 10000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILENAME_LENGTH: 255,
  
  // Limites de taux
  RATE_LIMITS: {
    DEFAULT: { attempts: 100, windowMs: 60000, blockMs: 60000 },
    VALIDATION: { attempts: 50, windowMs: 60000, blockMs: 30000 },
    FILE_UPLOAD: { attempts: 10, windowMs: 60000, blockMs: 300000 },
    PDF_GENERATION: { attempts: 5, windowMs: 60000, blockMs: 300000 },
    SHARE_RESULTS: { attempts: 10, windowMs: 60000, blockMs: 120000 }
  },

  // Alertes
  ALERT_THRESHOLDS: {
    CRITICAL_ALERTS_PER_HOUR: 5,
    MAX_ALERTS_IN_MEMORY: 1000,
    CLEANUP_INTERVAL_MS: 300000 // 5 minutes
  }
} as const;

/**
 * Types de fichiers autorisés
 */
export const ALLOWED_FILE_TYPES = {
  IMAGES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  
  DOCUMENTS: [
    'application/pdf',
    'text/plain',
    'application/json'
  ],
  
  EXTENSIONS: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.pdf', '.txt', '.json'
  ]
} as const;

/**
 * Messages d'erreur sécurisés (sans exposition d'informations)
 */
export const SECURITY_MESSAGES = {
  VALIDATION_ERROR: 'Les données saisies ne sont pas valides',
  XSS_ATTEMPT: 'Contenu potentiellement dangereux détecté',
  INJECTION_ATTEMPT: 'Tentative d\'injection détectée',
  RATE_LIMIT_EXCEEDED: 'Trop de tentatives, veuillez patienter',
  FILE_TOO_LARGE: 'Fichier trop volumineux',
  FILE_TYPE_NOT_ALLOWED: 'Type de fichier non autorisé',
  INVALID_FILE_NAME: 'Nom de fichier invalide',
  SECURITY_VIOLATION: 'Action non autorisée pour des raisons de sécurité',
  CSRF_TOKEN_INVALID: 'Token de sécurité invalide',
  SESSION_EXPIRED: 'Session expirée, veuillez vous reconnecter'
} as const;

/**
 * Configuration des cookies sécurisés
 */
export const COOKIE_CONFIG = {
  secure: true, // HTTPS seulement
  httpOnly: true, // Pas d'accès JavaScript
  sameSite: 'strict' as const, // Protection CSRF
  maxAge: 24 * 60 * 60 * 1000, // 24 heures
  domain: undefined, // Domaine courant seulement
  path: '/'
} as const;

/**
 * Configuration des domaines de confiance
 */
export const TRUSTED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  // Ajouter les domaines de production ici
] as const;

/**
 * Vérifie si un domaine est de confiance
 */
export const isTrustedDomain = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    return TRUSTED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
};

/**
 * Génère une politique CSP complète
 */
export const generateCSPHeader = (): string => {
  const csp = SECURITY_HEADERS.CSP;
  
  return Object.entries(csp)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
};

/**
 * Valide un nom de fichier contre les attaques
 */
export const validateFileName = (filename: string): boolean => {
  if (!filename || filename.length === 0) return false;
  if (filename.length > SECURITY_LIMITS.MAX_FILENAME_LENGTH) return false;
  
  // Caractères dangereux
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(filename)) return false;
  
  // Noms réservés Windows
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(filename)) return false;
  
  // Fichiers cachés ou système
  if (filename.startsWith('.') || filename.startsWith('~')) return false;
  
  return true;
};

/**
 * Vérifie si un type MIME est autorisé
 */
export const isAllowedMimeType = (mimeType: string): boolean => {
  const allowed: string[] = [
    ...ALLOWED_FILE_TYPES.IMAGES,
    ...ALLOWED_FILE_TYPES.DOCUMENTS
  ];
  
  return allowed.includes(mimeType.toLowerCase());
};

/**
 * Configuration d'environnement sécurisé
 */
export const getSecurityConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    strictMode: !isDevelopment,
    enableCSP: true,
    enableHSTS: !isDevelopment,
    enableSecureHeaders: true,
    logLevel: isDevelopment ? 'debug' : 'warn',
    enableSourceMaps: isDevelopment,
    enableDetailedErrors: isDevelopment
  };
};