import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { timeOffService, LeaveTypeResponse, TimeOffRequest, BasicUser } from '@/services/timeoff-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Info, X, User } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { toast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaveFormData {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  startFirstHalf: boolean;
  startSecondHalf: boolean;
  endFirstHalf: boolean;
  endSecondHalf: boolean;
}

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypes: LeaveTypeResponse | undefined;
  isLoadingLeaveTypes: boolean;
}

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose, leaveTypes, isLoadingLeaveTypes }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<LeaveFormData>({
    defaultValues: {
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      reason: '',
      startFirstHalf: false,
      startSecondHalf: false,
      endFirstHalf: false,
      endSecondHalf: false,
    },
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<{ data: BasicUser[] }>({
    queryKey: ['users', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery) return { data: [] };
      return await timeOffService.searchUsers(debouncedSearchQuery);
    },
    enabled: !!debouncedSearchQuery,
  });

  // Keyboard detection and viewport handling
  useEffect(() => {
    const handleViewportChange = () => {
      if (typeof window === 'undefined') return;

      const visualViewport = window.visualViewport;
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport?.height || windowHeight;

      const keyboardOpen = viewportHeight < windowHeight * 0.8;
      setIsKeyboardOpen(keyboardOpen);

      if (keyboardOpen) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
        if (activeInput) {
          setTimeout(() => {
            activeInput.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest',
            });
          }, 300);
        }
      } else {
        document.body.style.overflow = '';
        document.documentElement.style.removeProperty('--vh');
      }
    };

    window.addEventListener('resize', handleViewportChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    handleViewportChange();

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      document.body.style.overflow = '';
      document.documentElement.style.removeProperty('--vh');
    };
  }, [isKeyboardOpen, activeInput]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show dropdown when search query exists
  useEffect(() => {
    setShowUserDropdown(!!debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // Auto-populate end date when start date changes
  useEffect(() => {
    const startDate = watch('startDate');
    if (startDate && !watch('endDate')) {
      setValue('endDate', startDate);
    }
  }, [watch('startDate'), setValue]);

  // Enhanced input focus handling
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    setActiveInput(target);
    setTimeout(() => {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 100);
  };

  const handleInputBlur = () => {
    setActiveInput(null);
  };

  // Mutation for applying leave
  const applyLeaveMutation = useMutation({
    mutationFn: async (data: LeaveFormData) => {
      const payload: TimeOffRequest = {
        leaveTypeId: parseInt(data.leaveTypeId),
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        startFirstHalf: data.startFirstHalf,
        startSecondHalf: data.startSecondHalf,
        endFirstHalf: data.endFirstHalf,
        endSecondHalf: data.endSecondHalf,
        leaveTypeName: leaveTypes?.data.find(type => type.id.toString() === data.leaveTypeId)?.name || '',
        usersToNotifyOnApproval: selectedUsers.length > 0 ? selectedUsers.join(', ') : null,
      };
      return timeOffService.createLeaveRequest(payload);
    },
    onSuccess: () => {
      toast({
        description: 'Leave application submitted successfully',
        variant: 'default',
        duration: 3000,
      });
      onClose();
      reset();
      setSelectedUsers([]);
      setSearchQuery('');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof AxiosError && error.response?.data?.message
        ? error.response.data.message
        : 'Failed to submit leave application';
      toast({
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  const onSubmit = (data: LeaveFormData) => {
    applyLeaveMutation.mutate(data);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  const handleClose = () => {
    onClose();
    reset();
    setSelectedUsers([]);
    setSearchQuery('');
    setShowUserDropdown(false);
    setActiveInput(null);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowUserDropdown(true);
  };

  const getSelectedUserNames = () => {
    if (!users?.data || selectedUsers.length === 0) return [];
    return users.data
      .filter((user: BasicUser) => selectedUsers.includes(user.id))
      .map((user: BasicUser) => ({ id: user.id, name: `${user.firstName} ${user.lastName}` }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999]"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-lg"
            style={{ height: '92vh' }}
            ref={modalRef}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Apply for Leave</h3>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Close leave application"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-auto px-4 py-4 space-y-6">
                {/* Start Date */}
                <div className="space-y-3">
                  <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    id="startDate"
                    {...register('startDate', { required: 'Start date is required' })}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="h-12 border-2 border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  {errors.startDate && (
                    <p className="text-xs text-red-500">{errors.startDate.message}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="startFirstHalf"
                        checked={watch('startFirstHalf')}
                        onCheckedChange={(checked) => setValue('startFirstHalf', !!checked)}
                        className="h-4 w-4 border-2 !bg-gray-300   rounded data-[state=checked]:bg-blue-200 data-[state=checked]:border-blue-500"
                      />
                      <label htmlFor="startFirstHalf" className="text-xs font-medium text-gray-700">First Half</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="startSecondHalf"
                        checked={watch('startSecondHalf')}
                        onCheckedChange={(checked) => setValue('startSecondHalf', !!checked)}
                        className="h-4 w-4 border-2 !bg-gray-300   rounded data-[state=checked]:bg-blue-200 data-[state=checked]:border-blue-500"
                      />
                      <label htmlFor="startSecondHalf" className="text-xs font-medium text-gray-700">Second Half</label>
                    </div>
                  </div>
                </div>

                {/* End Date */}
                <div className="space-y-3">
                  <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 flex items-center">
                    End Date
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-1">
                          <Info className="h-3 w-3 text-gray-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        sideOffset={8}
                        className="w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-sm z-[1001]"
                      >
                        <p className="text-xs text-gray-600">Select end date if applying for multiple days</p>
                      </PopoverContent>
                    </Popover>
                  </Label>
                  <Input
                    type="date"
                    id="endDate"
                    {...register('endDate')}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="h-12 border-2 border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="endFirstHalf"
                        checked={watch('endFirstHalf')}
                        onCheckedChange={(checked) => setValue('endFirstHalf', !!checked)}
                        className="h-4 w-4 border-2 !bg-gray-300   rounded data-[state=checked]:bg-blue-200 data-[state=checked]:border-blue-500"
                      />
                      <label htmlFor="endFirstHalf" className="text-xs font-medium text-gray-700">First Half</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="endSecondHalf"
                        checked={watch('endSecondHalf')}
                        onCheckedChange={(checked) => setValue('endSecondHalf', !!checked)}
                        className="h-4 w-4 border-2 !bg-gray-300   rounded data-[state=checked]:bg-blue-200 data-[state=checked]:border-blue-500"
                      />
                      <label htmlFor="endSecondHalf" className="text-xs font-medium text-gray-700">Second Half</label>
                    </div>
                  </div>
                </div>

                {/* Leave Type */}
                <div className="space-y-3">
                  <Label htmlFor="leaveType" className="text-sm font-medium text-gray-700">
                    Leave Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('leaveTypeId', value, { shouldValidate: true })}
                    value={watch('leaveTypeId')}
                  >
                    <SelectTrigger className="h-12 border-2 bg-gray-100  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <SelectValue placeholder="Select Leave Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-lg">
                      {isLoadingLeaveTypes ? (
                        <SelectItem value="loading">Loading...</SelectItem>
                      ) : (
                        leaveTypes?.data?.map(type => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.leaveTypeId && (
                    <p className="text-xs text-red-500">{errors.leaveTypeId.message}</p>
                  )}
                </div>

                {/* Notify Team Members */}
                <div className="space-y-3" ref={dropdownRef}>
                  <Label htmlFor="notifyTeam" className="text-sm font-medium text-gray-700">
                    Notify Team Members
                  </Label>
                  <Input
                    type="text"
                    id="notifyTeam"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Search Users"
                    className="h-12 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />

                  {/* Selected Users */}
                  {selectedUsers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Selected Users:</p>
                      <div className="flex flex-wrap gap-2">
                        {getSelectedUserNames().map((user) => (
                          <div key={user.id} className="flex items-center gap-1 bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-xs">
                            <User className="h-3 w-3" />
                            <span className="font-medium text-gray-900">{user.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(user.id)}
                              className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {showUserDropdown && debouncedSearchQuery && (
                    <div className="max-h-32 overflow-y-auto border-2 border-gray-200 rounded-lg bg-white">
                      {isLoadingUsers ? (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500">Loading users...</p>
                        </div>
                      ) : users?.data && users.data.length > 0 ? (
                        <div className="p-2">
                          {users.data.map((user: BasicUser) => (
                            <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={() => handleUserSelect(user.id)}
                                className="h-4 w-4 border-2 border-gray-300 bg-white rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                              <label htmlFor={`user-${user.id}`} className="text-sm font-medium text-gray-900 flex-1 cursor-pointer">
                                {user.firstName} {user.lastName}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500">No users found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    {...register('reason')}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Add any additional notes"
                    className="min-h-[80px] border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
                  />
                </div>

                {/* Info Note */}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    To apply for a full day leave, don't select any checkboxes. For half-day leave, select the appropriate half.
                  </p>
                </div>
              </form>

              {/* Footer */}
              <div className="px-4 py-4 mb-16 border-t border-gray-100 bg-white">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 h-12 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={applyLeaveMutation.isPending}
                    onClick={handleSubmit(onSubmit)}
                    className="flex-1 h-12 bg-[#424955] hover:bg-gray-900 text-white rounded-lg font-medium"
                  >
                    {applyLeaveMutation.isPending ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ApplyLeaveModal;