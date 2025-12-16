/**
 * Gestionnaire sécurisé pour localStorage avec fallbacks et validation
 * Prévient les erreurs en mode navigation privée et gère les cas d'échec
 */

/**
 * Vérifie si localStorage est disponible
 * @returns true si localStorage est accessible
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Lit une valeur depuis localStorage de manière sécurisée
 * @param key - Clé de stockage
 * @param defaultValue - Valeur par défaut si lecture échoue
 * @returns Valeur lue ou valeur par défaut
 */
export const safeGetLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (!isLocalStorageAvailable()) {
    console.warn(`localStorage non disponible, utilisation de la valeur par défaut pour ${key}`);
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    // Tente de parser en JSON, sinon retourne la string
    try {
      return JSON.parse(item);
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    console.warn(`Erreur lecture localStorage pour ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Écrit une valeur dans localStorage de manière sécurisée
 * @param key - Clé de stockage
 * @param value - Valeur à stocker
 * @returns true si l'écriture a réussi
 */
export const safeSetLocalStorage = (key: string, value: unknown): boolean => {
  if (!isLocalStorageAvailable()) {
    console.warn(`localStorage non disponible, impossible de sauvegarder ${key}`);
    return false;
  }

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`Erreur écriture localStorage pour ${key}:`, error);
    return false;
  }
};

/**
 * Supprime une valeur de localStorage de manière sécurisée
 * @param key - Clé à supprimer
 * @returns true si la suppression a réussi
 */
export const safeRemoveLocalStorage = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Erreur suppression localStorage pour ${key}:`, error);
    return false;
  }
};

/**
 * Efface tout le localStorage de manière sécurisée
 * @returns true si l'effacement a réussi
 */
export const safeClearLocalStorage = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('Erreur effacement localStorage:', error);
    return false;
  }
};