/**
 * Système de validation strict avec messages d'erreur personnalisés
 * Validation des formulaires, données utilisateur, types
 */

import type { 
  Subject, 
  UserProfile, 
  EducationLevel, 
  GradingScale, 
  Language,
  ValidationError 
} from '@/types';

/**
 * Crée une erreur de validation typée
 */
const createValidationError = (
  field: string, 
  value: unknown, 
  message: string
): ValidationError => ({
  code: 'VALIDATION_ERROR',
  field,
  value,
  message,
  timestamp: new Date()
});

/**
 * Valide une note selon l'échelle de notation
 */
export const validateGrade = (
  grade: string | number, 
  scale: GradingScale = 20
): { isValid: boolean; value?: number; error?: ValidationError } => {
  const numGrade = typeof grade === 'string' ? parseFloat(grade.replace(',', '.')) : grade;
  
  if (isNaN(numGrade)) {
    return {
      isValid: false,
      error: createValidationError('grade', grade, 'La note doit être un nombre valide')
    };
  }
  
  if (numGrade < 0) {
    return {
      isValid: false,
      error: createValidationError('grade', grade, 'La note ne peut pas être négative')
    };
  }
  
  if (numGrade > scale) {
    return {
      isValid: false,
      error: createValidationError('grade', grade, `La note ne peut pas dépasser ${scale}`)
    };
  }
  
  return {
    isValid: true,
    value: Math.round(numGrade * 100) / 100
  };
};

/**
 * Valide un nom de matière
 */
export const validateSubjectName = (
  name: string
): { isValid: boolean; value?: string; error?: ValidationError } => {
  if (typeof name !== 'string') {
    return {
      isValid: false,
      error: createValidationError('subject', name, 'Le nom de matière doit être une chaîne')
    };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: createValidationError('subject', name, 'Le nom de matière doit contenir au moins 2 caractères')
    };
  }
  
  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: createValidationError('subject', name, 'Le nom de matière ne peut pas dépasser 50 caractères')
    };
  }
  
  // Vérifie les caractères autorisés
  const allowedPattern = /^[a-zA-ZÀ-ÿ0-9\s\-'()]+$/;
  if (!allowedPattern.test(trimmed)) {
    return {
      isValid: false,
      error: createValidationError('subject', name, 'Le nom de matière contient des caractères non autorisés')
    };
  }
  
  return {
    isValid: true,
    value: trimmed
  };
};

/**
 * Valide une matière complète
 */
export const validateSubject = (
  subject: Partial<Subject>
): { isValid: boolean; value?: Subject; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];
  
  // Validation du nom
  const nameValidation = validateSubjectName(subject.name || '');
  if (!nameValidation.isValid) {
    errors.push(nameValidation.error!);
  }
  
  // Validation de la note
  const gradeValidation = validateGrade(subject.grade || 0);
  if (!gradeValidation.isValid) {
    errors.push(gradeValidation.error!);
  }
  
  // Validation du coefficient
  if (subject.coefficient !== undefined) {
    if (typeof subject.coefficient !== 'number' || subject.coefficient <= 0) {
      errors.push(createValidationError(
        'coefficient', 
        subject.coefficient, 
        'Le coefficient doit être un nombre positif'
      ));
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  return {
    isValid: true,
    value: {
      id: subject.id || crypto.randomUUID(),
      name: nameValidation.value!,
      grade: gradeValidation.value!,
      coefficient: subject.coefficient || 1,
      isRequired: subject.isRequired || false
    },
    errors: []
  };
};

/**
 * Valide un profil utilisateur complet
 */
export const validateUserProfile = (
  profile: Partial<UserProfile>
): { isValid: boolean; value?: UserProfile; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];
  
  // Validation du niveau d'éducation
  if (!profile.level || !['bepc', 'seconde', 'premiere', 'terminale', 'bac1', 'bac2', 'bac3', 'master', 'doctorat'].includes(profile.level)) {
    errors.push(createValidationError('level', profile.level, 'Niveau d\'éducation invalide'));
  }
  
  // Validation de l'échelle de notation
  if (!profile.gradingScale || ![20, 100, 5, 10].includes(profile.gradingScale)) {
    errors.push(createValidationError('gradingScale', profile.gradingScale, 'Échelle de notation invalide'));
  }
  
  // Validation des matières
  if (!profile.subjects || !Array.isArray(profile.subjects) || profile.subjects.length < 6) {
    errors.push(createValidationError('subjects', profile.subjects, 'Au moins 6 matières sont requises'));
  } else {
    profile.subjects.forEach((subject, index) => {
      const subjectValidation = validateSubject(subject);
      if (!subjectValidation.isValid) {
        errors.push(...subjectValidation.errors.map(error => ({
          ...error,
          field: `subjects[${index}].${error.field}`
        })));
      }
    });
  }
  
  // Validation de l'aspiration de carrière (optionnelle)
  if (profile.careerAspiration && typeof profile.careerAspiration !== 'string') {
    errors.push(createValidationError('careerAspiration', profile.careerAspiration, 'L\'aspiration de carrière doit être une chaîne'));
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  return {
    isValid: true,
    value: {
      level: profile.level as EducationLevel,
      subjects: profile.subjects as readonly Subject[],
      careerAspiration: profile.careerAspiration,
      gradingScale: profile.gradingScale as GradingScale,
      inputMethod: profile.inputMethod || 'manual'
    },
    errors: []
  };
};

/**
 * Valide une langue
 */
export const validateLanguage = (
  lang: unknown
): { isValid: boolean; value?: Language; error?: ValidationError } => {
  if (typeof lang !== 'string') {
    return {
      isValid: false,
      error: createValidationError('language', lang, 'La langue doit être une chaîne')
    };
  }
  
  const supportedLanguages: Language[] = ['fr', 'en', 'pt', 'es', 'ee'];
  
  if (!supportedLanguages.includes(lang as Language)) {
    return {
      isValid: false,
      error: createValidationError('language', lang, `Langue non supportée. Langues disponibles: ${supportedLanguages.join(', ')}`)
    };
  }
  
  return {
    isValid: true,
    value: lang as Language
  };
};

/**
 * Valide une URL de partage
 */
export const validateShareUrl = (
  url: string
): { isValid: boolean; error?: ValidationError } => {
  try {
    const parsed = new URL(url);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        isValid: false,
        error: createValidationError('url', url, 'Seuls les protocoles HTTP et HTTPS sont autorisés')
      };
    }
    
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: createValidationError('url', url, 'URL invalide')
    };
  }
};

/**
 * Valide un email
 */
export const validateEmail = (
  email: string
): { isValid: boolean; error?: ValidationError } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: createValidationError('email', email, 'Format d\'email invalide')
    };
  }
  
  return { isValid: true };
};

/**
 * Sanitise et valide une entrée de texte libre
 */
export const validateAndSanitizeText = (
  text: string,
  maxLength: number = 1000
): { isValid: boolean; value?: string; error?: ValidationError } => {
  if (typeof text !== 'string') {
    return {
      isValid: false,
      error: createValidationError('text', text, 'Le texte doit être une chaîne')
    };
  }
  
  const sanitized = text
    .trim()
    .replace(/[<>]/g, '') // Supprime les caractères HTML dangereux
    .slice(0, maxLength);
  
  if (sanitized.length === 0) {
    return {
      isValid: false,
      error: createValidationError('text', text, 'Le texte ne peut pas être vide')
    };
  }
  
  return {
    isValid: true,
    value: sanitized
  };
};