import React from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import  numberToWords from 'number-to-words';

interface PayslipComponent {
  id: number;
  salaryComponentName: string;
  amount: number;
}

interface PayslipDeduction {
  id: number;
  tenantDeductionName: string;
  amount: number;
}

interface PayslipStatutoryComponent {
  id: number;
  statutoryComponentName: string;
  employeesContribution: number;
  employersContribution: number;
}

interface Payslip {
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  designation?: string;
  dateOfJoining?: string;
  pfNumber?: string;
  uan?: string;
  paidDays: number;
  lopDays: number;
  payDate: string;
  payStartDate: string;
  payEndDate: string;
  paymentDate: string;
  totalNetPayable: number;
  taxes: number;
  payslipComponents: PayslipComponent[];
  payslipDeductions: PayslipDeduction[];
  payslipStatutoryComponents: PayslipStatutoryComponent[];
}

interface PayslipCardProps {
  payslip: Payslip;
}

const PayslipCard: React.FC<PayslipCardProps> = ({ payslip }) => {
  // Format currency values
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format payslip date
  const formatPayslipDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  // Convert number to words for net pay
  const amountInWords = (amount: number) => {
    try {
      return `${numberToWords.toWords(Math.floor(amount))} rupees only`;
    } catch (error) {
      return `${amount.toFixed(2)} rupees only`;
    }
  };

  // Calculate total earnings
  const totalEarnings = payslip.payslipComponents.reduce(
    (sum, component) => sum + component.amount,
    0
  );

  // Calculate total deductions (including taxes)
  const totalDeductions = payslip.payslipDeductions.reduce(
    (sum, deduction) => sum + deduction.amount,
    0
  ) + payslip.taxes;

  return (
    <Card className="w-full mb-6 overflow-hidden border-gray-200 shadow-sm">
      {/* Header with company logo and info */}
      <CardHeader className="bg-white border-b border-gray-100 pb-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-800">THYNK WEB</h1>
          </div>
          <p className="text-sm text-gray-600">
            6th Floor, JMD MEGAPOLIS, 630 - 637, Sector 48, Gurgaon
          </p>
          <p className="text-sm font-medium text-gray-800 mt-2">
            Payslip for {formatPayslipDate(payslip.payDate)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Employee Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 border-b border-gray-100">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Employee Name:</span>
              <span className="text-sm text-gray-800">{payslip.firstName} {payslip.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Employee Number:</span>
              <span className="text-sm text-gray-800">{payslip.employeeNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Designation:</span>
              <span className="text-sm text-gray-800">{payslip.designation || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Date of Joining:</span>
              <span className="text-sm text-gray-800">{formatPayslipDate(payslip.dateOfJoining)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">PF Number:</span>
              <span className="text-sm text-gray-800">{payslip.pfNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">UAN:</span>
              <span className="text-sm text-gray-800">{payslip.uan || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Work Location:</span>
              <span className="text-sm text-gray-800">Gurgaon</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Paid Days / LOP Days:</span>
              <span className="text-sm text-gray-800">{payslip.paidDays} / {payslip.lopDays}</span>
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold mb-3 text-gray-800 text-sm">Earnings</h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[180px] text-xs text-gray-700">Component</TableHead>
                <TableHead className="text-right text-xs text-gray-700">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslip.payslipComponents.map((component) => (
                <TableRow key={component.id}>
                  <TableCell className="text-xs text-gray-800">{component.salaryComponentName}</TableCell>
                  <TableCell className="text-right text-xs text-gray-800">
                    {formatCurrency(component.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t border-gray-200">
                <TableCell className="font-medium text-xs text-gray-800">Total Earnings</TableCell>
                <TableCell className="text-right font-medium text-xs text-gray-800">
                  {formatCurrency(totalEarnings)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Deductions */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold mb-3 text-sm text-gray-800">Deductions</h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[180px] text-xs text-gray-700">Component</TableHead>
                <TableHead className="text-right text-xs text-gray-700">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslip.payslipDeductions.map((deduction) => (
                <TableRow key={deduction.id}>
                  <TableCell className="text-xs text-gray-800">{deduction.tenantDeductionName}</TableCell>
                  <TableCell className="text-right text-xs text-gray-800">
                    {formatCurrency(deduction.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {payslip.taxes > 0 && (
                <TableRow>
                  <TableCell className="text-xs text-gray-800">Taxes</TableCell>
                  <TableCell className="text-right text-xs text-gray-800">
                    {formatCurrency(payslip.taxes)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="border-t border-gray-200">
                <TableCell className="font-medium text-xs text-gray-800">Total Deductions</TableCell>
                <TableCell className="text-right font-medium text-xs text-gray-800">
                  {formatCurrency(totalDeductions)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Statutory Components */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold mb-3 text-sm text-gray-800">Statutory Components</h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[180px] text-xs text-gray-700">Component</TableHead>
                <TableHead className="text-right text-xs text-gray-700">Employee Contribution (₹)</TableHead>
                <TableHead className="text-right text-xs text-gray-700">Employer Contribution (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslip.payslipStatutoryComponents.map((statutory) => (
                <TableRow key={statutory.id}>
                  <TableCell className="text-xs text-gray-800">{statutory.statutoryComponentName}</TableCell>
                  <TableCell className="text-right text-xs text-gray-800">
                    {formatCurrency(statutory.employeesContribution)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-gray-800">
                    {formatCurrency(statutory.employersContribution)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Net Pay Summary */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-gray-800 text-base">Net Pay</span>
            <span className="font-bold text-gray-800 text-base">{formatCurrency(payslip.totalNetPayable)}</span>
          </div>
          <div className="text-sm text-gray-800 space-y-1">
            <p>
              <span className="font-medium">Amount in Words:</span> {amountInWords(payslip.totalNetPayable)}
            </p>
            <p>
              <span className="font-medium">Mode of Payment:</span> Bank Transfer
            </p>
            <p>
              <span className="font-medium">Pay Period:</span>{' '}
              {formatPayslipDate(payslip.payStartDate)} - {formatPayslipDate(payslip.payEndDate)}
            </p>
            <p>
              <span className="font-medium">Payment Date:</span> {formatPayslipDate(payslip.paymentDate)}
            </p>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Note: This payslip is computer-generated, hence no signature is required.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayslipCard;