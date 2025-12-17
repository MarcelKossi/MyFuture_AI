/**
 * Configuration centralisée des métriques de performance
 * Surveillance des temps de réponse, mémoire, et erreurs
 */

import { useEffect, useRef, useCallback } from 'react';
import { globalErrorHandler } from '@/lib/errorHandler';

interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  memoryUsage: number;
  errorCount: number;
  lastMeasurement: Date;
}

interface PerformanceThresholds {
  slowPageLoad: number;    // ms
  slowRender: number;      // ms
  highMemoryUsage: number; // MB
  maxErrors: number;       // count per hour
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  slowPageLoad: 3000,    // 3 secondes
  slowRender: 500,       // 500ms
  highMemoryUsage: 100,  // 100MB
  maxErrors: 10          // 10 erreurs par heure
};

/**
 * Hook de surveillance des performances en temps réel
 */
export const usePerformanceMonitor = (thresholds: Partial<PerformanceThresholds> = {}) => {
  const metricsRef = useRef<PerformanceMetrics>({
    pageLoadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    errorCount: 0,
    lastMeasurement: new Date()
  });

  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  /**
   * Mesure le temps de chargement initial de la page
   */
  const measurePageLoad = useCallback(() => {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      metricsRef.current.pageLoadTime = loadTime;

      if (loadTime > finalThresholds.slowPageLoad) {
        console.warn(`Page load time slow: ${loadTime}ms`);
        globalErrorHandler.handleError(new Error(`Slow page load: ${loadTime}ms`));
      }
    }
  }, [finalThresholds.slowPageLoad]);

  /**
   * Mesure l'utilisation mémoire
   */
  const measureMemoryUsage = useCallback(() => {
    if (typeof window === 'undefined') return;

    // @ts-ignore - performance.memory est expérimental
    const memory = performance.memory;
    if (memory) {
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      metricsRef.current.memoryUsage = usedMB;

      if (usedMB > finalThresholds.highMemoryUsage) {
        console.warn(`High memory usage: ${usedMB.toFixed(2)}MB`);
        globalErrorHandler.handleError(new Error(`High memory usage: ${usedMB.toFixed(2)}MB`));
      }
    }
  }, [finalThresholds.highMemoryUsage]);

  /**
   * Mesure le temps de rendu d'un composant
   */
  const measureRenderTime = useCallback((componentName: string, startTime: number) => {
    const renderTime = performance.now() - startTime;
    metricsRef.current.renderTime = renderTime;

    if (renderTime > finalThresholds.slowRender) {
      console.warn(`Slow render for ${componentName}: ${renderTime.toFixed(2)}ms`);
      globalErrorHandler.handleError(new Error(`Slow render: ${componentName} ${renderTime.toFixed(2)}ms`));
    }

    return renderTime;
  }, [finalThresholds.slowRender]);

  /**
   * Surveille les performances en continu
   */
  useEffect(() => {
    // Mesure initiale
    measurePageLoad();
    measureMemoryUsage();

    // Surveillance périodique
    const interval = setInterval(() => {
      measureMemoryUsage();
      metricsRef.current.lastMeasurement = new Date();
    }, 30000); // Toutes les 30 secondes

    // Observer des Long Tasks (tâches > 50ms)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('PerformanceObserver not fully supported');
      }

      return () => {
        observer.disconnect();
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, [measurePageLoad, measureMemoryUsage]);

  /**
   * Retourne les métriques actuelles
   */
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  /**
   * Hook pour mesurer le temps de rendu d'un composant
   */
  const useRenderTimer = (componentName: string) => {
    const startTime = useRef(performance.now());

    useEffect(() => {
      measureRenderTime(componentName, startTime.current);
    });

    return measureRenderTime;
  };

  return {
    getMetrics,
    measureRenderTime,
    useRenderTimer
  };
};

/**
 * Hook pour surveiller les Core Web Vitals
 */
export const useWebVitals = () => {
  const vitalsRef = useRef({
    LCP: 0,   // Largest Contentful Paint
    FID: 0,   // First Input Delay
    CLS: 0,   // Cumulative Layout Shift
    FCP: 0,   // First Contentful Paint
    TTFB: 0   // Time to First Byte
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observeVitals = () => {
      // LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            vitalsRef.current.LCP = lastEntry.startTime;
            
            if (lastEntry.startTime > 2500) {
              console.warn(`Poor LCP: ${lastEntry.startTime.toFixed(2)}ms`);
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // FID (First Input Delay)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              vitalsRef.current.FID = entry.processingStart - entry.startTime;
              
              if (entry.processingStart - entry.startTime > 100) {
                console.warn(`Poor FID: ${(entry.processingStart - entry.startTime).toFixed(2)}ms`);
              }
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // CLS (Cumulative Layout Shift)
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            list.getEntries().forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            vitalsRef.current.CLS = clsValue;
            
            if (clsValue > 0.1) {
              console.warn(`Poor CLS: ${clsValue.toFixed(3)}`);
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

        } catch (error) {
          console.warn('Web Vitals observation not fully supported');
        }
      }

      // Navigation Timing pour FCP et TTFB
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        vitalsRef.current.TTFB = navigation.responseStart - navigation.fetchStart;
        
        if (navigation.responseStart - navigation.fetchStart > 600) {
          console.warn(`Poor TTFB: ${(navigation.responseStart - navigation.fetchStart).toFixed(2)}ms`);
        }
      }
    };

    observeVitals();
  }, []);

  const getVitals = useCallback(() => {
    return { ...vitalsRef.current };
  }, []);

  return { getVitals };
};