/**
 * Types TypeScript stricts pour MyFuture AI
 * Définit les interfaces, types et enums utilisés dans l'application
 */

// ===== TYPES DE BASE =====

export type Language = 'fr' | 'en' | 'pt' | 'es' | 'ee';

export type EducationLevel = 
  | 'bepc' 
  | 'seconde' 
  | 'premiere' 
  | 'terminale' 
  | 'bac1' 
  | 'bac2' 
  | 'bac3' 
  | 'master' 
  | 'doctorat';

export type GradingScale = 20 | 100 | 5 | 10;

export type InputMethod = 'manual' | 'upload';

// ===== INTERFACES PRINCIPALES =====

export interface Subject {
  readonly id: string;
  readonly name: string;
  readonly grade: number;
  readonly coefficient?: number;
  readonly isRequired: boolean;
}

export interface UserProfile {
  readonly level: EducationLevel;
  readonly subjects: readonly Subject[];
  readonly careerAspiration?: string;
  readonly gradingScale: GradingScale;
  readonly inputMethod: InputMethod;
  readonly hasCareerIdea?: boolean;
  readonly careerGoal?: string;
}

export interface FieldRecommendation {
  readonly id: string;
  readonly name: string;
  readonly type: 'general' | 'technical';
  readonly compatibilityScore: number;
  readonly requiredSubjects: readonly string[];
  readonly careerProspects: readonly string[];
  readonly description: string;
  readonly minimumGrade: number;
}

export interface AnalysisResult {
  readonly userProfile: UserProfile;
  readonly generalAverage: number;
  readonly recommendedFields: readonly FieldRecommendation[];
  readonly improvementAdvice: readonly string[];
  readonly generatedAt?: Date;
  readonly sessionId?: string;
}

// ===== TYPES POUR LES FORMULAIRES =====

export interface GradeFormData {
  readonly [subjectId: string]: {
    readonly grade: string;
    readonly isValid: boolean;
  };
}

export interface CareerFormData {
  readonly hasCareerIdea: boolean;
  readonly careerName?: string;
}

// ===== TYPES POUR LE PARTAGE =====

export interface ShareData {
  readonly type: 'whatsapp' | 'facebook' | 'twitter' | 'link';
  readonly content: string;
  readonly url?: string;
}

export interface PDFExportData {
  readonly analysisResult: AnalysisResult;
  readonly studentName?: string;
  readonly includeCharts?: boolean;
  readonly includeAdvice: boolean;
  readonly format: 'A4' | 'letter';
}

// ===== TYPES POUR LES ERREURS =====

export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export interface ValidationError extends AppError {
  readonly field: string;
  readonly value: unknown;
}

// ===== TYPES POUR L'API =====

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: AppError;
  readonly timestamp: Date;
}

// ===== TYPES POUR LES HOOKS =====

export interface UseLocalStorageResult<T> {
  readonly value: T;
  readonly setValue: (value: T) => boolean;
  readonly removeValue: () => boolean;
  readonly isLoading: boolean;
  readonly error: AppError | null;
}

// ===== TYPES POUR L'ÉTAT GLOBAL =====

export interface AppState {
  readonly currentStep: number;
  readonly maxSteps: number;
  readonly userProfile: Partial<UserProfile>;
  readonly analysisResult: AnalysisResult | null;
  readonly isLoading: boolean;
  readonly error: AppError | null;
}

// ===== GUARDS DE TYPE =====

export const isValidLanguage = (lang: unknown): lang is Language => {
  return typeof lang === 'string' && ['fr', 'en', 'pt', 'es', 'ee'].includes(lang);
};

export const isValidEducationLevel = (level: unknown): level is EducationLevel => {
  return typeof level === 'string' && [
    'bepc', 'seconde', 'premiere', 'terminale', 'bac1', 'bac2', 'bac3', 'master', 'doctorat'
  ].includes(level);
};

export const isValidGradingScale = (scale: unknown): scale is GradingScale => {
  return typeof scale === 'number' && [20, 100, 5, 10].includes(scale);
};

// ===== CONSTANTES =====

export const EDUCATION_LEVELS: readonly EducationLevel[] = [
  'bepc', 'seconde', 'premiere', 'terminale', 'bac1', 'bac2', 'bac3', 'master', 'doctorat'
] as const;

export const GRADING_SCALES: readonly GradingScale[] = [20, 100, 5, 10] as const;

export const SUPPORTED_LANGUAGES: readonly Language[] = ['fr', 'en', 'pt', 'es', 'ee'] as const;

export const INPUT_METHODS: readonly InputMethod[] = ['manual', 'upload'] as const;