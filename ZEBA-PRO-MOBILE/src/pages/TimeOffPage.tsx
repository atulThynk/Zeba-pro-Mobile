import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Clock, Check, X, CalendarPlus } from 'lucide-react';
import HomeHeader from '../components/HomeHeader';
import { useAuth } from '../contexts/AuthContext';
import { timeOffService } from '../services/timeoff-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import ApplyLeaveModal from '../components/modal/ApplyLeaveModal';
import DotAnimation from '@/components/DotAnimation';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
const TimeOffPage: React.FC<{ onModalStateChange?: (isOpen: boolean) => void }> = ({ onModalStateChange }) => {

  const { user } = useAuth();
  const [currentPage] = useState(1);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const userId = user?.id;
  const queryClient = useQueryClient();
useEffect(() => {
  let backHandler: Awaited<ReturnType<typeof CapacitorApp.addListener>> | null = null;

  const setupBackHandler = async () => {
    if (!Capacitor.isNativePlatform()) return;

    backHandler = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (isApplyLeaveOpen) {
        setIsApplyLeaveOpen(false);
        onModalStateChange?.(false); 
      } else if (!canGoBack) {
        CapacitorApp.exitApp(); 
      } else {
        window.history.back();
      }
    });
  };

  setupBackHandler();

  return () => {
    // safely remove the listener if available
    if (backHandler && typeof backHandler.remove === 'function') {
      backHandler.remove();
    }
  };
}, [isApplyLeaveOpen]);


  // Fetch leave balances
  const { data: leaveBalances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ['leaveBalances', userId],
    queryFn: () => userId ? timeOffService.getLeaveBalances(userId) : Promise.reject('No user ID'),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch leave types
  const { data: leaveTypes, isLoading: isLoadingLeaveTypes } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => timeOffService.getLeaveTypes(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch upcoming leaves
  const { data: upcomingLeaves, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['upcomingLeaves', userId],
    queryFn: () => userId ? timeOffService.getUpcomingLeaves(userId) : Promise.reject('No user ID'),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch past leaves
  const { data: pastLeaves, isLoading: isLoadingPast } = useQuery({
    queryKey: ['pastLeaves', userId],
    queryFn: () => userId ? timeOffService.getPastLeaves(userId) : Promise.reject('No user ID'),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Log when APIs are being called (for debugging)
  useEffect(() => {
    if (userId) {
      console.log('User ID available, all APIs will be triggered:', userId);
    }
  }, [userId]);

  const getLeaveBalanceData = () => {
    if (!leaveBalances || leaveBalances.data.length === 0) {
      return [];
    }
    return leaveBalances.data[0].leaveBuckets || [];
  };

  const renderApprovalStatus = (status: number) => {
    if (status === 1) {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" />
          Approved
        </div>
      );
    } else if (status === 2) {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="w-3 h-3 mr-1" />
          Rejected
        </div>
      );
    }
  };

  const renderTimeElapsed = (date: string) => {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diffInDays === 0) return 'Today';
      else if (diffInDays === 1) return 'Yesterday';
      else if (diffInDays < 7) return `${diffInDays} days ago`;
      else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      } else {
        const months = Math.floor(diffInDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      }
    } catch (error) {
      return '';
    }
  };

  const handleApplyLeave = () => {
    setIsApplyLeaveOpen(true);
    onModalStateChange?.(true); 
  };

  const handleCloseApplyLeave = () => {
    setIsApplyLeaveOpen(false);
    // Invalidate queries to trigger refetch of all APIs
    queryClient.invalidateQueries({ queryKey: ['leaveBalances', userId] });
    queryClient.invalidateQueries({ queryKey: ['upcomingLeaves', userId] });
    queryClient.invalidateQueries({ queryKey: ['pastLeaves', userId] });
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding-bottom">
        <div className="flex-1 bg-white text-gray-800">
     
          <main className="p-4 max-w-4xl mx-auto pb-20">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-medium text-black">Time Off</h1>
              <Button
                onClick={handleApplyLeave}
                className="bg-gray-800 rounded-xl hover:bg-[#0E4880]/90 text-white"
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Apply Leave
              </Button>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Leave Balance</h2>
              <div className="w-full overflow-x-auto overflow-y-hidden">
                <div className="flex space-x-4 pb-4 flex-nowrap min-w-min">
                  {isLoadingBalances ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="animate-pulse bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center h-32 w-32 flex-shrink-0"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))
                  ) : (
                    getLeaveBalanceData().map((balance) => (
                      <div
                        key={balance.leaveTypeId}
                        className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center shadow-sm w-32 flex-shrink-0"
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mb-2">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-gray-800 text-center">{balance.leaveType.name}</p>
                        <div className="flex flex-col items-center mt-2">
                          <p className="text-xs text-gray-500">
                            Available: <span className="font-semibold text-gray-700">{balance.availableLeaves.toFixed(2)}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Booked: <span className="font-semibold text-gray-700">{balance.usedLeaves}</span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Upcoming Leaves</h2>
                {isLoadingUpcoming ? (
                  <div className="animate-pulse space-y-3">
                    {Array.from({ length: 1 }).map((_, index) => (
                    <DotAnimation/>
                    ))}
                  </div>
                ) : upcomingLeaves && upcomingLeaves.data && upcomingLeaves.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">DATE</TableHead>
                        <TableHead>TYPE</TableHead>
                        <TableHead className="hidden sm:table-cell">APPLIED ON</TableHead>
                        <TableHead className="text-right">APPROVAL STATUS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingLeaves.data.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">
                            {leave.leaveDate ? format(new Date(leave.leaveDate), 'MMM dd, yyyy') : ''}
                          </TableCell>
                          <TableCell>{leave.leaveTypeName}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {leave.dateCreated ? renderTimeElapsed(leave.dateCreated) : ''}
                          </TableCell>
                          <TableCell className="text-right">
                            {renderApprovalStatus(leave.status || 2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No upcoming leaves</p>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Past Leaves</h2>
                {isLoadingPast ? (
                  <DotAnimation/>
                ) : pastLeaves && pastLeaves.data && pastLeaves.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">DATE</TableHead>
                        <TableHead>TYPE</TableHead>
                        <TableHead className="hidden sm:table-cell">APPLIED ON</TableHead>
                        <TableHead className="text-right">APPROVAL STATUS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastLeaves.data.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">
                            {leave.leaveDate ? format(new Date(leave.leaveDate), 'MMM dd, yyyy') : ''}
                          </TableCell>
                          <TableCell>{leave.leaveTypeName}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {leave.dateCreated ? renderTimeElapsed(leave.dateCreated) : ''}
                          </TableCell>
                          <TableCell className="text-right">
                            {renderApprovalStatus(leave.status || 2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No past leaves</p>
                  </div>
                )}
              </div>
            </div>
          </main>

          <Dialog
  open={isApplyLeaveOpen}
  onOpenChange={(open) => {
    setIsApplyLeaveOpen(open);
    onModalStateChange?.(open); 
    if (!open) handleCloseApplyLeave(); 
  }}
>
            <ApplyLeaveModal
              isOpen={isApplyLeaveOpen}
              onClose={() => {
      setIsApplyLeaveOpen(false);
      onModalStateChange?.(false); 
      handleCloseApplyLeave();
    }}
              leaveTypes={leaveTypes}              
              isLoadingLeaveTypes={isLoadingLeaveTypes}
            />
          </Dialog>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TimeOffPage;