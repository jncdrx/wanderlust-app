import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useSession } from './SessionContext';
import { apiClient, type UserSettings } from '../api/client';

type AppSettings = {
  language: string;
  dateFormat: string;
  mapView: string;
  autoBackup: boolean;
};

type SettingsContextValue = {
  settings: UserSettings | null;
  appSettings: AppSettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateAppSettings: (updates: Partial<AppSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const defaultAppSettings: AppSettings = {
  language: 'English',
  dateFormat: 'MM/DD/YYYY',
  mapView: 'Standard',
  autoBackup: true,
};

export function SettingsProvider({ children }: PropsWithChildren) {
  const { currentUser } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from database
  const loadSettings = async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userSettings = await apiClient.getUserSettings(currentUser.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Set defaults if loading fails
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Load settings on mount and when user changes
  useEffect(() => {
    loadSettings();
  }, [currentUser?.id]);

  // Update settings in database
  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!currentUser?.id) return;

    try {
      const response = await apiClient.updateUserSettings(currentUser.id, updates);
      setSettings(response.settings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  // Update app settings (language, dateFormat, mapView, autoBackup)
  const updateAppSettings = async (updates: Partial<AppSettings>) => {
    if (!currentUser?.id) return;

    // Map app settings to database fields
    const dbUpdates: Partial<UserSettings> = {};
    
    if (updates.language !== undefined) {
      // Map language name to code
      const languageMap: Record<string, string> = {
        'English': 'en',
        'Spanish': 'es',
        'French': 'fr',
        'German': 'de',
      };
      dbUpdates.language = languageMap[updates.language] || 'en';
    }
    
    if (updates.dateFormat !== undefined) {
      dbUpdates.dateFormat = updates.dateFormat;
    }
    
    if (updates.mapView !== undefined) {
      dbUpdates.mapView = updates.mapView;
    }
    
    if (updates.autoBackup !== undefined) {
      dbUpdates.autoBackup = updates.autoBackup;
    }

    await updateSettings(dbUpdates);
  };

  // Get app settings from database settings
  const appSettings: AppSettings = useMemo(() => {
    if (!settings) return defaultAppSettings;

    // Map language code to name
    const languageMap: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
    };

    return {
      language: languageMap[settings.language] || 'English',
      dateFormat: settings.dateFormat || 'MM/DD/YYYY',
      mapView: settings.mapView || 'Standard',
      autoBackup: settings.autoBackup ?? true,
    };
  }, [settings]);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    appSettings,
    isLoading,
    updateSettings,
    updateAppSettings,
    refreshSettings: loadSettings,
  }), [settings, appSettings, isLoading]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

