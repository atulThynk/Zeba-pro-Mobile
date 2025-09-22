import React, { useState, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import { ChevronLeft, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { userService, Tenant } from '@/services/user-service';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  imageUrl?: string;
  currentTenantId?: number;
  role: string;
}

const TenantListPage: React.FC = () => {
  const { user } = useAuth();
  const router = useIonRouter();
  const { toast } = useToast();
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [tenantLoadingId, setTenantLoadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const tenants = await userService.getAllTenants();
        console.log('DEBUG: Fetched tenants for TenantListPage:', tenants);
        setAllTenants(tenants);
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load tenants data.',
        });
      }
    };

    fetchTenants();
  }, [toast]);

  const getTenantInitials = (tenantName: string) => {
    if (!tenantName) return '??';
    const cleanName = tenantName.replace(/\s+/g, '').replace(/[^a-zA-Z]/g, '');
    if (cleanName.length === 0) return '??';
    return cleanName.substring(0, 2).toUpperCase();
  };

  const handleTenantSwitch = async (tenantId: number, tenant: Tenant) => {
    if (!user || user.currentTenantId === tenantId || loading) {
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
      console.log('DEBUG: Tenant switch response:', response);
      if (response.success) {
        const updatedUserData = response.data;
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        localStorage.removeItem('tenantLogo');
        localStorage.removeItem('tenantName');
        window.location.reload();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to switch organization',
        });
      }
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
    }
  };

  const handleBack = () => {
    router.goBack();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center px-4 py-3 bg-white shadow">
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:bg-blue-50 rounded-full p-2"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="ml-2 text-base font-medium">Back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold">Select Organization</h1>
      </header>

      <div className="p-4">
        {allTenants.length === 0 ? (
          <div className="text-center text-gray-600 py-8">No organizations available.</div>
        ) : (
          <div className="space-y-4">
            {allTenants
              .sort((a, b) => Number(b.isActive) - Number(a.isActive))
              .map((tenant) => {
                const isCurrent = user?.currentTenantId === tenant.id;
                const isActive = tenant.isActive;
                const isLoading = tenantLoadingId === tenant.id && loading;

                return (
                  <motion.button
                    key={tenant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * allTenants.indexOf(tenant) }}
                    onClick={() => handleTenantSwitch(tenant.id, tenant)}
                    disabled={isLoading || isCurrent}
                    className={`flex items-center w-full p-4 bg-white rounded-lg shadow transition-colors ${
                      isCurrent ? 'border-l-4 border-blue-500' : 'hover:bg-gray-50'
                    } ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoading && (
                      <div className="mr-3">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                        isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {getTenantInitials(tenant.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-gray-900 truncate">{tenant.name}</div>
                      {!isActive && <div className="text-xs text-gray-400">Inactive</div>}
                      {isCurrent && !isLoading && <div className="text-xs text-blue-600">Current</div>}
                    </div>
                  </motion.button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantListPage;