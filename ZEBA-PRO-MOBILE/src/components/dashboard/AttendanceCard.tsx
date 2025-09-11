import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, TimerReset, Hourglass, Loader2 } from 'lucide-react';
import { attendanceService, AttendanceRecord } from '@/services/attendance-service';
import { formatTime } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AttendanceCardProps {
  attendance: AttendanceRecord | null;
  onCheckInOut: () => void;
  isDataLoading?: boolean; // New prop to indicate if data is being fetched
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({ 
  attendance, 
  onCheckInOut, 
  isDataLoading = false 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Update time every second for live session time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckInOut = async () => {
    setIsLoading(true);
    try {
      if (getCurrentSessionTime() !== "00:00:00") {
        // Check out
        await attendanceService.checkOut({});
        toast({
          description: "Successfully checked out",
          variant: "default",
          duration: 3000,
        });
      } else {
        // Check in
        await attendanceService.checkIn({});
        toast({
          description: "Successfully checked in",
          variant: "default",
          duration: 3000,
        });
      }
      onCheckInOut();
    } catch (error) {
      console.error("Failed to update attendance:", error);
      toast({
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format total hours from HH:mm:ss.ffffff to HH:mm:ss
  const formatTotalHours = (totalHours: string | undefined): string => {
    if (!totalHours) return "00:00:00";
    const [hours, minutes, seconds] = totalHours.split(':');
    const formattedSeconds = seconds.split('.')[0]; // Remove microseconds
    return `${hours}:${minutes}:${formattedSeconds}`;
  };

  // Calculate current session time
  const getCurrentSessionTime = (): string => {
    if (!attendance?.timeLogs || attendance.timeLogs.length === 0) {
      return "00:00:00";
    }

    const lastTimeLog = attendance.timeLogs[attendance.timeLogs.length - 1];
    if (lastTimeLog.endTime) {
      return "00:00:00";
    }

    const startTime = new Date(`${attendance.date}T${lastTimeLog.startTime}`);
    const diffMs = currentTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const isCheckedIn = getCurrentSessionTime() !== "00:00:00";

  return (
    <Card className="border-gray-100 bg-white dark:bg-gray-800 mb-6 overflow-hidden rounded-xl">
      <CardHeader className="flex justify-center items-center py-4 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardTitle className="text-lg font-medium flex items-center text-gray-800 dark:text-gray-100">
          Today's Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 mb-3">
          <div className="text-center p-4 border-gray-100 bg-white dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TimerReset size={20} className="text-emerald-500 mr-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Hours</p>
            </div>
            {isDataLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
              </div>
            ) : (
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {formatTotalHours(attendance?.totalHours)}
              </p>
            )}
          </div>
          <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Hourglass size={20} className="text-blue-500 mr-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Session Time</p>
            </div>
            {isDataLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
              </div>
            ) : (
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {getCurrentSessionTime()}
              </p>
            )}
          </div>
        </div>
        <div className="w-full flex justify-center text-right items-right mb-3">
          {isDataLoading ? (
            <div className="w-32 py-2 flex items-center justify-center bg-gray-300 dark:bg-gray-600 rounded-full">
              <Loader2 className="animate-spin h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
          ) : (
            <Button 
              onClick={handleCheckInOut}
              disabled={isLoading}
              className={`w-32 py-2 transition-all duration-300 ${
                isCheckedIn 
                  ? 'bg-rose-400 hover:bg-rose-500 focus:ring-rose-300' 
                  : 'bg-emerald-400 hover:bg-emerald-500 focus:ring-emerald-300'
              } text-white font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                </div>
              ) : (
                isCheckedIn ? 'Check Out' : 'Check In'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceCard;