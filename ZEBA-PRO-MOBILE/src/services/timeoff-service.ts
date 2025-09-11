import { get, post, put, del } from './api-client';

export type TimeOffStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type TimeOffType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'other';

export interface TimeOffRequest {
  id?: string | number;
  userId?: string | number;
  leaveTypeId?: number;
  leaveTypeName?: string;
  startDate?: string;
  endDate?: string;
  leaveDate?: string;
  dateCreated?: string;
  reason?: string;
  status?: number; // 1 = approved, 2 = pending, 3 = rejected
  isAutoApproved?: boolean;
  isLeaveFirstHalf?: boolean;
  isLeaveSecondHalf?: boolean;
  startFirstHalf?: boolean;
  startSecondHalf?: boolean;
  endFirstHalf?: boolean;
  endSecondHalf?: boolean;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    employeeNumber: string;
    imageUrl: string | null;
  };
  reviewerId?: number;
  reviewerName?: string | null;
  reviewerEmployeeNumber?: string | null;
  usersToNotifyOnApproval?: string | null;
}

export interface LeaveType {
  id: number;
  name: string;
  description: string;
  validityStart: string;
  validityEnd: string | null;
  shortCode: string;
  colorCode: string | null;
  icon: string;
  status: boolean;
  reduceLeaveOnAbsent: boolean;
  allowNegativeLeaves: boolean;
  isEligibleOnFlexiHoliday: boolean;
  type: number | null;
  isPaid: boolean;
}

export interface LeaveBalance {
  employeeId: number;
  leaveTypeId: number;
  leaveType: LeaveType;
  tillDate: string;
  availableLeaves: number;
  plannedLeaves: number;
  usedLeaves: number;
  leavePolicyDescription: string;
}

export interface LeaveBalanceResponse {
  records: number;
  totalRecords: number;
  data: Array<{
    employeeId: number;
    firstName: string;
    lastName: string;
    leaveBuckets: LeaveBalance[];
    upcomingLeaves: TimeOffRequest[];
    pastLeaves: TimeOffRequest[];
  }>;
  message: string;
  statusCode: number;
}

export interface LeaveRequestResponse {
  records: number;
  totalRecords: number;
  data: TimeOffRequest[];
  message: string;
  statusCode: number;
}

export interface LeaveTypeResponse {
  records: number;
  totalRecords: number;
  data: LeaveType[];
  message: string;
  statusCode: number;
}

export interface BasicUser {
  id: any;
  firstName: string;
  lastName: string;
  name?: string;
}

export const timeOffService = {
  getLeaveBalances: (employeeId: string | number): Promise<LeaveBalanceResponse> => {
    return get<LeaveBalanceResponse>(`/Leaves/types/employeeAssociations/balanceReports?employeeId=${employeeId}&pageNumber=1&pageSize=10`);
  },

  getLeaveTypes: (): Promise<LeaveTypeResponse> => {
    return get<LeaveTypeResponse>('/Leaves/types?pageNumber=1&pageSize=100');
  },

  getUpcomingLeaves: (userId: string | number): Promise<LeaveRequestResponse> => {
    const today = new Date().toISOString();
    return get<LeaveRequestResponse>(`/Leaves?pageNumber=1&pageSize=6&fromDate=${today}&userId=${userId}`);
  },

  getPastLeaves: (userId: string | number): Promise<LeaveRequestResponse> => {
    const today = new Date().toISOString();
    return get<LeaveRequestResponse>(`/Leaves?pageNumber=1&pageSize=6&endDate=${today}&userId=${userId}`);
  },

  createLeaveRequest: (request: TimeOffRequest): Promise<TimeOffRequest> => {
    return post<TimeOffRequest>('/Leaves', request);
  },

  updateLeaveRequest: (id: any | number, request: TimeOffRequest): Promise<TimeOffRequest> => {
    return put<TimeOffRequest>(`/Leaves/${id}`, request);
  },

  cancelLeaveRequest: (id: any | number): Promise<void> => {
    return del<void>(`/Leaves/${id}`);
  },

  searchUsers: (searchParam: string): Promise<{ data: BasicUser[] }> => {
    return get<{ data: BasicUser[] }>(`/Users/basic?searchParam=${encodeURIComponent(searchParam)}&pageNumber=1&pageSize=10`);
  },
};