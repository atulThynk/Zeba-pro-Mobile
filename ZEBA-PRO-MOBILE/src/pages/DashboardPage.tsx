import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import HomeHeader from '../components/HomeHeader';
import TabNavigation from '../components/TabNavigation';
import AttendanceCard from '../components/dashboard/AttendanceCard';
import AnnouncementsCard from '../components/dashboard/AnnouncementsCard';
import HolidaysCard from '../components/dashboard/HolidaysCard';
import BirthdaysCard from '../components/dashboard/BirthdaysCard';
import AnniversariesCard from '../components/dashboard/AnniversariesCard';
import type { WorkAnniversary } from '@/services/dashboard-service';
import { attendanceService, AttendanceRecord } from '../services/attendance-service';
import { dashboardService, Announcement, Holiday, Birthday } from '../services/dashboard-service';
import { notificationService } from '../services/notification-service';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [anniversaries, setAnniversaries] = useState<WorkAnniversary[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isLoading, setIsLoading] = useState({
    attendance: true,
    announcements: true,
    holidays: true,
    birthdays: true,
    anniversaries: true,
  });

  const fetchDashboardData = async () => {
    try {
      // Fetch attendance for current date
      const today = new Date().toISOString().split('T')[0];
      const attendanceData = await attendanceService.getTodayAttendance();
      setAttendance(attendanceData);
      setIsLoading(prev => ({ ...prev, attendance: false }));
      
      // Fetch announcements
      const dashboardData = await dashboardService.getAnnouncements();
      console.log("dash data", dashboardData);
      
      setAnnouncements(dashboardData?.announcements);
      setHolidays(dashboardData.holidaysData);
      setBirthdays(dashboardData.birthdaysData);
      setAnniversaries(dashboardData.anniversariesData);
      setIsLoading(prev => ({ ...prev, announcements: false }));
      
      // Fetch user data
      const userData = await dashboardService.getUserData();
      console.log("user data", userData);
      
      // Fetch unread notifications count
      const unreadCount = await notificationService.getUnreadCount();
      setUnreadNotifications(unreadCount);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Pull down to refresh.",
      });
    }
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Format total hours from HH:mm:ss.ffffff to HH:mm
  const formatTotalHours = (totalHours: string | undefined): string => {
    if (!totalHours) return "00:00";
    const [hours, minutes] = totalHours.split(':').slice(0, 2);
    return `${hours}:${minutes}`;
  };

  // Calculate current session time
  const getCurrentSessionTime = () => {
    if (!attendance?.timeLogs || attendance.timeLogs.length === 0) {
      return "0";
    }

    const lastTimeLog = attendance.timeLogs[attendance.timeLogs.length - 1];
    if (lastTimeLog.endTime) {
      return "0";
    }

    const startTime = new Date(`${attendance.date}T${lastTimeLog.startTime}`);
    const diffMs = currentTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="min-h-screen bg-white text-foreground pb-16">
      <HomeHeader />
      
      <main className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl text-black font-bold">Hello, {user?.name || 'User'}</h1>
        </div>
        
        <AttendanceCard 
          attendance={attendance} 
          onCheckInOut={fetchDashboardData} 
        />
        
        <AnnouncementsCard 
          announcements={announcements} 
          isLoading={isLoading.announcements} 
        />
        
        <HolidaysCard 
          holidays={holidays} 
          isLoading={isLoading.announcements} 
        />
        
        <BirthdaysCard 
          birthdays={birthdays} 
          isLoading={isLoading.announcements} 
        />
        
        <AnniversariesCard 
          anniversaries={anniversaries} 
          isLoading={isLoading.announcements} 
        />
      </main>
      
      <TabNavigation unreadNotificationsCount={unreadNotifications} />
    </div>
  );
};

export default DashboardPage;