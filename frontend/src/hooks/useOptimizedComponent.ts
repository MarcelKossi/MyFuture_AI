/**
 * Hook d'optimisation des performances React
 * Mémoisation, callbacks stables, debouncing, lazy loading
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * Hook pour créer des callbacks stables optimisés
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps) as T;
};

/**
 * Hook pour la mémoisation de calculs coûteux
 */
export const useExpensiveCalculation = <T>(
  calculation: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = calculation();
    const endTime = performance.now();
    
    if (process.env.NODE_ENV === 'development' && (endTime - startTime) > 100) {
      console.warn(`Calcul coûteux détecté: ${endTime - startTime}ms`);
    }
    
    return result;
  }, deps);
};

/**
 * Hook de debouncing pour optimiser les saisies utilisateur
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook pour le throttling des événements fréquents
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]) as T;
};

/**
 * Hook pour la détection des composants visibles (Intersection Observer)
 */
export const useIntersectionObserver = (
  options?: IntersectionObserverInit
): [React.RefObject<HTMLElement>, boolean] => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [options]);

  return [targetRef, isIntersecting];
};

/**
 * Hook pour le lazy loading des composants lourds
 */
export const useLazyComponent = <T>(
  importFunction: () => Promise<{ default: T }>,
  dependencies: React.DependencyList = []
): { Component: T | null; isLoading: boolean; error: Error | null } => {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    importFunction()
      .then((module) => {
        setComponent(() => module.default);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, dependencies);

  return { Component, isLoading, error };
};

/**
 * Hook pour la gestion optimisée du localStorage avec cache
 */
export const useCachedLocalStorage = <T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] => {
  const cache = useRef<Map<string, any>>(new Map());

  const getValue = useCallback(() => {
    if (cache.current.has(key)) {
      return cache.current.get(key);
    }

    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        cache.current.set(key, parsed);
        return parsed;
      }
    } catch (error) {
      console.warn(`Erreur lecture localStorage pour ${key}:`, error);
    }

    cache.current.set(key, defaultValue);
    return defaultValue;
  }, [key, defaultValue]);

  const [storedValue, setStoredValue] = useState<T>(getValue);

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      cache.current.set(key, value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Erreur écriture localStorage pour ${key}:`, error);
    }
  }, [key]);

  return [storedValue, setValue];
};

/**
 * Hook pour l'optimisation des re-renders avec shallow compare
 */
export const useShallowMemo = <T extends Record<string, any>>(obj: T): T => {
  const ref = useRef<T>(obj);

  return useMemo(() => {
    const keys = Object.keys(obj);
    const prevKeys = Object.keys(ref.current);

    if (keys.length !== prevKeys.length) {
      ref.current = obj;
      return obj;
    }

    for (const key of keys) {
      if (obj[key] !== ref.current[key]) {
        ref.current = obj;
        return obj;
      }
    }

    return ref.current;
  }, [obj]);
};

/**
 * Hook pour la gestion des erreurs avec retry automatique
 */
export const useRetryableOperation = <T, E = Error>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): {
  execute: () => Promise<T>;
  isLoading: boolean;
  error: E | null;
  retryCount: number;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<E | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async (): Promise<T> => {
    setIsLoading(true);
    setError(null);
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        const result = await operation();
        setIsLoading(false);
        setRetryCount(attempts);
        return result;
      } catch (err) {
        attempts++;
        setRetryCount(attempts);

        if (attempts > maxRetries) {
          setError(err as E);
          setIsLoading(false);
          throw err;
        }

        // Délai progressif: retryDelay * tentative
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * attempts)
        );
      }
    }

    throw new Error('Max retries exceeded');
  }, [operation, maxRetries, retryDelay]);

  return { execute, isLoading, error, retryCount };
};