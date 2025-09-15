import React, { useEffect, useState, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { IonDatetime, IonItem } from '@ionic/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import HomeHeader from '../components/HomeHeader';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
} from 'lucide-react';
import axios from 'axios';

interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

interface Leave {
  leaveTypeName: string;
}

interface AttendanceRecord {
  date: string;
  startTime?: string;
  endTime?: string;
  totalHours?: string;
  attendanceStatus: number;
  overallApprovalStatus?: number;
  isWeekend?: boolean;
  isOnLeave?: boolean;
  leave?: Leave;
  holiday?: string;
  isHoliday?: boolean;
}

const AttendanceStatus = {
  Not_Applicable: 0,
  Present: 1,
  HalfDay: 2,
  Absent: 3,
  PresentButLate: 4,
  NotJoined: 5,
};

const TimeLogApprovalStatus = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
};

interface AttendanceLeaveStatusType {
  [key: number]: { key: number; class: string; text: string };
}

const AttendanceLeaveStatus: AttendanceLeaveStatusType = {
  0: { key: 0, class: 'bg-red-100 text-red-800', text: 'Not Applicable' },
  1: { key: 1, class: 'bg-green-100 text-green-800', text: 'Present' },
  2: { key: 2, class: 'bg-yellow-100 text-yellow-800', text: 'Half Day' },
  3: { key: 3, class: 'bg-red-100 text-red-800', text: 'Absent' },
  4: { key: 4, class: 'bg-green-100 text-green-800', text: 'Present' },
  5: { key: 5, class: 'bg-blue-100 text-blue-800', text: 'Week Off' },
  6: { key: 6, class: 'bg-gray-100 text-gray-800', text: 'Holiday' },
  7: { key: 7, class: 'bg-green-100 text-green-800', text: 'Present (Holiday)' },
  8: { key: 8, class: 'bg-yellow-100 text-yellow-800', text: 'Present (Leave)' },
  9: { key: 9, class: 'bg-yellow-100 text-yellow-800', text: 'Week Off (P)' },
};

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showDateFilter, setShowDateFilter] = useState(false);
  const startDateRef = useRef<HTMLDivElement>(null);
  const endDateRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate().toString().padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '-';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString || '-';
    }
  };

  const getAttendanceStatus = (record: AttendanceRecord) => {
    const recordDate = new Date(record.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    recordDate.setHours(0, 0, 0, 0);
    const isFutureDate = recordDate > today;

    if (record.isOnLeave && record.leave) {
      return {
        text: `On Leave (${record.leave.leaveTypeName})`,
        class: AttendanceLeaveStatus[8].class,
      };
    } else if (record.isWeekend) {
      return AttendanceLeaveStatus[5];
    } else if (record.isHoliday) {
      return {
        text: `Holiday${record.holiday ? ` (${record.holiday})` : ''}`,
        class: AttendanceLeaveStatus[6].class,
      };
    }

    if (record.attendanceStatus === AttendanceStatus.Absent && isFutureDate) {
      return {
        text: 'Upcoming',
        class: 'bg-gray-100 text-gray-600',
      };
    }

    return AttendanceLeaveStatus[record.attendanceStatus] || AttendanceLeaveStatus[0];
  };

  const getApprovalStatus = (status?: number) => {
    const statusMap = {
      [TimeLogApprovalStatus.Pending]: { text: 'Pending', color: 'bg-amber-100 text-amber-800' },
      [TimeLogApprovalStatus.Approved]: { text: 'Approved', color: 'bg-emerald-100 text-emerald-800' },
      [TimeLogApprovalStatus.Rejected]: { text: 'Rejected', color: 'bg-red-100 text-red-800' },
    };
    return statusMap[status || 0] || { text: '-', color: 'bg-gray-100 text-gray-800' };
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const formatDateForAPI = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  const formatDisplayDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);

    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  const goToPreviousWeek = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(newStartDate.getDate() - 7);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newStartDate.getDate() + 6);

    setStartDate(newStartDate);
    setEndDate(newEndDate);
    fetchAttendanceData();
  };

  const goToNextWeek = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(newStartDate.getDate() + 7);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newStartDate.getDate() + 6);

    setStartDate(newStartDate);
    setEndDate(newEndDate);
    fetchAttendanceData();
  };

  const fetchAttendanceData = async () => {
    if (!user) return;

    const employeeId = user.id;
    const apiStartDate = `${formatDateForAPI(startDate)} 00:00:00.000000`;
    const apiEndDate = `${formatDateForAPI(endDate)} 23:59:59.999000`;

    try {
      setIsLoading(true);
      const response = await axios.get<ApiResponse<AttendanceRecord[]>>('https://app.zeba.pro/backend/api/Attendances', {
        params: {
          startDate: apiStartDate,
          endDate: apiEndDate,
          employeeId,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data: AttendanceRecord[] = response.data.data || [];
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setAttendanceData(data);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
      toast.error('Failed to load attendance information.');
      setAttendanceData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [user, startDate, endDate]);

  const calculateStats = () => {
    if (!attendanceData.length) return { present: 0, absent: 0, leave: 0, weekend: 0, upcoming: 0 };

    let present = 0;
    let absent = 0;
    let leave = 0;
    let weekend = 0;
    let upcoming = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    attendanceData.forEach((record) => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      const isFutureDate = recordDate > today;

      if (record.isWeekend) {
        weekend++;
      } else if (record.isOnLeave) {
        leave++;
      } else if (record.attendanceStatus === AttendanceStatus.Absent && isFutureDate) {
        upcoming++; // Count upcoming days separately
      } else if (
        record.attendanceStatus === AttendanceStatus.Present ||
        record.attendanceStatus === AttendanceStatus.PresentButLate ||
        record.attendanceStatus === AttendanceStatus.NotJoined
      ) {
        present++;
      } else if (record.attendanceStatus === AttendanceStatus.Absent) {
        absent++;
      }
    });

    return { present, absent, leave, weekend, upcoming };
  };

  const stats = calculateStats();

  const getPercentage = (value: number) => {
    const total = stats.present + stats.absent + stats.leave + stats.weekend; // Exclude upcoming from total
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding-bottom">
        <div className="flex-1 bg-white">
          <HomeHeader />
          <main className="max-w-6xl mx-auto px-4 pb-20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-2xl font-medium text-gray-900">My Attendance</h1>
              </div>
              <div className="flex items-center gap-0 mt-4 md:mt-0">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={`flex items-center gap-2 !bg-white rounded-lg border-0 pl-4 transition-colors duration-200 ${
                    showDateFilter
                      ? 'bg-white border-blue-200 text-blue-700 font-bold'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Filter size={18} />
                  <span className="text-sm font-medium"></span>
                </button>
                <div className="text-sm text-gray-600">
                  {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)}
                </div>
              </div>
            </div>

            {showDateFilter && (
              <Card className="border border-gray-200 mb-8 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-stretch">
                    <div className="bg-gray-200 text-black py-2 px-2 flex items-center justify-center sm:justify-start sm:w-64">
                      <CalendarDays size={24} className="mr-3" />
                      <div className="flex items-center justify-between gap-28">
                        <h3 className="font-medium">Selected Period</h3>
                        <p className="text-black text-sm">Custom Range</p>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-5 relative">
                      <div className="hidden md:block text-gray-500 mr-4">Select start and end dates</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={goToPreviousWeek}
                          className="rounded-full p-1 text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors duration-200"
                          aria-label="Previous week"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <IonItem>
                          <IonDatetime
                            presentation="date"
                            value={startDate.toISOString()}
                            onIonChange={(e) => setStartDate(new Date(e.detail.value as string))}
                            max={endDate.toISOString()}
                          />
                        </IonItem>
                        <span className="mx-2 text-gray-600">—</span>
                        <IonItem>
                          <IonDatetime
                            presentation="date"
                            value={endDate.toISOString()}
                            onIonChange={(e) => setEndDate(new Date(e.detail.value as string))}
                            min={startDate.toISOString()}
                          />
                        </IonItem>
                        <button
                          onClick={goToNextWeek}
                          className="rounded-full p-1 text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors duration-200"
                          aria-label="Next week"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border border-gray-200 mb-8">
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
                  <div className="flex items-center justify-between md:block">
                    <div className="flex items-center md:block pt-2 md:pt-4">
                      <div className="bg-green-100 p-2 rounded-full mr-3 md:mr-0 md:p-3">
                        <CalendarIcon size={16} className="text-green-600 md:w-6 md:h-6" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 mb-0 md:mb-1">Present</p>
                        <h3 className="text-lg md:text-3xl font-bold text-gray-900">{stats.present}</h3>
                        <p className="text-[10px] md:text-xs text-gray-500 mt-0 md:mt-2 hidden md:block">
                          Days this period
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block mt-6">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{getPercentage(stats.present)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${getPercentage(stats.present)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:block">
                    <div className="flex items-center md:block pt-2 md:pt-4">
                      <div className="bg-red-100 p-2 rounded-full mr-3 md:mr-0 md:p-3">
                        <CalendarIcon size={16} className="text-red-600 md:w-6 md:h-6" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 mb-0 md:mb-1">Absent</p>
                        <h3 className="text-lg md:text-3xl font-bold text-gray-900">{stats.absent}</h3>
                        <p className="text-[10px] md:text-xs text-gray-500 mt-0 md:mt-2 hidden md:block">
                          Days this period
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block mt-6">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{getPercentage(stats.absent)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${getPercentage(stats.absent)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:block">
                    <div className="flex items-center md:block pt-2 md:pt-4">
                      <div className="bg-amber-100 p-2 rounded-full mr-3 md:mr-0 md:p-3">
                        <CalendarIcon size={16} className="text-amber-600 md:w-6 md:h-6" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 mb-0 md:mb-1">On Leave</p>
                        <h3 className="text-lg md:text-3xl font-bold text-gray-900">{stats.leave}</h3>
                        <p className="text-[10px] md:text-xs text-gray-500 mt-0 md:mt-2 hidden md:block">
                          Days this period
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block mt-6">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{getPercentage(stats.leave)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${getPercentage(stats.leave)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:block">
                    <div className="flex items-center md:block pt-2 md:pt-4">
                      <div className="bg-blue-100 p-2 rounded-full mr-3 md:mr-0 md:p-3">
                        <CalendarIcon size={16} className="text-blue-600 md:w-6 md:h-6" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 mb-0 md:mb-1">Weekends</p>
                        <h3 className="text-lg md:text-3xl font-bold text-gray-900">{stats.weekend}</h3>
                        <p className="text-[10px] md:text-xs text-gray-500 mt-0 md:mt-2 hidden md:block">
                          Days this period
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block mt-6">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{getPercentage(stats.weekend)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${getPercentage(stats.weekend)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 overflow-hidden">
              <CardHeader className="py-5 px-6 bg-white border-b border-gray-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-800">Attendance Records</CardTitle>
                <div className="text-sm text-gray-500">Showing {attendanceData.length} records</div>
              </CardHeader>
              {isLoading ? (
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              ) : attendanceData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white border-b border-gray-200">
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Time In
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Time Out
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Total Hours
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Approval
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attendanceData.map((record, index) => {
                        const status = getAttendanceStatus(record);
                        const approval = getApprovalStatus(record.overallApprovalStatus);
                        return (
                          <tr key={index} className="bg-white hover:bg-gray-50">
                            <td className="py-4 px-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{formatDate(record.date)}</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.class}`}>
                                {status.text}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              {record.startTime ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">{formatTime(record.startTime)}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              {record.endTime ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">{formatTime(record.endTime)}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              {record.totalHours && record.totalHours !== '00:00:00' ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">{record.totalHours.substring(0, 5)}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${approval.color}`}>
                                {approval.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <CardContent className="py-20 px-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="bg-gray-100 rounded-full p-6 mb-4">
                      <CalendarIcon className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">No attendance records found</h3>
                    <p className="text-gray-500 max-w-sm">
                      Try selecting a different date range or check back later for updated records
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AttendancePage;