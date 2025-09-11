import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { UserRound, LogOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { userService, UserProfile } from '@/services/user-service';

interface User {
  id: number;
  name: string;
  email: string;
  imageUrl?: string;
}

interface TenantData {
  logoUrl?: string;
  tenantName: string;
}

const HomeHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useHistory();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fetchedUser, setFetchedUser] = useState<UserProfile | null>(null);
  const [fetchedTenant, setFetchedTenant] = useState<TenantData | null>(null);
  const tenantLogo = localStorage.getItem('tenantLogo');
  const tenantName = localStorage.getItem('tenantName');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      if (!tenantLogo) {
        try {
          const tenantData = await userService.getTenantDetails();
          setFetchedTenant(tenantData);
          const logoUrl = tenantData.logoUrl || '';
          localStorage.setItem('tenantLogo', logoUrl);
          localStorage.setItem('tenantName', tenantData.tenantName || 'Unknown Tenant');
        } catch (error) {
          console.error('Failed to fetch tenant data:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load tenant profile data.",
          });
        }
      }
      try {
        const userData = await userService.getUserProfile(user.id.toString());
        setFetchedUser({
          ...userData,
          name: `${userData.firstName} ${userData.lastName || ''}`.trim(), // Compute name
        } as UserProfile & { name: string });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user profile data.",
        });
      }
    };

    fetchUserData();
  }, [user, toast]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleLogout = async () => {
    try {
      setIsModalOpen(false);
      await logout();
      navigate.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
      });
    }
  };

  const handleProfileClick = () => {
    setIsModalOpen(false);
    navigate.push('/profile');
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>

      <div
        id="main-content"
        className="transition-all duration-500 ease-out relative z-40 overflow-hidden"
        style={{
          filter: isModalOpen ? 'blur(2px)' : 'none',
          transform: isModalOpen ? 'scaleX(0.95) scaleY(0.65)' : 'scaleX(1) scaleY(1)',
          transformOrigin: 'center center',
          borderRadius: isModalOpen ? '20px' : '0px',
        }}
      >
        <header className="flex justify-between items-center px-4 py-3 bg-white">
          <div className="flex items-center">
            <Avatar
              className="h-10 w-10 mr-3 cursor-pointer transition-transform active:scale-95"
              onClick={() => setIsModalOpen(true)}
            >
              <AvatarImage src={fetchedUser?.imageUrl || user?.imageUrl} alt={user?.name} />
              <AvatarFallback>{user ? getInitials(user.name) : 'U'}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex items-center">
            {tenantLogo ? (
              <img
                src={tenantLogo}
                alt="Tenant Logo"
                className="h-10 w-auto mr-2"
              />
            ) : tenantName ? (
              <div className="h-10 w-10 flex items-center justify-center bg-gray-300 text-gray-700 rounded-full mr-2">
                {getInitials(tenantName)}
              </div>
            ) : null}
          </div>
        </header>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-lg"
            style={{ height: '92vh' }}
          >
            <div className="flex flex-col h-full">
              <div className="flex flex-col items-center">
                <div className="flex justify-end w-full px-4 pb-2">
                  <button
                    className="text-blue-600 font-medium text-base px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <div className="flex flex-col items-center px-4 py-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <Avatar className="h-20 w-20 mb-4 ring-4 ring-gray-100 shadow-sm">
                      <AvatarImage src={fetchedUser?.imageUrl || user?.imageUrl} alt={user?.name} />
                      <AvatarFallback className="text-2xl text-black">{user ? getInitials(user.name) : 'U'}</AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <motion.h3
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="text-black font-bold text-xl mb-1"
                  >
                    {user?.name || 'User'}
                  </motion.h3>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="text-gray-600 text-sm mb-6"
                  >
                    {user?.email || 'user@example.com'}
                  </motion.p>
                </div>

                <div className="px-6 py-2">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center justify-between w-full py-4 border-b border-gray-100 transition-all hover:bg-gray-50 rounded-lg px-3"
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2 rounded-full mr-4">
                          <UserRound className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-black text-base font-medium">My Profile</span>
                      </div>
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-between w-full py-4 border-b border-gray-100 transition-all hover:bg-red-50 rounded-lg px-3 mt-2"
                    >
                      <div className="flex items-center">
                        <div className="bg-red-50 p-2 rounded-full mr-4">
                          <LogOut className="h-5 w-5 text-red-500" />
                        </div>
                        <span className="text-red-500 text-base font-medium">Logout</span>
                      </div>
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeHeader;