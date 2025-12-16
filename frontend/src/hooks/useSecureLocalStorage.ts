/**
 * Hook React pour localStorage sécurisé avec gestion d'erreurs
 * Utilise les utilities de storage et fournit une interface réactive
 */

import { useState, useEffect, useCallback } from 'react';
import { safeGetLocalStorage, safeSetLocalStorage, safeRemoveLocalStorage } from '@/lib/storage';
import type { UseLocalStorageResult, AppError } from '@/types';

/**
 * Hook pour gérer localStorage de manière sécurisée et réactive
 * @param key - Clé de stockage
 * @param defaultValue - Valeur par défaut
 * @returns Résultat avec valeur, setters et état
 */
export const useSecureLocalStorage = <T>(
  key: string,
  defaultValue: T
): UseLocalStorageResult<T> => {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  // Chargement initial
  useEffect(() => {
    try {
      const stored = safeGetLocalStorage(key, defaultValue);
      setValue(stored);
      setError(null);
    } catch (err) {
      const appError: AppError = {
        code: 'STORAGE_READ_ERROR',
        message: `Erreur lecture ${key}`,
        details: err,
        timestamp: new Date()
      };
      setError(appError);
      setValue(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue]);

  // Fonction pour modifier la valeur
  const updateValue = useCallback((newValue: T): boolean => {
    try {
      const success = safeSetLocalStorage(key, newValue);
      if (success) {
        setValue(newValue);
        setError(null);
        return true;
      } else {
        const appError: AppError = {
          code: 'STORAGE_WRITE_ERROR',
          message: `Impossible d'écrire ${key}`,
          timestamp: new Date()
        };
        setError(appError);
        return false;
      }
    } catch (err) {
      const appError: AppError = {
        code: 'STORAGE_WRITE_ERROR',
        message: `Erreur écriture ${key}`,
        details: err,
        timestamp: new Date()
      };
      setError(appError);
      return false;
    }
  }, [key]);

  // Fonction pour supprimer la valeur
  const removeValue = useCallback((): boolean => {
    try {
      const success = safeRemoveLocalStorage(key);
      if (success) {
        setValue(defaultValue);
        setError(null);
        return true;
      } else {
        const appError: AppError = {
          code: 'STORAGE_REMOVE_ERROR',
          message: `Impossible de supprimer ${key}`,
          timestamp: new Date()
        };
        setError(appError);
        return false;
      }
    } catch (err) {
      const appError: AppError = {
        code: 'STORAGE_REMOVE_ERROR',
        message: `Erreur suppression ${key}`,
        details: err,
        timestamp: new Date()
      };
      setError(appError);
      return false;
    }
  }, [key, defaultValue]);

  return {
    value,
    setValue: updateValue,
    removeValue,
    isLoading,
    error
  };
};

/**
 * Hook spécialisé pour stocker les préférences utilisateur
 */
export const useUserPreferences = () => {
  return useSecureLocalStorage('myfuture-preferences', {
    language: 'fr' as const,
    theme: 'light' as const,
    gradingScale: 20 as const,
    lastVisit: new Date().toISOString()
  });
};

/**
 * Hook spécialisé pour stocker les données de session
 */
export const useSessionData = () => {
  return useSecureLocalStorage('myfuture-session', {
    currentStep: 0,
    completedSteps: [] as number[],
    startedAt: new Date().toISOString()
  });
};