import { get, post } from './api-client';

export interface UserProfile {
  id: any;
  name?: string;
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

export interface TenantData {
  id: number;
  name?: any;
  tenantName?: string;
  logoUrl?: any;
  userRole?: number; 
  isActive?: any; // Added to match Tenant interface
}

export interface Tenant {
  id: number;
  name?: any;
  tenantName?: string;
  logoUrl?: string; // Optional, as it's not in the API response
  userRole?: number; // Optional, since it's in the API but not used
  isActive?: any; // Changed from isTenantActive to match code
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}
export interface SelectTenantResponse {
  success: boolean;
  data: any;
  token: any;
}

export const userService = {
  // service
  getUserProfile: async (userId: string): Promise<UserProfile> => {
    const response = await get<UserProfile>(`/Users/${userId}`);
    return response; // no .data because your backend doesn't wrap
  },

  getTenantDetails: (): Promise<TenantData> => {
    return get<ApiResponse<TenantData>>('/Tenants')
      .then(response => response.data);
  },
  getAllTenants: (): Promise<Tenant[]> => {
    return get<ApiResponse<any[]>>('account/tenants').then((response) =>
      response.data.map((tenant: any) => ({
        id: tenant.id,
        name: tenant.name,
        isActive: tenant.isTenantActive,
        userRole: tenant.userRole,
      }))
    );
  },
  selectTenant: (tenantId: number): Promise<SelectTenantResponse> => {
    return post<ApiResponse<SelectTenantResponse>>(
      `/Account/select-tenant?tenantId=${tenantId}`,
      {}
    ).then(response => response.data);
  },

};  