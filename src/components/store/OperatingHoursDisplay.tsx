// src/components/store/OperatingHoursDisplay.tsx
import React from 'react';
import { ClockIcon, PackageIcon } from 'lucide-react';
import { OperatingHoursTakeaway, OperatingHoursDelivery, DayHours } from '@/types';

interface OperatingHoursDisplayProps {
  operatingHoursTakeaway?: OperatingHoursTakeaway;
  operatingHoursDelivery?: OperatingHoursDelivery;
}

export const OperatingHoursDisplay = ({ 
  operatingHoursTakeaway, 
  operatingHoursDelivery 
}: OperatingHoursDisplayProps) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const formatHours = (dayHours: DayHours | undefined) => {
    if (!dayHours || dayHours.closed) {
      return 'Closed';
    }
    if (!dayHours.open || !dayHours.close) {
      return 'Hours not set';
    }
    return `${dayHours.open} - ${dayHours.close}`;
  };

  const getCurrentDay = () => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  };

  const currentDayIndex = getCurrentDay();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
      {/* Takeaway Hours */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
          <PackageIcon className="h-5 w-5 mr-2" />
          Takeaway Hours
        </h4>
        <div className="space-y-2">
          {days.map((day, index) => {
            const dayHours = operatingHoursTakeaway?.takeaway?.[day as keyof typeof operatingHoursTakeaway.takeaway];
            const isToday = index === currentDayIndex;
            
            return (
              <div 
                key={`takeaway-${day}`} 
                className={`flex justify-between items-center py-2 px-3 rounded-lg transition-colors ${
                  isToday 
                    ? 'bg-white shadow-sm border-2 border-gray-200 font-semibold' 
                    : 'hover:bg-white hover:bg-opacity-50'
                }`}
              >
                <span className="text-gray-700 font-medium">{dayLabels[index]}:</span>
                <span className={`font-medium ${
                  !dayHours || dayHours.closed 
                    ? 'text-red-600' 
                    : 'text-gray-900'
                }`}>
                  {formatHours(dayHours)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Hours */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Delivery Hours
        </h4>
        <div className="space-y-2">
          {days.map((day, index) => {
            const dayHours = operatingHoursDelivery?.delivery?.[day as keyof typeof operatingHoursDelivery.delivery];
            const isToday = index === currentDayIndex;
            
            return (
              <div 
                key={`delivery-${day}`} 
                className={`flex justify-between items-center py-2 px-3 rounded-lg transition-colors ${
                  isToday 
                    ? 'bg-white shadow-sm border-2 border-gray-200 font-semibold' 
                    : 'hover:bg-white hover:bg-opacity-50'
                }`}
              >
                <span className="text-gray-700 font-medium">{dayLabels[index]}:</span>
                <span className={`font-medium ${
                  !dayHours || dayHours.closed 
                    ? 'text-red-600' 
                    : 'text-gray-900'
                }`}>
                  {formatHours(dayHours)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};