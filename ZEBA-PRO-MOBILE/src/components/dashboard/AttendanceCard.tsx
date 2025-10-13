import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, TimerReset, Hourglass, Loader2, MapPin, Settings, X } from 'lucide-react';
import { attendanceService, AttendanceRecord, CheckInRequest, CheckOutRequest } from '@/services/attendance-service';
import { formatTime } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { NativeSettings } from 'capacitor-native-settings';

interface AttendanceCardProps {
  attendance: AttendanceRecord | null;
  onCheckInOut: () => void;
  isDataLoading?: boolean;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({ 
  attendance, 
  onCheckInOut, 
  isDataLoading = false 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationDialogType, setLocationDialogType] = useState<'permission' | 'service'>('permission');

  // Update time every second for live session time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const permissionStatus = await Geolocation.requestPermissions();
      
      if (permissionStatus.location === 'granted' || permissionStatus.coarseLocation === 'granted') {
        return true;
      } else {
        setLocationDialogType('permission');
        setShowLocationDialog(true);
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      setLocationDialogType('permission');
      setShowLocationDialog(true);
      return false;
    }
  };

  const getCurrentPosition = async (): Promise<{latitude: number; longitude: number} | null> => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      // Handle specific error codes for better user feedback
      if (error.code === 1) { // PERMISSION_DENIED
        setLocationDialogType('permission');
        setShowLocationDialog(true);
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        setLocationDialogType('service');
        setShowLocationDialog(true);
      } else if (error.code === 3) { // TIMEOUT
        toast({
          description: 'Location request timed out. Please try again.',
          variant: 'destructive',
          duration: 5000,
        });
      } else {
        toast({
          description: 'Failed to get location. Please try again.',
          variant: 'destructive',
          duration: 5000,
        });
      }
      
      return null;
    }
  };

  const handleCheckInOut = async () => {
    setIsLoading(true);
    
    try {
      let location = null;
      
      // Only attempt to get location on native platforms
      if (Capacitor.isNativePlatform()) {
        // Always request permission on check-in, regardless of previous status
        const permissionGranted = await requestLocationPermission();
        if (!permissionGranted) {
          setIsLoading(false);
          return;
        }
        
        // Get current position
        location = await getCurrentPosition();
        if (!location) {
          setIsLoading(false);
          return;
        }
      }

      const isCheckedIn = getCurrentSessionTime() !== "00:00:00";
      const request: CheckInRequest | CheckOutRequest = {
        latitude: location?.latitude,
        longitude: location?.longitude,
        isMobileCheckIn: Capacitor.isNativePlatform()
      };

      const response = isCheckedIn 
        ? await attendanceService.checkOut(request)
        : await attendanceService.checkIn(request);

      toast({
        description: response.message || (isCheckedIn ? "Successfully checked out" : "Successfully checked in"),
        variant: "default",
        duration: 3000,
      });

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

  // Parse time safely
  const [hours, minutes, seconds] = lastTimeLog.startTime.split(':').map(Number);

  // Create start time using attendance.date (assumed format: YYYY-MM-DD)
  const startTime = new Date(attendance.date);
  startTime.setHours(hours, minutes, seconds, 0);

  const diffMs = currentTime.getTime() - startTime.getTime();

  if (diffMs < 0) return "00:00:00"; // just in case future time causes negative diff

  const h = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
  const s = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');

  return `${h}:${m}:${s}`;
};
  

  const isCheckedIn = getCurrentSessionTime() !== "00:00:00";
const openDeviceSettings = async () => {
  try {
    setShowLocationDialog(false);

    const platform = Capacitor.getPlatform();

    if (platform === 'android' || platform === 'ios') {
      await (NativeSettings as any).open({
       
  optionAndroid: 'location', 
  optionIOS: 'location',  
}); 
     
      console.log('Opened device location settings');
    } else {
      console.warn('NativeSettings not supported on web');
      toast({
        description: 'Settings opening is only supported on mobile devices.',
        duration: 4000,
      });
    }
  } catch (error) {
    console.error('Failed to open settings:', error);
    toast({
      description: 'Please enable location manually: Settings → Location → Turn ON',
      variant: 'destructive',
      duration: 5000,
    });
  }
};


  return (
    <>
      {/* Permission Modal */}
      {showLocationDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowLocationDialog(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
            {/* Close button */}
            <button
              onClick={() => setShowLocationDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full">
              {locationDialogType === 'permission' ? (
                <MapPin className="w-8 h-8 text-amber-600" />
              ) : (
                <Settings className="w-8 h-8 text-amber-600" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
              {locationDialogType === 'permission' 
                ? 'Location Permission Required' 
                : 'Location Services Disabled'}
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              {locationDialogType === 'permission' 
                ? 'This app needs location access to record your attendance accurately. Please enable location permission in your device settings.' 
                : 'Location services are currently disabled on your device. Please enable them in your device settings to continue.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={openDeviceSettings}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Settings size={18} />
                Open Settings
              </button>
              <button
                onClick={() => setShowLocationDialog(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Card className="border-gray-100 bg-white mb-6 overflow-hidden rounded-xl">
        <CardHeader className="flex justify-center items-center py-4 border-gray-100 bg-white">
          <CardTitle className="text-lg font-medium flex items-center text-gray-800">
            Today's Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 mb-3">
            <div className="text-center p-4 border-gray-100 bg-white rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TimerReset size={20} className="text-emerald-500 mr-2" />
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
              </div>
              {isDataLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                </div>
              ) : (
                <p className="text-xl font-semibold text-gray-800">
                  {formatTotalHours(attendance?.totalHours)}
                </p>
              )}
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Hourglass size={20} className="text-blue-500 mr-2" />
                <p className="text-sm font-medium text-gray-600">Session Time</p>
              </div>
              {isDataLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                </div>
              ) : (
                <p className="text-xl font-semibold text-gray-800">
                  {getCurrentSessionTime()}
                </p>
              )}
            </div>
          </div>
          <div className="w-full flex justify-center text-right items-right mb-3">
            {isDataLoading ? (
              <div className="w-32 py-2 flex items-center justify-center bg-gray-300 rounded-full">
                <Loader2 className="animate-spin h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-500">Loading...</span>
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
    </>
  );
};

export default AttendanceCard;