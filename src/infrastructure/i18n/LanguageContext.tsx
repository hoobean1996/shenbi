/**
 * Language Context
 *
 * Provides language state and translation function to all components.
 * Persists language preference to storage API.
 * Falls back to defaults if API is unavailable.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translations, Language, TranslationKeys } from './translations';
import { getStorage } from '../storage/StorageProvider';
import { warn } from '../logging';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationFunction;
}

// Helper type to get nested object paths
type NestedKeyOf<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, unknown>
    ? `${K}.${NestedKeyOf<T[K]>}`
    : K
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

type TranslationFunction = (key: TranslationKey, fallback?: string) => string;

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * Get nested value from object by dot-separated path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load language preference on mount
  useEffect(() => {
    getStorage()
      .getSettings()
      .then((settings) => {
        if (settings.language) {
          setLanguageState(settings.language as Language);
        }
      })
      .catch((err) => {
        warn('Failed to load language settings, using defaults', { error: err }, 'LanguageContext');
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Update language and persist to storage
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    // Fire and forget - don't block on API
    getStorage()
      .updateSettings({ language: lang })
      .catch((err) => {
        warn('Failed to save language setting', { error: err, lang }, 'LanguageContext');
      });
  }, []);

  // Translation function
  const t: TranslationFunction = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      const value = getNestedValue(translations[language] as Record<string, unknown>, key);
      if (value) return value;

      // Fallback to English if key not found in current language
      if (language !== 'en') {
        const enValue = getNestedValue(translations.en as Record<string, unknown>, key);
        if (enValue) return enValue;
      }

      // Return fallback or key itself
      return fallback || key;
    },
    [language]
  );

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t,
  };

  // Don't render until language is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * Hook to access language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Hook for just the translation function (convenience)
 */
export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
