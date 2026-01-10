/**
 * Adventure Context
 *
 * Provides shared adventure data loading across adventure pages.
 * Loads data from backend API.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ParsedAdventure, loadAdventuresFromApi } from '../../../infrastructure/levels';
import { getStorage } from '../../../infrastructure/storage';
import { parseLevel } from '../../../infrastructure/levels/loader';
import { useLanguage } from '../../../infrastructure/i18n';
import { error as logError } from '../../../infrastructure/logging';

interface AdventureContextValue {
  adventures: ParsedAdventure[];
  isLoading: boolean;
  loadError: string | null;
  isCustomAdventure: boolean;
}

const AdventureContext = createContext<AdventureContextValue | null>(null);

export function AdventureProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();

  const [adventures, setAdventures] = useState<ParsedAdventure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCustomAdventure, setIsCustomAdventure] = useState(false);

  // Load adventures from API or custom content
  useEffect(() => {
    async function loadLevels() {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Check for custom adventure from query param
        const customAdventureId = searchParams.get('custom');
        if (customAdventureId) {
          // Load custom adventure from teacher content storage
          const teacherContent = await getStorage().getTeacherContent();
          const customAdventure = teacherContent.adventures.find((a) => a.id === customAdventureId);

          if (customAdventure && customAdventure.levels.length > 0) {
            // Convert custom adventure to ParsedAdventure format
            const parsed: ParsedAdventure = {
              id: customAdventure.id,
              name: customAdventure.name,
              description: customAdventure.description,
              icon: customAdventure.icon,
              gameType: customAdventure.gameType,
              levels: customAdventure.levels.map((l) => parseLevel(l.data)),
            };
            setAdventures([parsed]);
            setIsCustomAdventure(true);
            setIsLoading(false);
            return;
          }
        }

        // Load from API
        const { adventures: apiAdventures } = await loadAdventuresFromApi(language);
        setAdventures(apiAdventures);
        setIsCustomAdventure(false);
      } catch (err) {
        logError('Failed to load adventures', err, undefined, 'AdventureContext');
        setLoadError(err instanceof Error ? err.message : 'Failed to load adventures');
      } finally {
        setIsLoading(false);
      }
    }
    loadLevels();
  }, [language, searchParams]);

  return (
    <AdventureContext.Provider
      value={{
        adventures,
        isLoading,
        loadError,
        isCustomAdventure,
      }}
    >
      {children}
    </AdventureContext.Provider>
  );
}

export function useAdventureContext() {
  const context = useContext(AdventureContext);
  if (!context) {
    throw new Error('useAdventureContext must be used within AdventureProvider');
  }
  return context;
}
