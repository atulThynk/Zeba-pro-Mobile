import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Holiday } from '@/services/dashboard-service';
import { Calendar, Lock, PartyPopper } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import DotAnimation from '../DotAnimation';

interface HolidaysCardProps {
  holidays: Holiday[];
  isLoading?: boolean;
}

const HolidaysCard: React.FC<HolidaysCardProps> = ({ holidays, isLoading }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const isTenantOnFreePlan = userData?.isTenantOnFreePlan;

  const handleLockClick = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000); // Hide after 2 seconds
  };

  if (isLoading) {
    return (
      <Card className="border border-[#e4e7eb] bg-white  mb-6">
        <CardHeader className="px-4 py-3 border-b border-gray-200 ">
          <CardTitle className="text-sm font-semibold flex justify-between items-center text-gray-900 ">
            <div>Holidays</div>
            <div className="text-xs text-gray-500 ">This Month</div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[100px] flex items-center justify-center">
          <DotAnimation/>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-[#e4e7eb] bg-white  mb-6 relative">
      <CardHeader className="px-4 py-3 border-b border-gray-200 ">
        <CardTitle className="text-sm font-semibold flex justify-between items-center text-gray-900 ">
          <div> Holidays</div>
          <div className="text-xs text-gray-500 ">This Month</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isTenantOnFreePlan ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-lg border border-gray-200/50">
            <button
              className="group flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200/50 hover:border-gray-300 relative"
              onClick={handleLockClick}
            >
              <LucideIcons.LockKeyhole className="text-gray-600 group-hover:text-gray-100 transition-colors duration-200" size={20} />
              {showTooltip && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg">
                  Premium Feature
                </div>
              )}
            </button>
          </div>
        ) : holidays.length > 0 ? (
          <div className="space-y-3">
            {holidays.map((holiday) => {
              const Icon = LucideIcons.PartyPopper; // Fallback if not found
              const iconColor = holiday.colorCode || '#22c55e'; // Fallback to green-500

              return (
                <div key={holiday.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center">
                    <Icon size={20} className="mr-2" style={{ color: iconColor }} />
                    <span className="text-sm text-gray-900 ">{holiday.name}</span>
                  </div>
                  <span className="text-xs text-gray-600 ">
                    {formatDate(new Date(holiday.date))}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[100px] flex flex-col items-center justify-center">
            <Calendar size={40} className="text-[#D1E3FE]" />
            <p className="text-gray-600  text-sm">No holidays</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HolidaysCard;