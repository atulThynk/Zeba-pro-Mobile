import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import HomeHeader from '../components/HomeHeader';
import AttendanceCard from '../components/dashboard/AttendanceCard';
import AnnouncementsCard from '../components/dashboard/AnnouncementsCard';
import HolidaysCard from '../components/dashboard/HolidaysCard';
import BirthdaysCard from '../components/dashboard/BirthdaysCard';
import AnniversariesCard from '../components/dashboard/AnniversariesCard';
import type { WorkAnniversary } from '@/services/dashboard-service';
import { attendanceService, AttendanceRecord } from '../services/attendance-service';
import { dashboardService, Announcement, Holiday, Birthday } from '../services/dashboard-service';
import { notificationService } from '../services/notification-service';
import { userService } from '@/services/user-service';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useIonRouter();

  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [anniversaries, setAnniversaries] = useState<WorkAnniversary[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const userData =JSON.parse(localStorage.getItem('user') || '{}');
  const [isLoading, setIsLoading] = useState({
    attendance: true,
    announcements: true,
    holidays: true,
    birthdays: true,
    anniversaries: true,
  });

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceData = await attendanceService.getTodayAttendance();
      setAttendance(attendanceData);
      setIsLoading(prev => ({ ...prev, attendance: false }));

      const dashboardData = await dashboardService.getAnnouncements();
      setAnnouncements(dashboardData?.announcements || []);
      setHolidays(dashboardData.holidaysData || []);
      setBirthdays(dashboardData.birthdaysData || []);
      setAnniversaries(dashboardData.anniversariesData || []);
      setIsLoading(prev => ({ ...prev, announcements: false }));

      const userData = await dashboardService.getUserData();
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

useEffect(() => {
  const fetchData = async () => {
    await fetchDashboardData();

    try {
      const tenantData = await userService.getTenantDetails();
      const logoUrl = tenantData.logoUrl || '';
      localStorage.setItem('tenantLogo', logoUrl);
      localStorage.setItem('tenantName', tenantData.name || 'Unknown Tenant');
    } catch (error) {
      console.error("Failed to fetch tenant details:", error);
    }
  };

  fetchData();

  const interval = setInterval(fetchDashboardData, 300000);
  return () => clearInterval(interval);
}, []);

  const formatTotalHours = (totalHours: string | undefined): string => {
    if (!totalHours) return "00:00";
    const [hours, minutes] = totalHours.split(':').slice(0, 2);
    return `${hours}:${minutes}`;
  };

  const getCurrentSessionTime = () => {
    if (!attendance?.timeLogs || attendance.timeLogs.length === 0) return "00:00:00";
    const lastTimeLog = attendance.timeLogs[attendance.timeLogs.length - 1];
    if (lastTimeLog.endTime) return "00:00:00";
    const startTime = new Date(`${attendance.date}T${lastTimeLog.startTime}`);
    const diffMs = currentTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="bg-white text-foreground min-h-screen">
          
          
         <main className="p-4 mt-[calc(var(--safe-area-inset-top)+56px)]">
            <div className="mb-6">
              <h1 className="text-2xl text-black font-bold">Hello, {userData?.firstName || 'User'}</h1>
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
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;