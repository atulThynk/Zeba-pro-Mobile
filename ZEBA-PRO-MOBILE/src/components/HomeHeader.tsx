import React, { useState, useEffect, useRef } from 'react';
import { useIonRouter } from '@ionic/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { UserRound, LogOut, ChevronDown, Settings, Building2, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { userService, UserProfile, Tenant } from '@/services/user-service';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  imageUrl?: string;
  currentTenantId?: number;
  role: string;
}

interface HomeHeaderProps {
  onProfileClick?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ onProfileClick }) => {
  const { user, logout } = useAuth();
  const router = useIonRouter();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [fetchedUser, setFetchedUser] = useState<UserProfile | null>(null);
  const [fetchedTenant, setFetchedTenant] = useState<Tenant | null>(null);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [tenantLoadingId, setTenantLoadingId] = useState<number | null>(null);
  const [shouldShowOrganizations, setShouldShowOrganizations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  let tenantLogo = localStorage.getItem('tenantLogo');
  const tenantName = localStorage.getItem('tenantName');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userData =JSON.parse(localStorage.getItem('user') || '{}');
  useEffect(() => {
    const fetchUserData = async (retryCount = 0, maxRetries = 2) => {
      if (!user) {
        return;
      }

     

      try {
        if (allTenants.length === 0) {
          const tenants = await userService.getAllTenants();
          setAllTenants(tenants);
          const tenantCount = tenants.length;
          setShouldShowOrganizations(tenantCount > 1);
        }
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load tenants data.',
        });
      }

      if (!tenantLogo || !tenantName) {
        try {
          const tenantData = await userService.getTenantDetails();
          setFetchedTenant(tenantData);
          const logoUrl = tenantData.logoUrl || '';
          localStorage.setItem('tenantLogo', logoUrl);
          localStorage.setItem('tenantName', tenantData.name || 'Unknown Tenant');
        } catch (error) {
          console.error('Failed to fetch tenant data:', error);
          if (retryCount < maxRetries) {
            setTimeout(() => fetchUserData(retryCount + 1, maxRetries), 1000);
            return;
          }
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load tenant profile data after retries.',
          });
        }
      }

      if (!user.name && user.id) {
        try {
          const userData = await userService.getUserProfile(user.id.toString());
          localStorage.setItem('userData', JSON.stringify(userData));
          const fullName = `${userData.firstName} ${userData.lastName || ''}`.trim();
          setFetchedUser({
            ...userData,
            name: fullName || 'Unknown User',
          } as UserProfile & { name: string });
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          if (retryCount < maxRetries) {
            setTimeout(() => fetchUserData(retryCount + 1, maxRetries), 1000);
            return;
          }
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load user profile data after retries.',
          });
        }
      }
    };

    fetchUserData();
  }, [user, toast, allTenants.length, tenantLogo, tenantName]);

  useEffect(() => {
    if (isModalOpen || isTenantModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, isTenantModalOpen]);

  useEffect(() => {
    if (isTenantModalOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isTenantModalOpen]);

  const getTenantInitials = (tenantName: string) => {
    if (!tenantName) return '??';
    const cleanName = tenantName.replace(/\s+/g, '').replace(/[^a-zA-Z]/g, '');
    if (cleanName.length === 0) return '??';
    return cleanName.substring(0, 2).toUpperCase();
  };

  const getCurrentTenantName = () => {
    
    if (!user?.id || !allTenants.length) return 'No Organization Selected';
    const currentTenant = allTenants.find((tenant) => tenant.id === user.id);
    return currentTenant ? currentTenant.tenantName : 'Unknown Organization';
  };

  const handleTenantSwitch = async (tenantId: number, tenant: Tenant) => {
    if (!user || user.currentTenantId === tenantId || loading) {
      setIsTenantModalOpen(false);
      return;
    }

    if (!tenant.isActive) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot switch to inactive organization. Please activate it first.',
      });
      return;
    }

    setLoading(true);
    setTenantLoadingId(tenantId);

    try {
      const response = await userService.selectTenant(tenantId);
      
        const updatedUserData = response;
        // Fetch updated user profile
        
        // const userProfile = await userService.getUserProfile(updatedUserData.id.toString());
        // console.log('Fetched user profile after tenant switch:', userProfile);
        
        // const fullName = `${userProfile.firstName} ${userProfile.lastName || ''}`.trim();
        // const updatedUser = { ...userProfile, name: fullName || 'Unknown User' };
        localStorage.setItem('user', JSON.stringify(response));
        localStorage.removeItem('tenantLogo');
        localStorage.setItem('auth_token', response.token);
        // Update tenant name and logo
        const tenantData = await userService.getTenantDetails();
          setFetchedTenant(tenantData);
          tenantLogo = tenantData?.logoUrl || '';
          const logoUrl = tenantData.logoUrl || '';
          localStorage.setItem('tenantLogo', logoUrl);
          localStorage.setItem('tenantName', tenantData.name || 'Unknown Tenant');
        // Hard reload the app
        window.location.href = '/';
    
    } catch (error) {
      console.error('Error switching tenant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while switching organization',
      });
    } finally {
      setLoading(false);
      setTenantLoadingId(null);
      setIsTenantModalOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      setIsModalOpen(false);
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'Failed to logout. Please try again.',
      });
    }
  };

  const handleProfileClick = () => {
    setIsModalOpen(false);
    if (onProfileClick) {
      onProfileClick();
    }
    router.push('/profile');
  };

  const handleSwitchOrganizationClick = () => {
    setIsTenantModalOpen(false);
    setSearchQuery('');
    try {
      router.push('/tenants');
    } catch (error) {
      console.error('DEBUG: Navigation to /tenants failed:', error);
      toast({
        variant: 'destructive',
        title: 'Navigation Error',
        description: 'Failed to navigate to tenant selection page. Please try again or check route configuration.',
      });
    }
  };

  const openTenantModal = () => {
    setSearchQuery('');
    setIsTenantModalOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredTenants = allTenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedTenants = [...filteredTenants].sort((a, b) => Number(b.isActive) - Number(a.isActive));

  return (
    <div className="relative">
      <AnimatePresence>
        {(isModalOpen || isTenantModalOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999]"
          />
        )}
      </AnimatePresence>

      <div
        id="main-content"
        className="transition-all duration-500 ease-out relative z-40 overflow-hidden"
        style={{
          filter: (isModalOpen || isTenantModalOpen) ? 'blur(2px)' : 'none',
          transform: (isModalOpen || isTenantModalOpen) ? 'scaleX(1) scaleY(1)' : 'scaleX(1) scaleY(1)',
          transformOrigin: 'center center',
          borderRadius: (isModalOpen || isTenantModalOpen) ? '20px' : '0px',
        }}
      >
        <header className="flex justify-between items-center px-4 py-3 bg-white">
          <div className="flex items-center">
<Avatar
  className="h-10 w-10 mr-3 cursor-pointer transition-transform active:scale-95"
  onClick={() => setIsModalOpen(true)}
>
  {((fetchedUser?.imageUrl && fetchedUser.imageUrl.trim() !== '') || 
    (user?.imageUrl && user.imageUrl.trim() !== '')) && (
    <AvatarImage 
      src={fetchedUser?.imageUrl || user?.imageUrl} 
      alt={user?.name}
    />
  )}
  <AvatarFallback className="bg-blue-500 text-white font-semibold">
    {user?.name ? getInitials(user.name) : userData?.firstName ? getInitials(`${userData.firstName} ${userData.lastName || ''}`) : 'U'}
  </AvatarFallback>
</Avatar>
          </div>

          <div className="flex items-center relative">
            {shouldShowOrganizations && (
              <div
                className="flex items-center cursor-pointer relative group"
                onClick={openTenantModal}
              >
                {tenantLogo ? (
                  <img src={tenantLogo} alt="Tenant Logo" className="h-10 w-auto mr-2 rounded" />
                ) : tenantName ? (
                  <div className="h-10 w-10 flex items-center justify-center bg-gray-300 text-gray-700 rounded mr-2 font-medium">
                    {getTenantInitials(tenantName)}
                  </div>
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center bg-gray-300 text-gray-700 rounded mr-2 font-medium">
                    ??
                  </div>
                )}
                <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-hover:rotate-180" />
              </div>
            )}
            {!shouldShowOrganizations && (
              <>
                {tenantLogo ? (
                  <img src={tenantLogo} alt="Tenant Logo" className="h-10 w-auto mr-2" />
                ) : tenantName ? (
                  <div className="h-10 w-10 flex items-center justify-center bg-gray-300 text-gray-700 rounded-full mr-2">
                    {getTenantInitials(tenantName)}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </header>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-lg"
            style={{ height: '92vh' }}
          >
            <div className="flex flex-col h-full">
              <div className="flex flex-col items-center">
                <div className="flex justify-end w-full px-4 pb-2">
                  <button
                    className="text-gray-800 font-medium text-base mt-6 px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <X className="h-6 w-6" />
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
                      <AvatarFallback className="text-2xl text-black">
                        {user ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <motion.h3
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="text-black font-bold text-xl mb-1"
                  >
                    {userData?.firstName + " "  + userData?.lastName|| 'User'}
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
                  {/* {shouldShowOrganizations && (
                    <>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="mb-4"
                      >
                        <div className="flex items-center justify-between w-full py-4 border-b border-gray-100">
                          <div className="flex items-center">
                            <div className="bg-blue-50 p-2 rounded-full mr-4">
                              <Settings className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="text-black text-base font-medium">Current Organization</span>
                          </div>
                          <span className="text-sm text-gray-600">{getCurrentTenantName()}</span>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                      >
                        <button
                          onClick={() => {
                            setIsModalOpen(false);
                            openTenantModal();
                          }}
                          className="flex items-center justify-between w-full py-4 border-b border-gray-100 transition-all hover:bg-gray-50 rounded-lg px-3"
                        >
                          <div className="flex items-center">
                            <div className="bg-blue-50 p-2 rounded-full mr-4">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="text-black text-base font-medium">Switch Organization</span>
                          </div>
                        </button>
                      </motion.div>
                    </>
                  )} */}

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
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
                    transition={{ delay: 0.7, duration: 0.3 }}
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

      {/* Tenant Selection Modal */}
      <AnimatePresence>
        {isTenantModalOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-lg"
            style={{ height: '92vh' }}
          >
            <div className="flex flex-col h-full">
              {/* Header with close button */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Switch Organization</h3>
                <button
                  onClick={() => setIsTenantModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Close tenant selection"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto px-4">
                {/* Search Input */}
                <div className="relative mb-4 mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search organizations..."
                    className="w-full pl-10 pr-4 py-3 text-sm border !text-black border-gray-200 rounded-lg focus:outline-none focus:ring-2 bg-white focus:ring-gray-300 focus:border-transparent"
                    aria-label="Search organizations"
                  />
                </div>

                {/* Current Organization Display */}
                {/* <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Current Organization</span>
                    <span className="text-sm text-blue-700">{getCurrentTenantName()}</span>
                  </div>
                </div> */}

                {/* Tenant List */}
                <div className="space-y-2">
                  {sortedTenants.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">No organizations found</p>
                    </div>
                  )}
                  {sortedTenants.map((tenant) => {
                    const isCurrent = user?.currentTenantId === tenant.id;
                    const isActive = tenant.isActive;
                    const isLoading = tenantLoadingId === tenant.id && loading;

                    return (
                      <motion.button
                        key={tenant.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * sortedTenants.indexOf(tenant) }}
                        onClick={() => handleTenantSwitch(tenant.id, tenant)}
                        disabled={isLoading || !isActive}
                        className={`flex items-center w-full p-4 text-left transition-all rounded-lg ${
                          isCurrent 
                            ? 'bg-gray-100 border border-gray-500' 
                            : 'hover:bg-gray-50 border border-gray-200'
                        } ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label={`Switch to ${tenant.name}`}
                      >
                        
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                            isCurrent ? 'bg-blue-200 text-black' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {getTenantInitials(tenant.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{tenant.name}</div>
                          <div className="flex items-center mt-1">
                            {/* {isCurrent && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                Current
                              </span>
                            )} */}
                            {!isActive && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                        {isLoading && (
                          <div className="mr-3">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* View All Button */}
                {allTenants.length > 5 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSwitchOrganizationClick}
                      className="w-full flex items-center justify-center py-3 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                      aria-label={`View all ${allTenants.length} organizations`}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      View all {allTenants.length} organizations
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeHeader;