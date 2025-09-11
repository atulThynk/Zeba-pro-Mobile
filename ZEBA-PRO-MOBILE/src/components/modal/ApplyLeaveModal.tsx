import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { timeOffService, LeaveTypeResponse, TimeOffRequest, BasicUser } from '@/services/timeoff-service';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

  const form = useForm<LeaveFormData>({
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

  // Enhanced keyboard detection and viewport handling
  useEffect(() => {
    const handleViewportChange = () => {
      if (typeof window === 'undefined') return;

      const visualViewport = window.visualViewport;
      const windowHeight = window.innerHeight;
      const viewportHeight = visualViewport?.height || windowHeight;

      // More reliable keyboard detection
      const keyboardOpen = viewportHeight < windowHeight * 0.8;
      const wasKeyboardOpen = isKeyboardOpen;

      setIsKeyboardOpen(keyboardOpen);

      if (keyboardOpen && !wasKeyboardOpen) {
        // Keyboard just opened
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100vh';
        document.body.style.overflow = 'hidden';

        // Set CSS custom property for viewport height
        document.documentElement.style.setProperty('--vh', `${viewportHeight * 0.01}px`);

        // Scroll active input into view after keyboard animation
        if (activeInput) {
          setTimeout(() => {
            activeInput.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest',
            });
          }, 300);
        }
      } else if (!keyboardOpen && wasKeyboardOpen) {
        // Keyboard just closed
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        document.documentElement.style.removeProperty('--vh');
      }
    };

    // Listen to multiple events for better keyboard detection
    const handleResize = () => handleViewportChange();
    const handleVisualViewportResize = () => handleViewportChange();

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }

    // Initial check
    handleViewportChange();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
      // Cleanup styles
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
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
    const startDate = form.watch('startDate');
    if (startDate && !form.watch('endDate')) {
      form.setValue('endDate', startDate);
    }
  }, [form.watch('startDate'), form]);

  // Enhanced input focus handling
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    setActiveInput(target);

    // For immediate scroll on focus (before keyboard opens)
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
      form.reset();
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

  const handleSubmitLeave = form.handleSubmit((data) => {
    applyLeaveMutation.mutate(data);
  });

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
    form.reset();
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
    <DialogContent
      ref={modalRef}
      className={`w-full max-w-md mx-auto p-0 gap-0 rounded-t-3xl md:rounded-2xl ${
        isKeyboardOpen ? 'fixed inset-0 h-screen overflow-y-auto' : 'max-h-[95vh] overflow-y-auto'
      }`}
      style={{
        height: isKeyboardOpen ? 'calc(var(--vh, 1vh) * 100)' : undefined,
        top: isKeyboardOpen ? 0 : undefined,
        transform: isKeyboardOpen ? 'none' : undefined,
      }}
    >
      <DialogHeader className="px-6 pt-12 pb-4 border-gray-100 sticky top-0 bg-white z-10">
        <DialogTitle className="text-xl font-semibold text-gray-900">Apply for Leave</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmitLeave} className="px-6 py-4 space-y-6 flex-1 pb-32">
        {/* Start Date */}
        <div className="space-y-3">
          <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            id="startDate"
            {...form.register('startDate')}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="h-12 border-gray-200 !bg-white rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-100 text-gray-900"
            required
          />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="flex items-center space-x-2 rounded-xl">
              <Checkbox
                id="startFirstHalf"
                checked={form.watch('startFirstHalf')}
                onCheckedChange={(checked) => form.setValue('startFirstHalf', !!checked)}
                className="h-4 w-4 min-h-[16px] min-w-[16px] border-gray-300 rounded data-[state=checked]:bg-gray-100 data-[state=checked]:border-gray-800"
              />
              <label htmlFor="startFirstHalf" className="text-xs font-medium text-gray-700">First Half</label>
            </div>
            <div className="flex items-center space-x-2 rounded-xl">
              <Checkbox
                id="startSecondHalf"
                checked={form.watch('startSecondHalf')}
                onCheckedChange={(checked) => form.setValue('startSecondHalf', !!checked)}
                className="h-4 w-4 min-h-[16px] min-w-[16px] border-gray-300 rounded data-[state=checked]:bg-gray-100 data-[state=checked]:border-gray-800"
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
              <PopoverContent sideOffset={8} className="w-64 p-3">
                <p className="text-xs text-gray-600">Select end date if applying for multiple days</p>
              </PopoverContent>
            </Popover>
          </Label>
          <Input
            type="date"
            id="endDate"
            {...form.register('endDate')}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="h-12 !bg-white !border-gray-200 rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-100 text-gray-900"
          />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="flex items-center space-x-2 rounded-xl">
              <Checkbox
                id="endFirstHalf"
                checked={form.watch('endFirstHalf')}
                onCheckedChange={(checked) => form.setValue('endFirstHalf', !!checked)}
                className="h-4 w-4 min-h-[16px] min-w-[16px] border-gray-300 rounded data-[state=checked]:bg-gray-100 data-[state=checked]:border-gray-800"
              />
              <label htmlFor="endFirstHalf" className="text-xs font-medium text-gray-700">First Half</label>
            </div>
            <div className="flex items-center space-x-2 rounded-xl">
              <Checkbox
                id="endSecondHalf"
                checked={form.watch('endSecondHalf')}
                onCheckedChange={(checked) => form.setValue('endSecondHalf', !!checked)}
                className="h-4 w-4 min-h-[16px] min-w-[16px] border-gray-300 rounded data-[state=checked]:bg-gray-100 data-[state=checked]:border-gray-800"
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
            onValueChange={(value) => form.setValue('leaveTypeId', value)}
            value={form.watch('leaveTypeId')}
          >
            <SelectTrigger className="h-12 border-gray-200 rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-100">
              <SelectValue placeholder="Select Leave Type" />
            </SelectTrigger>
            <SelectContent>
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
            className="h-12 border-gray-200 rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-100 text-gray-900"
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
                      className="ml-1 text-gray-800 hover:text-gray-800"
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
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-xl bg-white">
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
                        className="h-4 w-4 border-gray-300 rounded data-[state=checked]:bg-gray-100 data-[state=checked]:border-gray-800"
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
            {...form.register('reason')}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Add any additional notes"
            className="min-h-[80px] border-gray-200 rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-100 text-gray-900 resize-none"
          />
        </div>

        {/* Info Note */}
        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
          <Info className="h-4 w-4 text-gray-800 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-700 leading-relaxed">
            To apply for a full day leave, don't select any checkboxes. For half-day leave, select the appropriate half.
          </p>
        </div>
      </form>

      <DialogFooter className={`px-6 py-4 border-t border-gray-100 bg-gray-50 ${
        isKeyboardOpen ? 'fixed bottom-0 left-0 right-0 z-20' : ''
      }`}>
        <div className="flex sm:flex-row gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1 h-12 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={applyLeaveMutation.isPending}
            onClick={handleSubmitLeave}
            className="flex-1 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium shadow-gray-800/25"
          >
            {applyLeaveMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

export default ApplyLeaveModal;