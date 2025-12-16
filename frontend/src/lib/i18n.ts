/**
 * Système de traduction multilingue centralisé et sécurisé
 * Supporte le lazy loading, la validation et la persistance fiable
 */

// Types sécurisés pour les langues supportées
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'pt', 'es', 'ee'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

// Configuration par défaut
const DEFAULT_LANGUAGE: Language = 'en';
const FALLBACK_LANGUAGE: Language = 'en';
const STORAGE_KEY = 'myfuture-language';

// Interface pour les traductions (validation de type)
export interface Translations {
  [key: string]: string;
}

// Cache des traductions chargées
const translationsCache = new Map<Language, Translations>();

/**
 * Valide si un code de langue est supporté
 * @param lang - Code de langue à valider
 * @returns true si la langue est supportée
 */
const isValidLanguage = (lang: string): lang is Language => {
  return SUPPORTED_LANGUAGES.includes(lang as Language);
};

/**
 * Détecte la langue préférée du navigateur
 * @returns Code de langue du navigateur ou langue par défaut
 */
const getBrowserLanguage = (): Language => {
  try {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    return isValidLanguage(browserLang) ? browserLang : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

/**
 * Récupère la langue sauvegardée de manière sécurisée
 * Inclut validation et fallback automatique
 * @returns Langue sauvegardée validée ou langue par défaut
 */
export const getSavedLanguage = (): Language => {
  try {
    // Tentative de lecture depuis localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    
    if (saved && isValidLanguage(saved)) {
      return saved;
    }
    
    // Fallback sur la langue du navigateur si localStorage est vide/invalide
    return getBrowserLanguage();
  } catch {
    // Fallback si localStorage n'est pas disponible (navigation privée, etc.)
    return getBrowserLanguage();
  }
};

/**
 * Sauvegarde la langue de manière sécurisée
 * @param language - Langue à sauvegarder (validée)
 */
export const saveLanguage = (language: Language): void => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Échec silencieux si localStorage n'est pas disponible
    console.warn('Unable to save language preference: localStorage not available');
  }
};

/**
 * Charge les traductions pour une langue donnée (lazy loading)
 * @param language - Langue à charger
 * @returns Promise des traductions
 */
export const loadTranslations = async (language: Language): Promise<Translations> => {
  // Retourne depuis le cache si déjà chargé
  if (translationsCache.has(language)) {
    return translationsCache.get(language)!;
  }

  try {
    // Import dynamique sécurisé des traductions
    const module = await import(`../translations/${language}.json`);
    
    // Validation que le module contient bien des chaînes de caractères
    const translations: Translations = {};
    
    for (const [key, value] of Object.entries(module.default || module)) {
      // Sécurité: ne garde que les chaînes de caractères (évite XSS)
      if (typeof value === 'string') {
        translations[key] = value;
      }
    }
    
    // Mise en cache
    translationsCache.set(language, translations);
    return translations;
    
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error);
    
    // Fallback: essaye de charger la langue de secours
    if (language !== FALLBACK_LANGUAGE) {
      return loadTranslations(FALLBACK_LANGUAGE);
    }
    
    // Si même le fallback échoue, retourne un objet vide
    return {};
  }
};

/**
 * Fonction de traduction avec fallback automatique
 * @param translations - Traductions de la langue courante
 * @param fallbackTranslations - Traductions de la langue de fallback
 * @param key - Clé de traduction
 * @returns Chaîne traduite ou clé si introuvable
 */
export const translate = (
  translations: Translations,
  fallbackTranslations: Translations,
  key: string
): string => {
  // Sécurité: assure que la clé est une chaîne non vide
  if (typeof key !== 'string' || !key.trim()) {
    return key;
  }
  
  // Cherche dans les traductions courantes
  let result = translations[key];
  
  // Fallback vers la langue de secours si non trouvé
  if (!result && fallbackTranslations) {
    result = fallbackTranslations[key];
  }
  
  // Retourne la clé si aucune traduction trouvée
  return result || key;
};

/**
 * Précharge toutes les traductions supportées en arrière-plan
 * Améliore les performances pour les changements de langue
 */
export const preloadAllTranslations = async (): Promise<void> => {
  try {
    await Promise.allSettled(
      SUPPORTED_LANGUAGES.map(lang => loadTranslations(lang))
    );
  } catch {
    // Échec silencieux - le lazy loading fonctionnera toujours
  }
};

/**
 * Efface le cache des traductions (utile pour les tests ou rechargement)
 */
export const clearTranslationsCache = (): void => {
  translationsCache.clear();
};

/**
 * Obtient les informations de configuration des langues
 */
export const getLanguageConfig = () => ({
  supported: SUPPORTED_LANGUAGES,
  default: DEFAULT_LANGUAGE,
  fallback: FALLBACK_LANGUAGE,
  storageKey: STORAGE_KEY
});