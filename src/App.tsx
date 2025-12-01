import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { SessionProvider, useSession } from './context/SessionContext';
import { DataProvider } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';
import { AppRouter } from './routes/AppRouter';
import { ErrorBoundary } from './components/ErrorBoundary';

type IntroStage = 'splash' | 'onboarding';

/**
 * IntroFlow component - handles splash and onboarding screens
 * This component uses useSession, so it must be inside SessionProvider
 */
function IntroFlow({ onFinish }: { onFinish: () => void }) {
  const { currentUser } = useSession();
  const [stage, setStage] = useState<IntroStage>('splash');

  useEffect(() => {
    if (currentUser) {
      onFinish();
    }
  }, [currentUser, onFinish]);

  if (currentUser) {
    return null;
  }

  if (stage === 'splash') {
    return <SplashScreen onComplete={() => setStage('onboarding')} />;
  }

  return <OnboardingScreen onComplete={onFinish} />;
}

// Create QueryClient instance outside component to prevent recreation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

/**
 * AppContent component - manages intro flow and main app routing
 * This component is inside DataProvider, so it can use useSession
 * but AppRouter (which uses useTravelData) is rendered here
 */
function AppContent() {
  const [introComplete, setIntroComplete] = useState(false);

  const handleIntroFinish = useCallback(() => {
    setIntroComplete(true);
  }, []);

  if (!introComplete) {
    return <IntroFlow onFinish={handleIntroFinish} />;
  }

  // AppRouter is rendered here, and it's inside DataProvider
  // so useTravelData hook will work correctly
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

/**
 * Provider Hierarchy (from outermost to innermost):
 * 
 * 1. ErrorBoundary (outermost)
 *    - Catches React errors and displays user-friendly error messages
 * 
 * 2. SessionProvider
 *    - Provides authentication/session context (currentUser, login, logout, etc.)
 *    - Must be before DataProvider because DataProvider uses useSession()
 * 
 * 3. QueryClientProvider
 *    - Provides React Query functionality for data fetching and caching
 *    - Must be before DataProvider because DataProvider uses useQuery()
 * 
 * 4. DataProvider
 *    - Provides travel data context (trips, destinations, photos, etc.)
 *    - Depends on both SessionProvider (for useSession) and QueryClientProvider (for useQuery)
 *    - Must wrap AppRouter because AppRouter uses useTravelData()
 * 
 * 5. BrowserRouter
 *    - Provides routing context for React Router
 *    - Wraps AppRouter which uses useLocation() and useNavigate()
 * 
 * 6. AppRouter (innermost)
 *    - Main routing component that uses:
 *      - useSession() from SessionProvider ✓
 *      - useTravelData() from DataProvider ✓
 *      - useLocation() and useNavigate() from BrowserRouter ✓
 * 
 * Why this order is necessary:
 * - React Context works by providing values to all descendant components
 * - A hook can only access context from providers that are ABOVE it in the tree
 * - DataProvider needs SessionProvider and QueryClientProvider to be above it
 * - AppRouter needs DataProvider to be above it to use useTravelData()
 * - If providers are in the wrong order, hooks will throw "must be used within Provider" errors
 * 
 * Example of what happens if order is wrong:
 * - If DataProvider is above SessionProvider, DataProvider can't use useSession()
 * - If AppRouter is above DataProvider, AppRouter can't use useTravelData()
 */
export default function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <DataProvider>
              <AppContent />
            </DataProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}

