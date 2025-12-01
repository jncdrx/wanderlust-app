import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { SplashScreen } from '../components/SplashScreen';
import { LoginScreen } from '../components/LoginScreen';
import { Dashboard } from '../components/Dashboard';
import { ItineraryScreen } from '../components/ItineraryScreen';
import { DestinationScreen } from '../components/DestinationScreen';
import { BudgetScreen } from '../components/BudgetScreen';
import { GalleryScreen } from '../components/GalleryScreen';
import { ReportsScreen } from '../components/ReportsScreen';
import { ProfileScreen } from '../components/ProfileScreen';
import { BottomNav } from '../components/BottomNav';
import { PageTransition } from '../components/PageTransition';
import { SmoothScroll } from '../components/SmoothScroll';
import { ScrollIndicator } from '../components/ScrollIndicator';
import { CenteredToastProvider, centeredToast } from '../components/CenteredToast';
import { useSession } from '../context/SessionContext';
import { useTravelData } from '../context/DataContext';
import type { ReactNode } from 'react';
import type { UserSession } from '../types/travel';

const tabRouteMap: Record<string, string> = {
  home: '/',
  itinerary: '/itinerary',
  destinations: '/destinations',
  gallery: '/gallery',
  profile: '/profile',
};

const navigationPathMap: Record<string, string> = {
  ...tabRouteMap,
  budget: '/budget',
  reports: '/reports',
};

const routeTabMap = Object.entries(tabRouteMap).reduce<Record<string, string>>((acc, [tab, path]) => {
  acc[path] = tab;
  return acc;
}, {});

const loginOnlyRoutes = ['/login'];

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser, isBootstrapping } = useSession();

  if (isBootstrapping) {
    return <SplashScreen onComplete={() => undefined} />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * AppRouter Component
 * 
 * This component MUST be rendered inside the following provider hierarchy:
 * <SessionProvider>
 *   <QueryClientProvider>
 *     <DataProvider>
 *       <BrowserRouter>
 *         <AppRouter />  ← This component
 *       </BrowserRouter>
 *     </DataProvider>
 *   </QueryClientProvider>
 * </SessionProvider>
 * 
 * Dependencies:
 * - useSession() requires SessionProvider
 * - useTravelData() requires DataProvider (which itself requires SessionProvider and QueryClientProvider)
 * - useLocation() and useNavigate() require BrowserRouter
 */
export function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    userType,
    currentUser,
    darkMode,
    setDarkMode,
    login,
    logout,
  } = useSession();
  
  // useTravelData hook - this will work because AppRouter is inside DataProvider
  // If this throws an error, it means the provider hierarchy is incorrect
  const {
    trips,
    destinations,
    photos,
    addTrip,
    updateTrip,
    addTripActivity,
    deleteTrip,
    addDestination,
    updateDestination,
    deleteDestination,
    addPhoto,
    updatePhoto,
    deletePhoto,
  } = useTravelData();

  const activeTab = routeTabMap[location.pathname] || 'home';
  const showScrollIndicator = !loginOnlyRoutes.includes(location.pathname);
  const userName = currentUser?.firstName || currentUser?.email || 'Traveler';

  const handleTabChange = (tab: string) => {
    const target = tabRouteMap[tab] || '/';
    if (location.pathname !== target) {
      navigate(target);
    }
  };

  const handleNavigate = (screen: string) => {
    const target = navigationPathMap[screen] || '/';
    navigate(target);
  };

  const handleLogin = (payload: { user: UserSession; token: string }) => {
    login(payload.user, payload.token);
    centeredToast.success(`Welcome back, ${payload.user.firstName || payload.user.email}!`, {
      description: 'Logged in successfully',
    });
    navigate('/', { replace: true });
  };

  const handleLogout = () => {
    logout();
    centeredToast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const layoutClass = darkMode
    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
    : 'bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-500';

  return (
    <>
    <div className={`min-h-screen transition-colors duration-300 ${layoutClass}`}>
      <SmoothScroll speed={1.5} smoothness={0.15} />

      {showScrollIndicator && <ScrollIndicator />}

      <div
        className="max-w-md mx-auto min-h-screen relative overflow-x-hidden overflow-y-auto scrollbar-hide scroll-smooth mobile-content-padding"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 16px))',
        }}
      >
        <Routes>
          <Route
            path="/login"
            element={
              <LoginScreen
                darkMode={darkMode}
                onLogin={handleLogin}
              />
            }
          />

          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <BudgetScreen darkMode={darkMode} />
                  <div
                    className={`fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t px-6 py-4 ${
                      darkMode
                        ? 'bg-slate-900/80 border-slate-700'
                        : 'bg-white/20 border-white/30'
                    }`}
                  >
                    <button
                      onClick={() => navigate('/')}
                      className="text-white hover:text-teal-300 transition-colors text-sm"
                    >
                      ← Back to Dashboard
                    </button>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <ReportsScreen
                    currentUser={currentUser}
                    trips={trips}
                    destinations={destinations}
                    photos={photos}
                    onNavigate={handleNavigate}
                    darkMode={darkMode}
                  />
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Dashboard
                    userType={userType!}
                    userName={userName}
                    currentUser={currentUser}
                    onNavigate={handleNavigate}
                    trips={trips}
                    destinations={destinations}
                    photos={photos}
                    darkMode={darkMode}
                  />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          <Route
            path="/itinerary"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <ItineraryScreen
                    currentUser={currentUser}
                    onAddTrip={addTrip}
                    onAddActivity={addTripActivity}
                    onDeleteTrip={deleteTrip}
                    onUpdateTrip={updateTrip}
                    trips={trips}
                    darkMode={darkMode}
                  />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          <Route
            path="/destinations"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <DestinationScreen
                    currentUser={currentUser}
                    destinations={destinations}
                    onAddDestination={addDestination}
                    onDeleteDestination={deleteDestination}
                    onUpdateDestination={updateDestination}
                    darkMode={darkMode}
                  />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <GalleryScreen
                    currentUser={currentUser}
                    photos={photos}
                    destinations={destinations}
                    onAddPhoto={addPhoto}
                    onDeletePhoto={deletePhoto}
                    onUpdatePhoto={updatePhoto}
                    darkMode={darkMode}
                  />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <ProfileScreen
                    userType={userType!}
                    userName={userName}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onNavigate={handleNavigate}
                    trips={trips}
                    destinations={destinations}
                    photos={photos}
                    darkMode={darkMode}
                    onToggleDarkMode={setDarkMode}
                  />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Centered Toast Provider - Modal style in center of screen */}
      <CenteredToastProvider darkMode={darkMode} />
    </div>

    {/* Bottom Navigation - OUTSIDE ALL CONTAINERS - True viewport fixed positioning */}
    {currentUser && !loginOnlyRoutes.includes(location.pathname) && (
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} darkMode={darkMode} />
    )}
    </>
  );
}

