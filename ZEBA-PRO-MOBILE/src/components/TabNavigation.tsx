import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';
import { Calendar, LayoutDashboard, Clock, FileText, Bell, X, ShieldAlert,AlertTriangle } from 'lucide-react';
import { LockedFeatureIcon } from './icons/RestrictedAccessIcon';
import { createPortal } from 'react-dom';

interface TabNavigationProps {
  unreadNotificationsCount?: number;
}

const tabOrder: { [key: string]: number } = {
  '/': 0, // Dashboard
  '/attendance': 1,
  '/timeoff': 2,
  '/payslips': 3,
  '/notifications': 4,
};

const TabNavigation: React.FC<TabNavigationProps> = ({ unreadNotificationsCount = 0 }) => {
  const location = useLocation();
  const router = useIonRouter();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const isTenantOnFreePlan = userData?.isTenantOnFreePlan;
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const navigateTo = (path: string) => {
    if (path === currentPath) return; // Prevent navigation to the same path
    // Use 'none' direction for Dashboard to avoid swipe animations
    if (path === '/profile' || currentPath === '/') {
      router.push(path, 'none', 'push');
    } else {
      const currentIndex = tabOrder[currentPath] ?? -1;
      const targetIndex = tabOrder[path] ?? -1;
      const direction = targetIndex > currentIndex ? 'forward' : 'back';
      router.push(path, direction, 'push');
    }
  };

const RestrictedTab = ({ icon, label, isActiveTab }: { icon: React.ReactNode; label: string; isActiveTab: boolean }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation ${
        isActiveTab ? 'text-[#6170f6] font-medium' : 'text-gray-500'
      }`}
      onClick={() => setShowPremiumModal(true)}
    >
      {icon}
      <span className="text-xs mt-1.5 truncate">{label}</span>
    </div>
  );
};

  return (
    <nav
      className="bg-white border-t border-[#e4e7eb] fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'var(--safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-between items-center max-w-md mx-auto px-2 sm:px-4">
        <div
          className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation ${
            isActive('/') ? 'text-[#6170f6] font-medium' : 'text-gray-500'
          }`}
          onClick={() => navigateTo('/')}
        >
          <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
          <span className="text-xs mt-1.5 truncate">Dashboard</span>
        </div>

        {isTenantOnFreePlan ? (
          <RestrictedTab
            icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />}
            label="Attendance"
            isActiveTab={isActive('/attendance')}
          
          />
        ) : (
          <div
            className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation ${
              isActive('/attendance') ? 'text-[#6170f6] font-medium' : 'text-gray-500'
            }`}
            onClick={() => navigateTo('/attendance')}
          >
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
            <span className="text-xs mt-1.5 truncate">Attendance</span>
          </div>
        )}

        {isTenantOnFreePlan ? (
          <RestrictedTab
            icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />}
            label="TimeOff"
            isActiveTab={isActive('/timeoff')}
           
          />
        ) : (
          <div
            className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation ${
              isActive('/timeoff') ? 'text-[#6170f6] font-medium' : 'text-gray-500'
            }`}
            onClick={() => navigateTo('/timeoff')}
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
            <span className="text-xs mt-1.5 truncate">TimeOff</span>
          </div>
        )}

        <div
          className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation ${
            isActive('/payslips') ? 'text-[#6170f6] font-medium' : 'text-gray-500'
          }`}
          onClick={() => navigateTo('/payslips')}
        >
          <FileText className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
          <span className="text-xs mt-1.5 truncate">Payslip</span>
        </div>

        <div
          className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation relative ${
            isActive('/notifications') ? 'text-[#6170f6] font-medium' : 'text-gray-500'
          }`}
          onClick={() => navigateTo('/notifications')}
        >
          <div className="relative">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </div>
          <span className="text-xs mt-1.5 truncate">Notifications</span>
        </div>
      </div>
 {showPremiumModal && (
  createPortal(
  <>
    <div 
      className="fixed inset-0 bg-black/50 z-[998]"
      onClick={() => setShowPremiumModal(false)}
    />
    <div className="fixed inset-0 flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative">
        <button
          onClick={() => setShowPremiumModal(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center">
      <div className="w-full bg-[#F98180] text-white font-semibold text-sm py-2 rounded-md mb-4 mt-2 flex items-center justify-center gap-2">
  <div className="w-5 h-5">
    <AlertTriangle className="w-5 h-5" />
  </div>
  Access Restricted
</div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Premium Plan Required
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            This feature is exclusive to premium subscribers. Upgrade your plan to access this functionality and more advanced tools.
          </p>
        </div>

      </div>
    </div>
  </>,
   document.body
  )
)}


    </nav>
    
  );
};

export default TabNavigation;