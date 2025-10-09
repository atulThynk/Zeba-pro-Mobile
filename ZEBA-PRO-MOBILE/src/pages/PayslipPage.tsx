import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import HomeHeader from '../components/HomeHeader';
import PayslipCard from '../components/payslip/PayslipCard';
import { payslipService } from '../services/payslip-service';
import { toast } from '../hooks/use-toast';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { AxiosError } from 'axios';
import DotAnimation from '@/components/DotAnimation';

// Helper function to get last month's date
const getLastMonthDate = () => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return lastMonth;
};

const PayslipPage: React.FC = () => {
  // Initialize with last month's date
  const [date, setDate] = useState<Date>(getLastMonthDate());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get month and year from selected date
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  // Fetch payslip data based on selected month and year
  const { data: payslipData, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['payslip', month, year],
    queryFn: () => payslipService.getPayslipByMonthYear(month, year),
  });

  const handleSearch = () => {
    setIsCalendarOpen(false);
    refetch();
  };

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    // setIsCalendarOpen(false);
    // The useQuery will automatically refetch when the date changes due to the queryKey dependency
  };

  // Updated handleDownloadPayslip function with custom toast
  const handleDownloadPayslip = async () => {
    if (!payslipData) return;

    try {
      toast({
        description: "Your payslip download has started...",
        variant: "default",
        duration: 3000,
      });

      // Get the blob from the service
      const blob = await payslipService.downloadPayslipPDF(month, year);

      // Generate filename
      const filename = `Payslip-${format(date, "yyyy-MM")}.pdf`;

      // Check if running on native platform (iOS/Android)
      if (Capacitor.isNativePlatform()) {
        try {
          // Convert blob to base64
          const base64Data = await convertBlobToBase64(blob);

          // Save file using Capacitor Filesystem
          const result = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents, // or Directory.External for Android Downloads folder
          });

          console.log('File saved at:', result.uri);

          // Option 1: Share the file (recommended for better UX)
          await Share.share({
            title: 'Payslip',
            text: `Payslip for ${format(date, "MMMM yyyy")}`,
            url: result.uri,
          });

          toast({
            description: "Payslip saved and shared successfully!",
            variant: "default",
            duration: 5000,
          });
        } catch (capacitorError) {
          console.error('Capacitor file operation failed:', capacitorError);

          // Fallback to web download
          fallbackWebDownload(blob, filename);
        }
      } else {
        // Running in browser - use standard web download
        fallbackWebDownload(blob, filename);
      }
    } catch (error) {
      console.error('Error downloading payslip:', error);

      let errorMessage = "Failed to download payslip. Please try again later.";

      if (error instanceof Error) {
        if (error.message.includes('Failed to download PDF')) {
          errorMessage = "Unable to generate payslip. Please contact HR.";
        } else if (error.message.includes('empty')) {
          errorMessage = "Payslip file is empty. Please contact HR.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }

      toast({
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  // Helper function to convert blob to base64
  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Fallback web download for browser testing
  const fallbackWebDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      description: "Payslip downloaded to your Downloads folder.",
      variant: "default",
      duration: 5000,
    });
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding-bottom">
        <div className="flex-1 bg-white text-gray-800">
         
          <main className="p-4 max-w-4xl mx-auto pb-32">
            <div className="mb-6">
              <h1 className="text-2xl font-medium text-black">Payslips</h1>
              <p className="text-gray-500">Access and download your monthly payslips</p>
            </div>

            <div className="bg-white rounded-xl mb-6 flex flex-col w-full">
              <div className="w-full">
                <p className="text-sm text-gray-500 mb-1">Select Month and Year</p>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-100 border-gray-200",
                        !date && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#0E4880]" />
                      {date ? format(date, "MMMM yyyy") : <span>Select month</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full max-w-[100%] p-0" align="start">
                    <div className="p-3 bg-white border-white w-full">
                      <div className="flex flex-col space-y-3 w-full">
                        <div className="grid grid-cols-3 gap-2 w-full">
                          <select
                            value={date.getMonth()}
                            onChange={(e) => {
                              const newDate = new Date(date);
                              newDate.setMonth(parseInt(e.target.value));
                              handleDateChange(newDate);
                            }}
                            className="text-black p-2 border border-gray-200 rounded text-sm w-full"
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i} value={i}>
                                {format(new Date(2000, i, 1), 'MMM')}
                              </option>
                            ))}
                          </select>
                          <select
                            value={date.getFullYear()}
                            onChange={(e) => {
                              const newDate = new Date(date);
                              newDate.setFullYear(parseInt(e.target.value));
                              handleDateChange(newDate);
                            }}
                            className="col-span-2 text-black p-2 border border-gray-200 rounded text-sm w-full"
                          >
                            {Array.from({ length: 10 }, (_, i) => (
                              <option key={i} value={new Date().getFullYear() - 5 + i}>
                                {new Date().getFullYear() - 5 + i}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          onClick={handleSearch}
                          disabled={isLoading || isFetching}
                          className="bg-gray-800 hover:bg-gray-700 rounded-xl text-white w-full"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          {isLoading || isFetching ? 'Searching...' : 'Search'}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {isLoading || isFetching ? (
              <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center py-8">
               <DotAnimation/>
                <p className="text-sm text-gray-500 mt-4">Loading payslip for {format(date, "MMMM yyyy")}...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center py-8">
                <p className="text-lg font-medium mb-4 text-red-500">
                  {(error instanceof AxiosError && error.response?.data?.message) || 'Failed to load payslip'}
                </p>
                {/* <p className="text-sm text-gray-500 text-center mb-4">
                  Unable to fetch payslip for {format(date, "MMMM yyyy")}. Please try again.
                </p> */}
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="text-sm"
                >
                  Try Again
                </Button>
              </div>
            ) : !payslipData ? (
              <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center justify-center py-8">
                <p className="text-lg font-medium mb-4 text-gray-600">No Payslip Available</p>
                <p className="text-sm text-gray-500 text-center">
                  No payslip found for {format(date, "MMMM yyyy")}.<br />
                  Please select a different month or contact HR for assistance.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <PayslipCard payslip={payslipData} />
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleDownloadPayslip}
                    className="bg-gray-800 rounded-xl hover:bg-gray-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Payslip
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PayslipPage;