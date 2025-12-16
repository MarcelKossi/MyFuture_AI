/**
 * Fonctions utilitaires de formatage avec internationalisation
 * Formatage des nombres, dates, notes, pourcentages
 */

import type { Language, GradingScale } from '@/types';

/**
 * Formate un nombre selon la locale
 * @param num - Nombre à formater
 * @param locale - Locale (dérivée de la langue)
 * @param options - Options de formatage
 * @returns Nombre formaté
 */
export const formatNumber = (
  num: number, 
  locale: Language = 'fr',
  options: Intl.NumberFormatOptions = {}
): string => {
  const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
    pt: 'pt-BR',
    ee: 'en-US' // Fallback pour Ewe
  };
  
  try {
    return new Intl.NumberFormat(localeMap[locale], {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    }).format(num);
  } catch {
    return num.toFixed(options.maximumFractionDigits || 2);
  }
};

/**
 * Formate une note selon l'échelle et la locale
 * @param grade - Note à formater
 * @param scale - Échelle de notation
 * @param locale - Langue pour le formatage
 * @returns Note formatée avec l'échelle
 */
export const formatGrade = (
  grade: number, 
  scale: GradingScale = 20, 
  locale: Language = 'fr'
): string => {
  const formattedGrade = formatNumber(grade, locale, { maximumFractionDigits: 2 });
  const formattedScale = formatNumber(scale, locale, { maximumFractionDigits: 0 });
  
  return `${formattedGrade}/${formattedScale}`;
};

/**
 * Formate un pourcentage selon la locale
 * @param value - Valeur à formater en pourcentage (0-1 ou 0-100)
 * @param locale - Langue pour le formatage
 * @param isAlreadyPercent - Si la valeur est déjà en pourcentage (0-100)
 * @returns Pourcentage formaté
 */
export const formatPercentage = (
  value: number, 
  locale: Language = 'fr',
  isAlreadyPercent: boolean = false
): string => {
  const percentage = isAlreadyPercent ? value : value * 100;
  
  try {
    const localeMap: Record<Language, string> = {
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES',
      pt: 'pt-BR',
      ee: 'en-US'
    };
    
    return new Intl.NumberFormat(localeMap[locale], {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(isAlreadyPercent ? value / 100 : value);
  } catch {
    return `${Math.round(percentage)}%`;
  }
};

/**
 * Formate une date selon la locale
 * @param date - Date à formater
 * @param locale - Langue pour le formatage
 * @param options - Options de formatage de date
 * @returns Date formatée
 */
export const formatDate = (
  date: Date | string, 
  locale: Language = 'fr',
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Date invalide';
  }
  
  const localeMap: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
    pt: 'pt-BR',
    ee: 'en-US'
  };
  
  try {
    return new Intl.DateTimeFormat(localeMap[locale], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }).format(dateObj);
  } catch {
    return dateObj.toLocaleDateString();
  }
};

/**
 * Formate une moyenne générale avec couleur sémantique
 * @param average - Moyenne à formater
 * @param scale - Échelle de notation
 * @param locale - Langue pour le formatage
 * @returns Objet avec moyenne formatée et classe CSS
 */
export const formatAverageWithColor = (
  average: number, 
  scale: GradingScale = 20, 
  locale: Language = 'fr'
): { formatted: string; colorClass: string; level: 'excellent' | 'good' | 'average' | 'poor' } => {
  const percentage = (average / scale) * 100;
  const formatted = formatGrade(average, scale, locale);
  
  let colorClass: string;
  let level: 'excellent' | 'good' | 'average' | 'poor';
  
  if (percentage >= 85) {
    colorClass = 'text-emerald-600 dark:text-emerald-400';
    level = 'excellent';
  } else if (percentage >= 70) {
    colorClass = 'text-blue-600 dark:text-blue-400';
    level = 'good';
  } else if (percentage >= 50) {
    colorClass = 'text-amber-600 dark:text-amber-400';
    level = 'average';
  } else {
    colorClass = 'text-red-600 dark:text-red-400';
    level = 'poor';
  }
  
  return { formatted, colorClass, level };
};

/**
 * Formate une durée en texte lisible
 * @param seconds - Durée en secondes
 * @param locale - Langue pour le formatage
 * @returns Durée formatée
 */
export const formatDuration = (seconds: number, locale: Language = 'fr'): string => {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const translations = {
    fr: {
      second: 'seconde',
      seconds: 'secondes',
      minute: 'minute',
      minutes: 'minutes',
      hour: 'heure',
      hours: 'heures',
      day: 'jour',
      days: 'jours'
    },
    en: {
      second: 'second',
      seconds: 'seconds',
      minute: 'minute',
      minutes: 'minutes',
      hour: 'hour',
      hours: 'hours',
      day: 'day',
      days: 'days'
    },
    es: {
      second: 'segundo',
      seconds: 'segundos',
      minute: 'minuto',
      minutes: 'minutos',
      hour: 'hora',
      hours: 'horas',
      day: 'día',
      days: 'días'
    },
    pt: {
      second: 'segundo',
      seconds: 'segundos',
      minute: 'minuto',
      minutes: 'minutos',
      hour: 'hora',
      hours: 'horas',
      day: 'dia',
      days: 'dias'
    },
    ee: {
      second: 'second',
      seconds: 'seconds',
      minute: 'minute',
      minutes: 'minutes',
      hour: 'hour',
      hours: 'hours',
      day: 'day',
      days: 'days'
    }
  };
  
  const t = translations[locale];
  
  if (days > 0) {
    return `${days} ${days === 1 ? t.day : t.days}`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? t.hour : t.hours}`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? t.minute : t.minutes}`;
  } else {
    return `${seconds} ${seconds === 1 ? t.second : t.seconds}`;
  }
};

/**
 * Formate une taille de fichier en octets
 * @param bytes - Taille en octets
 * @param locale - Langue pour le formatage
 * @returns Taille formatée
 */
export const formatFileSize = (bytes: number, locale: Language = 'fr'): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  const formatted = formatNumber(size, locale, { maximumFractionDigits: 1 });
  return `${formatted} ${units[unitIndex]}`;
};

/**
 * Tronque un texte avec ellipse intelligente
 * @param text - Texte à tronquer
 * @param maxLength - Longueur maximale
 * @param ellipsis - Caractère d'ellipse
 * @returns Texte tronqué
 */
export const truncateText = (
  text: string, 
  maxLength: number, 
  ellipsis: string = '...'
): string => {
  if (text.length <= maxLength) return text;
  
  // Essaie de couper sur un espace pour éviter de couper un mot
  const truncated = text.slice(0, maxLength - ellipsis.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + ellipsis;
  }
  
  return truncated + ellipsis;
};