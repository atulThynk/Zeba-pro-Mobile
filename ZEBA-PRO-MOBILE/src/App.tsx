import { useEffect, useState, useRef } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapacitorApp } from '@capacitor/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { usePushNotifications } from './hooks/usePushNotifications';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AnimatedLogin from './components/AnimatedLogin';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import TimeOffPage from './pages/TimeOffPage';
import PayslipPage from './pages/PayslipPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';
import TabNavigation from './components/TabNavigation';
import { SafeArea } from 'capacitor-plugin-safe-area';
import SplashScreen from './components/SplashScreen';
import { createAnimation, Animation } from '@ionic/react';

/* Core Ionic CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional Ionic CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Ionic Dark Mode */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import './index.css';
import { notificationService } from './services/notification-service';

// Initialize Ionic React with proper config
setupIonicReact({
  mode: 'ios',
  swipeBackEnabled: false,
});

// Configure Tanstack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Define tab order for determining navigation direction
const tabOrder: { [key: string]: number } = {
  '/': 0, // Dashboard
  '/attendance': 1,
  '/timeoff': 2,
  '/payslips': 3,
  '/notifications': 4,
};

// Custom animations
const forwardAnimation = (baseEl: HTMLElement): Animation => {
  return createAnimation()
    .addElement(baseEl.querySelector('.ion-page')!)
    .duration(300)
    .easing('ease-in-out')
    .fromTo('transform', 'translateX(100%)', 'translateX(0)')
    .fromTo('opacity', 0.2, 1);
};

const backwardAnimation = (baseEl: HTMLElement): Animation => {
  return createAnimation()
    .addElement(baseEl.querySelector('.ion-page')!)
    .duration(300)
    .easing('ease-in-out')
    .fromTo('transform', 'translateX(-100%)', 'translateX(0)')
    .fromTo('opacity', 0.2, 1);
};

const fadeAnimation = (baseEl: HTMLElement): Animation => {
  return createAnimation()
    .addElement(baseEl.querySelector('.ion-page')!)
    .duration(200)
    .easing('ease-in-out')
    .fromTo('opacity', 0, 1);
};

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isInitialized, error } = usePushNotifications();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [animation, setAnimation] = useState<(baseEl: HTMLElement) => Animation>(() => fadeAnimation);
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchNotificationsCount = async () => {
      if (!user) return; // Skip fetching if not logged in
      try {
        const unreadCount = await notificationService.getUnreadCount();
        setUnreadNotificationsCount(unreadCount);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    fetchNotificationsCount();
    const interval = setInterval(fetchNotificationsCount, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const initializeApp = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          console.log('Initializing native platform...');

          // Configure safe area
          const safeAreaInsets = await SafeArea.getSafeAreaInsets();
          console.log('Safe Area Insets:', safeAreaInsets);

          // Apply safe area CSS variables
          document.documentElement.style.setProperty('--safe-area-inset-top', `${safeAreaInsets.insets.top}px`);
          document.documentElement.style.setProperty('--safe-area-inset-bottom', `${safeAreaInsets.insets.bottom}px`);
          document.documentElement.style.setProperty('--safe-area-inset-left', `${safeAreaInsets.insets.left}px`);
          document.documentElement.style.setProperty('--safe-area-inset-right', `${safeAreaInsets.insets.right}px`);

          // Configure status bar
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch (error) {
          console.warn('Error configuring native plugins:', error);
          // Fallback to CSS env() variables
          document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 20px)');
          document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 20px)');
          document.documentElement.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
          document.documentElement.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
        }
      } else {
        // Web fallback
        document.documentElement.style.setProperty('--safe-area-inset-top', '0px');
        document.documentElement.style.setProperty('--safe-area-inset-bottom', '0px');
        document.documentElement.style.setProperty('--safe-area-inset-left', '0px');
        document.documentElement.style.setProperty('--safe-area-inset-right', '0px');
      }

      // Set viewport height for mobile browsers
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };

      setViewportHeight();

      const handleResize = () => setViewportHeight();
      const handleOrientationChange = () => {
        setTimeout(setViewportHeight, 500);
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleOrientationChange);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
      };
    };

    initializeApp();
  }, []);

  // Handle push notification initialization status
  useEffect(() => {
    if (isInitialized) {
      console.log('Push notifications ready!');
    }
    if (error) {
      console.error('Push notification error:', error);
    }
  }, [isInitialized, error]);

  // Handle navigation direction
  useEffect(() => {
    const currentPath = location.pathname;
    if (prevPathRef.current !== null) {
      const currentIndex = tabOrder[currentPath] ?? -1;
      const prevIndex = tabOrder[prevPathRef.current] ?? -1;
      // Use fade animation for Dashboard (/) route
      if (currentIndex > prevIndex && currentIndex !== -1 && prevIndex !== -1) {
        setAnimation(() => forwardAnimation);
      } else if (currentIndex < prevIndex && currentIndex !== -1 && prevIndex !== -1) {
        setAnimation(() => backwardAnimation);
      } else {
        setAnimation(() => fadeAnimation); // Fallback for non-tab routes
      }
    }
    prevPathRef.current = currentPath;
  }, [location.pathname]);

  // Handle app state changes and notification navigation
  useEffect(() => {
    const handleNavigateToAttendance = () => {
      console.log('Navigating to attendance from push notification');
      window.location.href = '/attendance';
    };

    window.addEventListener('navigate-to-attendance', handleNavigateToAttendance);

    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
        if (isActive) {
          // Optionally refresh notifications or update badge
        }
      });

      CapacitorApp.addListener('appUrlOpen', (event) => {
        console.log('App opened from URL:', event.url);
        const url = new URL(event.url);
        const path = url.pathname;
        if (path === '/attendance') {
          window.location.href = '/attendance';
        }
      });
    }

    return () => {
      window.removeEventListener('navigate-to-attendance', handleNavigateToAttendance);
      if (Capacitor.isNativePlatform()) {
        CapacitorApp.removeAllListeners();
      }
    };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <div className="app-container flex flex-col h-screen">
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <>
          <Toaster
            position="bottom-center"
            containerClassName="toast-container"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '8px',
                color: '#fff',
                padding: '16px',
                fontSize: '16px',
                marginBottom: user ? 'calc(var(--safe-area-inset-bottom, 0px) + 60px)' : 'calc(var(--safe-area-inset-bottom, 0px) + 16px)', // Adjust for tabs
              },
              success: {
                style: {
                  background: '#22c55e',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          <div className="flex-1 overflow-y-auto">
            <IonRouterOutlet animation={animation}>
              <Route exact path="/login" component={AnimatedLogin} />
              <Route
                exact
                path="/"
                render={() => (
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                exact
                path="/attendance"
                render={() => (
                  <ProtectedRoute>
                    <AttendancePage />
                  </ProtectedRoute>
                )}
              />
              <Route
                exact
                path="/timeoff"
                render={() => (
                  <ProtectedRoute>
                    <TimeOffPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                exact
                path="/payslips"
                render={() => (
                  <ProtectedRoute>
                    <PayslipPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                exact
                path="/notifications"
                render={() => (
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                exact
                path="/profile"
                render={() => (
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                )}
              />
              <Route exact path="/index.html" render={() => <Redirect to="/" />} />
              <Route component={NotFound} />
            </IonRouterOutlet>
          </div>
          {user && !authLoading && <TabNavigation unreadNotificationsCount={unreadNotificationsCount} />}
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <IonApp className="ion-app-safe">
            <IonReactRouter>
              <AppContent />
            </IonReactRouter>
          </IonApp>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;