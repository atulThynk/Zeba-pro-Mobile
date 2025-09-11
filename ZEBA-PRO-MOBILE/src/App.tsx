import { useEffect } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom'; // Removed useHistory import
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapacitorApp } from '@capacitor/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast'; // Explicit import from react-hot-toast
import { usePushNotifications } from './hooks/usePushNotifications';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider } from './contexts/AuthContext';
import AnimatedLogin from './components/AnimatedLogin';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import TimeOffPage from './pages/TimeOffPage';
import PayslipPage from './pages/PayslipPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { SplashScreen } from '@capacitor/splash-screen';

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
import '@capacitor-community/safe-area';
import '@capacitor/status-bar';
import '@capacitor/push-notifications';

// Initialize Ionic React
setupIonicReact();

// Configure Tanstack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const AppContent: React.FC = () => {
  const { isInitialized, error } = usePushNotifications(); // Removed sendTestNotification if unused

  useEffect(() => {
    const initializeApp = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          console.log('Initializing native platform...');

          // Configure safe area
          const { insets } = await SafeArea.getSafeAreaInsets();
          console.log('Safe Area Insets:', insets);
          document.documentElement.style.setProperty('--safe-area-inset-top', `${insets.top}px`);
          document.documentElement.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`);
          document.documentElement.style.setProperty('--safe-area-inset-left', `${insets.left}px`);
          document.documentElement.style.setProperty('--safe-area-inset-right', `${insets.right}px`);

          // Configure status bar
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#00000000' });
          await StatusBar.setOverlaysWebView({ overlay: true });

          // Hide splash screen
          setTimeout(async () => {
            try {
              await SplashScreen.hide();
              console.log('Splash screen hidden');
            } catch (error) {
              console.warn('Error hiding splash screen:', error);
            }
          }, 1500);
        } catch (error) {
          console.warn('Error configuring native plugins:', error);
        }
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

  // Handle app state changes and notification navigation
  useEffect(() => {
    const handleNavigateToAttendance = () => {
      console.log('Navigating to attendance from push notification');
      window.location.href = '/attendance'; // Use window.location for React Router v5
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

  return (
    <div className="app-container bg-background text-foreground">
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            color: '#fff',
            padding: '16px',
            fontSize: '16px',
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
      <IonRouterOutlet>
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
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <IonApp>
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