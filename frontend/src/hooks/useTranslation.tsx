/**
 * Hook de traduction amélioré avec lazy loading et persistance fiable
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  Language, 
  SUPPORTED_LANGUAGES,
  Translations,
  getSavedLanguage, 
  saveLanguage, 
  loadTranslations, 
  translate,
  preloadAllTranslations 
} from '@/lib/i18n';
import { useSecureLocalStorage } from '@/hooks/useSecureLocalStorage';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
  isReady: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

/**
 * Provider de traduction avec gestion d'état optimisée
 * Charge les traductions de manière asynchrone et gère la persistance
 */
export const TranslationProvider = ({ children }: TranslationProviderProps) => {
  const { value: savedLanguage, setValue: setSavedLanguage } = useSecureLocalStorage<Language>('app-language', 'fr');
  const [language, setCurrentLanguage] = useState<Language>(savedLanguage);
  const [translations, setTranslations] = useState<Translations>({});
  const [fallbackTranslations, setFallbackTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  /**
   * Charge les traductions pour une langue donnée
   * @param lang - Langue à charger
   */
  const loadLanguageTranslations = useCallback(async (lang: Language) => {
    try {
      setIsLoading(true);
      
      // Charge les traductions de la langue demandée et de la langue de fallback en parallèle
      const [currentLangTranslations, fallbackLangTranslations] = await Promise.all([
        loadTranslations(lang),
        lang !== 'en' ? loadTranslations('en') : Promise.resolve({})
      ]);
      
      setTranslations(currentLangTranslations);
      setFallbackTranslations(fallbackLangTranslations);
      setIsReady(true);
      
    } catch (error) {
      console.error('Failed to load translations:', error);
      // En cas d'erreur, utilise des traductions vides (les clés seront affichées)
      setTranslations({});
      setFallbackTranslations({});
      setIsReady(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Change la langue avec validation et persistance
   * @param newLanguage - Nouvelle langue à définir
   */
  const setLanguage = useCallback(async (newLanguage: Language) => {
    // Validation de sécurité
    if (!SUPPORTED_LANGUAGES.includes(newLanguage)) {
      console.warn(`Unsupported language: ${newLanguage}`);
      return;
    }

    if (newLanguage === language) {
      return; // Pas de changement nécessaire
    }

    setCurrentLanguage(newLanguage);
    setSavedLanguage(newLanguage);
    await loadLanguageTranslations(newLanguage);
  }, [language, loadLanguageTranslations]);

  /**
   * Fonction de traduction avec fallback automatique
   * @param key - Clé de traduction
   * @returns Chaîne traduite ou clé si non trouvée
   */
  const t = useCallback((key: string): string => {
    return translate(translations, fallbackTranslations, key);
  }, [translations, fallbackTranslations]);

  // Initialisation: charge les traductions de la langue sauvegardée
  useEffect(() => {
    let isMounted = true;

    const initializeTranslations = async () => {
      await loadLanguageTranslations(language);
      
      // Précharge les autres langues en arrière-plan pour améliorer les performances
      if (isMounted) {
        preloadAllTranslations().catch(() => {
          // Échec silencieux - pas critique pour l'UX
        });
      }
    };

    initializeTranslations();

    return () => {
      isMounted = false;
    };
  }, []); // Exécute seulement au montage

  // Met à jour les traductions quand la langue change
  useEffect(() => {
    if (isReady) {
      loadLanguageTranslations(language);
    }
  }, [language, loadLanguageTranslations, isReady]);

  const contextValue: TranslationContextType = {
    language,
    setLanguage,
    t,
    isLoading,
    isReady
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

/**
 * Hook pour utiliser le système de traduction
 * @returns Context de traduction avec validation
 */
export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  
  return context;
};

// Export des types pour utilisation externe
export type { Language };
export { SUPPORTED_LANGUAGES };