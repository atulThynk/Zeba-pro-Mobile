import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Birthday } from '@/services/dashboard-service';
import { Cake, CakeSlice } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, getInitials } from '@/lib/utils';
import { Dot } from 'recharts';
import DotAnimation from '../DotAnimation';

interface BirthdaysCardProps {
  birthdays: Birthday[];
  isLoading?: boolean;
}

const BirthdaysCard: React.FC<BirthdaysCardProps> = ({ birthdays, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="border border-[#e4e7eb] bg-white  mb-6">
        <CardHeader className="px-4 py-3 border-b border-gray-200 ">
          <CardTitle className="text-sm font-bold-300 flex justify-between items-center text-gray-900 ">
            {/* <CakeSlice size={16} className="mr-2" /> */}
            
            <div>
            
            Birthdays
          </div>
          <div className="text-xs text-gray-500 ">
            This Month
          </div>
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
    <Card className="border border-[#e4e7eb] bg-white  mb-6">
      <CardHeader className="px-4 py-3 border-b border-gray-200 ">
        <CardTitle className="text-sm font-bold-300 flex justify-between items-center text-gray-900 ">
           <div>
            Birthdays
          </div>
          <div className="text-xs text-gray-500 ">
            This Month
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {birthdays.length > 0 ? (
          <div className="space-y-4">
            {birthdays.map((birthday) => (
              <div key={birthday.userId} className="flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={birthday.avatar} alt={birthday.name} />
                  <AvatarFallback className="bg-gray-200  text-gray-900 ">
                    {getInitials(birthday.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-bold-300 text-gray-900 ">{birthday.name}</p>
                  <p className="text-xs text-gray-600 ">
                    {formatDate(new Date(birthday.date))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[100px] flex flex-col items-center justify-center">
            <CakeSlice size={40} className='text-[#D1E3FE]' /> 
            <p className="text-gray-600 text-sm">No birthdays</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BirthdaysCard;