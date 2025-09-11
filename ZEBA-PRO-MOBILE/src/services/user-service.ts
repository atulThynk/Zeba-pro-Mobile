import { get } from './api-client';

export interface UserProfile {
  id: any;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  maritalStatus: number;
  marriageDate: string | null;
  address: string;
  personalEmail: string;
  gender: number;
  spouseName: string | null;
  bloodGroup: number;
  emergencyContact: string;
  experience: number;
  totalExperience: number;
  employeeNumber: string;
  designation: string | null;
  departmentId: number;
  departmentName: string | null;
  dateOfJoining: string;
  dateOfConfirmation: string | null;
  workLocation: string;
  esiNumber: string | null;
  pfNumber: string | null;
  uan: string | null;
  annualCTC: number;
  pan: string;
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  ifscCode: string;
  roleId: number;
  status: number;
  profileImage: string;
  imageUrl: string;
  forceESICalc: boolean;
  reportingManagerId: number;
  reportingManager: any;
  earningAssociations: any[];
  deductionAssociations: any[];
  regimeType: number;
  userFieldValues: any[];
  lastLogin: string | null;
}

interface TenantData {
  logoUrl?: string;
  tenantName: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export const userService = {
  getUserProfile: (userId: string): Promise<UserProfile> => {
    return get<ApiResponse<UserProfile>>(`/Users/${userId}`)
      .then(response => response.data);
  },
  getTenantDetails: (): Promise<TenantData> => {
    return get<ApiResponse<TenantData>>('/Tenants')
      .then(response => response.data);
  },
};