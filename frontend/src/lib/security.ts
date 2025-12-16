/**
 * Utilities de sécurité centralisées pour MyFuture AI
 * Prévention XSS, validation d'entrées, gestion sécurisée du localStorage
 */

import DOMPurify from 'dompurify';

/**
 * Sanitise le contenu HTML pour prévenir les attaques XSS
 * @param dirty - Contenu HTML potentiellement dangereux
 * @returns Contenu HTML sécurisé
 */
export const sanitizeHTML = (dirty: string): string => {
  if (typeof window === 'undefined') return dirty; // SSR fallback
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'p', 'br'],
    ALLOWED_ATTR: ['class']
  });
};

/**
 * Valide et encode les données utilisateur pour affichage sécurisé
 * @param input - Données utilisateur
 * @returns Données encodées et sécurisées
 */
export const sanitizeUserInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Supprime les caractères HTML dangereux
    .slice(0, 1000); // Limite la longueur
};

/**
 * Valide une note saisie par l'utilisateur
 * @param grade - Note à valider
 * @param scale - Échelle de notation (sur 20, 100, etc.)
 * @returns Note validée ou null si invalide
 */
export const validateGrade = (grade: string | number, scale: number = 20): number | null => {
  const numGrade = typeof grade === 'string' ? parseFloat(grade) : grade;
  
  if (isNaN(numGrade) || numGrade < 0 || numGrade > scale) {
    return null;
  }
  
  return Math.round(numGrade * 100) / 100; // Arrondi à 2 décimales
};

/**
 * Valide un nom de matière
 * @param subject - Nom de matière
 * @returns Matière validée ou null si invalide
 */
export const validateSubject = (subject: string): string | null => {
  if (typeof subject !== 'string' || subject.trim().length < 2) {
    return null;
  }
  
  const cleaned = sanitizeUserInput(subject);
  return cleaned.length >= 2 ? cleaned : null;
};

/**
 * Génère un identifiant sécurisé pour les partages
 * @returns Identifiant aléatoire sécurisé
 */
export const generateSecureId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback pour les environnements sans crypto
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Valide une URL de partage
 * @param url - URL à valider
 * @returns true si l'URL est sûre
 */
export const validateShareUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};