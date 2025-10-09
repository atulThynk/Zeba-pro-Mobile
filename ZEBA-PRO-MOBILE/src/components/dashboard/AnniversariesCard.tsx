import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wine } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { WorkAnniversary } from '@/services/dashboard-service';
import { Dot } from 'recharts';
import DotAnimation from '../DotAnimation';

interface AnniversariesCardProps {
  anniversaries: WorkAnniversary[];
  isLoading?: boolean;
}

const AnniversariesCard: React.FC<AnniversariesCardProps> = ({ anniversaries, isLoading }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part.charAt(0)).join('').toUpperCase();
  };

  const getNextAnniversaryInfo = (joiningDate: string) => {
    const joinDate = new Date(joiningDate);
    const today = new Date();
    let nextAnniversary = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
    if (nextAnniversary < today) {
      nextAnniversary = new Date(today.getFullYear() + 1, joinDate.getMonth(), joinDate.getDate());
    }
    const yearsToComplete = nextAnniversary.getFullYear() - joinDate.getFullYear();
    return { date: nextAnniversary, yearsToComplete };
  };

  const formatAnniversaryText = (anniversary: WorkAnniversary) => {
    const { date, yearsToComplete } = getNextAnniversaryInfo(anniversary.date);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const yearText = yearsToComplete === 1 ? 'year' : 'years';
    return `${day} ${month} • ${yearsToComplete} ${yearText} soon`;
  };

  if (isLoading) {
    return (
      <Card className="border border-[#e4e7eb] bg-white  mb-6">
        <CardHeader className="px-4 py-3 border-b border-gray-200 ">
          <CardTitle className="text-sm font-bold-300 flex items-center text-gray-900 ">
            Work Anniversary
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
          <div>Work Anniversary</div>
          <div className="text-xs text-gray-500 ">This Month</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {anniversaries.length > 0 ? (
          <div className="space-y-4">
            {anniversaries.map((anniversary) => (
              <div key={anniversary.userId} className="flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={anniversary.avatar ?? ""} alt={anniversary.name} />
                  <AvatarFallback className="bg-gray-200  text-gray-900 ">
                    {getInitials(anniversary.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-bold-300 text-gray-900 ">
                    {anniversary.name}
                  </p>
                  <p className="text-xs text-gray-600 ">
                    {formatAnniversaryText(anniversary)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[100px] flex flex-col items-center justify-center">
            <Wine size={40} className="text-[#D1E3FE]" />
            <p className="text-gray-400  text-sm">No work anniversary</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnniversariesCard;
