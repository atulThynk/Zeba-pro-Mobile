import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/user-service';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import HomeHeader from '@/components/HomeHeader';
import TabNavigation from '@/components/TabNavigation';
import { Mail, Phone, Building, Calendar, User, MapPin, CreditCard, FileText, AlertCircle } from 'lucide-react';

// Define UserProfile interface based on properties used
interface UserProfile {
  id: any;
  firstName: any;
  middleName?: any;
  lastName: any;
  designation?: any;
  employeeNumber: any;
  dateOfJoining: any;
  email: any;
  phoneNumber: any;
  workLocation: any;
  dateOfBirth: any;
  gender?: any;
  bloodGroup?: any;
  maritalStatus?: any;
  address?: any;
  departmentName?: any;
  dateOfConfirmation?: any;
  experience: any;
  totalExperience: any;
  emergencyContact?: any;
  bankName?: any;
  accountHolderName?: any;
  bankAccountNumber?: any;
  ifscCode?: any;
  pan?: any;
  pfNumber?: any;
  esiNumber?: any;
  uan?: any;
  imageUrl?: any;
}


const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const profileData = await userService.getUserProfile(user.id);
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile information.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  // Helper function to format dates
  const formatDate = (dateString: string | null | undefined): string => {
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

  // Helper to map marital status code to text
  const getMaritalStatusText = (status: number | null | undefined): string => {
    const statusMap: { [key: number]: string } = {
      0: 'Single',
      1: 'Married',
      2: 'Divorced',
      3: 'Widowed',
    };
    return status !== undefined && status !== null ? statusMap[status] || 'Unknown' : 'Unknown';
  };

  // Helper to map gender code to text
  const getGenderText = (gender: number | null | undefined): string => {
    const genderMap: { [key: number]: string } = {
      0: 'Male',
      1: 'Female',
      2: 'Other',
    };
    return gender !== undefined && gender !== null ? genderMap[gender] || 'Unknown' : 'Unknown';
  };

  // Helper to map blood group code to text
  const getBloodGroupText = (group: number | null | undefined): string => {
    const bloodGroupMap: { [key: number]: string } = {
      0: 'A+',
      1: 'A-',
      2: 'B+',
      3: 'B-',
      4: 'AB+',
      5: 'AB-',
      6: 'O+',
      7: 'O-',
    };
    return group !== undefined && group !== null ? bloodGroupMap[group] || 'Unknown' : 'Unknown';
  };

  // Helper to format profile value or show placeholder
  const formatValue = (value: string | null | undefined, placeholder = 'Not available'): string => {
    return value || placeholder;
  };

  // Component for info item with icon
  interface InfoItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    className?: string;
  }

  const InfoItem = ({ icon, label, value, className = "" }: InfoItemProps) => (
    <div className={`flex items-start space-x-3 ${className}`}>
      <div className="mt-0.5 text-[#9fc4fc]">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />

      <main className="max-w-5xl mx-auto px-4 pb-20 pt-8">
        {/* Profile Header with back navigation */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : profile ? (
          <div className="space-y-8">
            {/* Profile Summary Card */}
            <Card className="overflow-hidden shadow-sm border border-gray-200">
              <div className="h-40 bg-gradient-to-b from-gray-200 to-white "></div>
              <CardContent className="relative pt-0 px-8 pb-8">
                <div className="flex flex-col md:flex-row items-start md:items-end -mt-20 mb-8 gap-8">
                  <Avatar className="w-36 h-36 border-4 border-white shadow-md">
                    <AvatarImage src={profile.imageUrl} alt={`${profile.firstName} ${profile.lastName}`} />
                    <AvatarFallback className="text-3xl bg-gray-100 text-[#9fc4fc]">{getInitials(`${profile.firstName} ${profile.lastName}`)}</AvatarFallback>
                  </Avatar>
                  <div className="pt-6 md:pt-0 flex-1">
                    <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-800">{profile.firstName} {profile.middleName || ''} {profile.lastName}</h2>
                        <p className="text-xl font-medium text-gray-600 mt-1">{formatValue(profile.designation)}</p>
                      </div>
                      <div className="flex flex-col items-start md:items-end">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User size={16} className="text-[#9fc4fc]" /> Employee ID: <span className="font-semibold">{profile.employeeNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Calendar size={16} className="text-[#9fc4fc]" /> Joined: <span className="font-semibold">{formatDate(profile.dateOfJoining)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100 pt-6">
                  <InfoItem
                    icon={<Mail size={20} />}
                    label="Email"
                    value={formatValue(profile.email)}
                  />
                  <InfoItem
                    icon={<Phone size={20} />}
                    label="Phone"
                    value={formatValue(profile.phoneNumber)}
                  />
                  <InfoItem
                    icon={<MapPin size={20} />}
                    label="Location"
                    value={formatValue(profile.workLocation)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Personal Information Card */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-xl font-semibold text-gray-800 px-6">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem
                    icon={<Calendar size={20} />}
                    label="Date of Birth"
                    value={formatDate(profile.dateOfBirth)}
                  />
                  <InfoItem
                    icon={<User size={20} />}
                    label="Gender"
                    value={getGenderText(profile.gender)}
                  />
                  <InfoItem
                    icon={<AlertCircle size={20} />}
                    label="Blood Group"
                    value={getBloodGroupText(profile.bloodGroup)}
                  />
                  <InfoItem
                    icon={<User size={20} />}
                    label="Marital Status"
                    value={getMaritalStatusText(profile.maritalStatus)}
                  />
                  <InfoItem
                    icon={<MapPin size={20} />}
                    label="Address"
                    value={formatValue(profile.address)}
                    className="md:col-span-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Employment Information Card */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-xl font-semibold text-gray-800 px-6">Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
                  <InfoItem
                    icon={<Building size={20} />}
                    label="Department"
                    value={formatValue(profile.departmentName)}
                  />
                  <InfoItem
                    icon={<Calendar size={20} />}
                    label="Date of Confirmation"
                    value={formatDate(profile.dateOfConfirmation)}
                  />
                  <InfoItem
                    icon={<Calendar size={20} />}
                    label="Work Experience"
                    value={`${formatValue(profile.experience)} years (${formatValue(profile.totalExperience)} total)`}
                  />
                  <InfoItem
                    icon={<AlertCircle size={20} />}
                    label="Emergency Contact"
                    value={formatValue(profile.emergencyContact)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Banking & Finance Information Card */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-xl font-semibold text-gray-800 px-6">Banking & Finance</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
                  <div className="md:col-span-2 p-5 rounded-lg border border-[#e6edfb] flex items-center gap-4 mb-2">
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">{formatValue(profile.bankName)}</p>
                      <p className="text-gray-600 text-sm">{formatValue(profile.accountHolderName)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-800 font-medium">A/C: {formatValue(profile.bankAccountNumber)}</p>
                      <p className="text-gray-600 text-sm">IFSC: {formatValue(profile.ifscCode)}</p>
                    </div>
                  </div>

                  <InfoItem
                    icon={<FileText size={20} />}
                    label="PAN"
                    value={formatValue(profile.pan)}
                  />
                  <InfoItem
                    icon={<FileText size={20} />}
                    label="PF Number"
                    value={formatValue(profile.pfNumber)}
                  />
                  <InfoItem
                    icon={<FileText size={20} />}
                    label="ESI Number"
                    value={formatValue(profile.esiNumber)}
                  />
                  <InfoItem
                    icon={<FileText size={20} />}
                    label="UAN"
                    value={formatValue(profile.uan)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="py-16 text-center">
              <AlertCircle className="mx-auto mb-4 text-[#9fc4fc]" size={48} />
              <p className="text-xl font-medium text-gray-800">Failed to load profile information</p>
              <p className="text-gray-600 mt-2">Please try again later or contact IT support</p>
            </CardContent>
          </Card>
        )}
      </main>

      <TabNavigation />
    </div>
  );
};

export default ProfilePage;