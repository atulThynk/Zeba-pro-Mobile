
import { get, post } from './api-client';

export interface TimeLog {
  id?: number;
  attendanceId?: number;
  startTime: string;
  endTime: string | null;
  hours?: string;
}

export interface AttendanceRecord {
  id?: number;
  employeeId?: number;
  date: string;
  totalHours?: string;
  attendanceStatusId?: number;
  attendanceStatus?: string;
  timeLogs: TimeLog[];
}

export interface CheckInRequest {
  latitude?: number;
  longitude?: number;
  deviceId?: string;
}

export interface CheckOutRequest {
  latitude?: number;
  longitude?: number;
  deviceId?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export const attendanceService = {
  // Get attendance details for today
  getTodayAttendance: async (): Promise<AttendanceRecord> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employeeId = user?.id;

      if (!employeeId) throw new Error('Employee ID not found');

      const response = await get<ApiResponse<AttendanceRecord[]>>(
        `/Attendances?startDate=${today}&endDate=${today}&employeeId=${employeeId}`
      );

      return response.data[0] || {
        date: today,
        timeLogs: []
      };
    } catch (error) {
      console.error("Failed to fetch today’s attendance:", error);
      return {
        date: new Date().toISOString().split('T')[0],
        timeLogs: []
      };
    }
  },
  
  // Check in
  checkIn: (request: CheckInRequest): Promise<ApiResponse<AttendanceRecord>> => {
    return post<ApiResponse<AttendanceRecord>>('/Attendances/startTimer', request);
  },
  
  // Check out
  checkOut: (request: CheckOutRequest): Promise<ApiResponse<AttendanceRecord>> => {
    return post<ApiResponse<AttendanceRecord>>('/Attendances/stopTimer', request);
  },
  
  // Get weekly attendance
  getWeeklyAttendance: (): Promise<ApiResponse<AttendanceRecord[]>> => {
    return get<ApiResponse<AttendanceRecord[]>>('/Attendances/weekly');
  },
  
  // Get monthly attendance
  getMonthlyAttendance: (month: number, year: number): Promise<ApiResponse<AttendanceRecord[]>> => {
    return get<ApiResponse<AttendanceRecord[]>>(`/Attendances/monthly?month=${month}&year=${year}`);
  },
  
  // Utility function to check if user is currently checked in
  isCheckedIn: (attendance: AttendanceRecord | null): boolean => {
    if (!attendance || !attendance.timeLogs || attendance.timeLogs.length === 0) {
      return false;
    }
    
    const lastTimeLog = attendance.timeLogs[attendance.timeLogs.length - 1];
    return !!lastTimeLog.startTime && !lastTimeLog.endTime;
  },
};
