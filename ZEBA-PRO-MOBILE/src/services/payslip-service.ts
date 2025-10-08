import { get } from './api-client';

export interface Payslip {
  id: number;
  payrollRunId: number;
  employeeId: number;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  paidDays: number;
  lopDays: number;
  payDate: string;
  grossEarnings: number;
  deductions: number;
  taxes: number;
  totalNetPayable: number;
  payStartDate: string;
  payEndDate: string;
  paymentDate: string;
  status: number;
  paymentStatus: boolean;
  forceESICalc: boolean;
  payslipComponents: PayslipComponent[];
  payslipDeductions: PayslipDeduction[];
  payslipStatutoryComponents: any[];
  payslipSent: boolean;
  isSalaryWithheldForPreviousMonths: boolean;
  designation?: string; // Changed from string | null to string | undefined
  dateOfJoining?: string;
  pfNumber?: string;
  uan?: string;
}

export interface PayslipComponent {
  id: number;
  payslipId: number;
  salaryComponentId: number;
  salaryComponentName: string;
  isFixedPay: boolean;
  amount: number;
}

export interface PayslipDeduction {
  id: number;
  payslipId: number;
  tenantDeductionId: number;
  tenantDeductionName: string;
  deductionType: number;
  preTaxDeductionSection: string | null;
  amount: number;
  manualUpdate: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export const payslipService = {
  getPayslips: (): Promise<Payslip[]> => {
    return get<Payslip[]>('/Payroll/payslips');
  },

  getPayslip: (id: any): Promise<Payslip> => {
    return get<Payslip>(`/Payroll/payslips/${id}`);
  },

  getPayslipByMonthYear: async (month: string, year: string | number): Promise<Payslip> => {
    const response = await get<ApiResponse<Payslip>>(`/Payroll/payslip?month=${month}&year=${year}&userId=1`);
    return response.data;
  },

  // Updated method that returns blob for mobile compatibility
  downloadPayslipPDF: async (month: string, year: string | number): Promise<Blob> => {
    try {
      const url = `/Payroll/payslip/download?month=${month}&year=${year}&userId=1`;
      const apiUrl = import.meta.env.VITE_BASE_URL;
      const response = await fetch(`${apiUrl}/${url}`, { 
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to download PDF: ${response.status} - ${errorText}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Verify it's a PDF blob
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Ensure correct content type for mobile compatibility
      const pdfBlob = blob.type === 'application/pdf'
        ? blob
        : new Blob([blob], { type: 'application/pdf' });

      return pdfBlob;
    } catch (error) {
      console.error('Error downloading payslip PDF:', error);
      throw error;
    }
  },

  // Alternative method for direct download (desktop only)
  downloadPayslipDirect: async (month: string, year: string | number): Promise<void> => {
    try {
      const blob = await payslipService.downloadPayslipPDF(month, year);

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Payslip-${year}-${month}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error in direct download:', error);
      throw error;
    }
  },

  downloadPayslip: (id: any): Promise<Blob> => {
    return get<Blob>(`/Payroll/payslips/${id}/download`, {
      responseType: 'blob',
    });
  },
};