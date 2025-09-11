import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, LayoutDashboard, Clock, FileText, Bell, ArrowUp } from 'lucide-react';
import { LockedFeatureIcon } from './icons/RestrictedAccessIcon';

interface TabNavigationProps {
  unreadNotificationsCount?: number;
}

// const LockedFeatureIcon: React.FC = () => (
//   <span
//     className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 shadow-sm"
//   >
//     <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2} />
//   </span>
// );

const TabNavigation: React.FC<TabNavigationProps> = ({ unreadNotificationsCount = 0 }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const isTenantOnFreePlan = userData?.isTenantOnFreePlan;

  const RestrictedTab = ({ icon, label, isActiveTab }: { icon: React.ReactNode; label: string; isActiveTab: boolean }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClick = () => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000); // Hide after 2 seconds
    };

    return (
      <div
        className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 cursor-not-allowed opacity-90 relative ${
          isActiveTab ? 'text-[#6170f6] font-medium' : 'text-gray-500'
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-1.5">
          {/* {icon} */}
          <LockedFeatureIcon />
        </div>
        <span className="text-xs mt-1.5 truncate">{label}</span>
        {showTooltip && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg">
            Premium Feature
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="bg-white fixed bottom-0 left-0 right-0 z-10 shadow-md">
      <div className="flex justify-between items-center border-t border-[#e4e7eb] max-w-md mx-auto px-2 sm:px-4">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation ${
            isActive('/') ? 'text-[#6170f6] font-medium' : 'text-gray-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
          <span className="text-xs mt-1.5 truncate">Dashboard</span>
        </Link>
        
        {isTenantOnFreePlan ? (
          <RestrictedTab 
            icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />}
            label="Attendance"
            isActiveTab={isActive('/attendance')}
          />
        ) : (
          <Link
            to="/attendance"
            className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation ${
              isActive('/attendance') ? 'text-[#6170f6] font-medium' : 'text-gray-500'
            }`}
          >
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
            <span className="text-xs mt-1.5 truncate">Attendance</span>
          </Link>
        )}
        
        {isTenantOnFreePlan ? (
          <RestrictedTab 
            icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />}
            label="TimeOff"
            isActiveTab={isActive('/timeoff')}
          />
        ) : (
          <Link
            to="/timeoff"
            className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation ${
              isActive('/timeoff') ? 'text-[#6170f6] font-medium' : 'text-gray-500'
            }`}
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
            <span className="text-xs mt-1.5 truncate">TimeOff</span>
          </Link>
        )}
        
        <Link
          to="/payslips"
          className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation ${
            isActive('/payslips') ? 'text-[#6170f6] font-medium' : 'text-gray-500'
          }`}
        >
          <FileText className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
          <span className="text-xs mt-1.5 truncate">Payslip</span>
        </Link>
        
        <Link
          to="/notifications"
          className={`flex flex-col items-center justify-center py-2.5 flex-1 min-w-0 touch-manipulation relative ${
            isActive('/notifications') ? 'text-[#6170f6] font-medium' : 'text-gray-500'
          }`}
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
        </Link>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-white"></div>
    </nav>
  );
};

export default TabNavigation;