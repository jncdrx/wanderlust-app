import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { UserSession, UserType } from '../types/travel';

type SessionContextValue = {
  userType: UserType;
  currentUser: UserSession | null;
  darkMode: boolean;
  isBootstrapping: boolean;
  login: (user: UserSession, token: string) => void;
  logout: () => void;
  setDarkMode: (enabled: boolean) => void;
  updateUser: (updates: Partial<UserSession>) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const DARK_MODE_KEY = 'darkMode';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(DARK_MODE_KEY);
  if (stored !== null) {
    return stored === 'true';
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

export function SessionProvider({ children }: PropsWithChildren) {
  const [userType, setUserType] = useState<UserType>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as UserSession;
        setCurrentUser(parsedUser);
        setUserType('user');
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsBootstrapping(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DARK_MODE_KEY, darkMode ? 'true' : 'false');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const login = (user: UserSession, token: string) => {
    setCurrentUser(user);
    setUserType('user');
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    setUserType(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const updateUser = (updates: Partial<UserSession>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const value = useMemo<SessionContextValue>(() => ({
    userType,
    currentUser,
    darkMode,
    isBootstrapping,
    login,
    logout,
    setDarkMode,
    updateUser,
  }), [currentUser, darkMode, isBootstrapping, userType]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

