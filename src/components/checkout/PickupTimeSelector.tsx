// src/components/checkout/PickupTimeSelector.tsx
'use client';

import React from 'react';
import { OperatingHoursTakeaway } from '@/types';

interface PickupTimeSelectorProps {
  pickupTimeOption: 'ASAP' | 'SCHEDULED';
  onPickupTimeOptionChange: (option: 'ASAP' | 'SCHEDULED') => void;
  pickupTime: string;
  onPickupTimeChange: (time: string) => void;
  operatingHoursTakeaway?: OperatingHoursTakeaway;
}

const generateTimeOptions = (operatingHoursTakeaway?: OperatingHoursTakeaway, interval: number = 15) => {
  const now = new Date();
  
  if (!operatingHoursTakeaway) {
    return [];
  }

  // Get store hours for today
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()] as keyof typeof operatingHoursTakeaway.takeaway;
  const todayHours = operatingHoursTakeaway?.takeaway?.[currentDay];
  
  // If store is closed today or hours not set, return empty array
  if (!todayHours || todayHours.closed || !todayHours.close || todayHours.close.includes('null')) {
    return [];
  }
  
  // Parse closing time
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  const closingTime = new Date(now);
  closingTime.setHours(closeHour, closeMin, 0, 0);
  
  // Start time: 15 minutes from now, rounded up to nearest interval
  const startMs = now.getTime() + 15 * 60000;
  let startTime = new Date(startMs);
  
  const minutes = startTime.getMinutes();
  const remainder = minutes % interval;
  if (remainder !== 0) {
    startTime.setMinutes(minutes + (interval - remainder));
  }
  startTime.setSeconds(0);
  startTime.setMilliseconds(0);

  const options: string[] = [];
  let currentTime = new Date(startTime);

  // Generate times until closing time
  while (currentTime.getTime() < closingTime.getTime()) {
    const hour = String(currentTime.getHours()).padStart(2, '0');
    const minute = String(currentTime.getMinutes()).padStart(2, '0');
    options.push(`${hour}:${minute}`);
    
    currentTime = new Date(currentTime.getTime() + interval * 60000);
  }
  
  return options;
};

export const PickupTimeSelector = ({
  pickupTimeOption,
  onPickupTimeOptionChange,
  pickupTime,
  onPickupTimeChange,
  operatingHoursTakeaway
}: PickupTimeSelectorProps) => {
  const timeOptions = generateTimeOptions(operatingHoursTakeaway);

  return (
    <div>
      <h3 className="text-xl font-bold mb-4 text-gray-800">2. Pickup Time</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
          pickupTimeOption === 'ASAP' 
            ? 'border-blue-600 bg-blue-50' 
            : 'border-gray-200 hover:border-blue-100'
        }`}>
          <input
            type="radio"
            name="pickupTimeOption"
            value="ASAP"
            checked={pickupTimeOption === 'ASAP'}
            onChange={() => onPickupTimeOptionChange('ASAP')}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <div>
            <div className="font-semibold text-gray-900">ASAP (Estimated 15-25 min)</div>
            <div className="text-sm text-gray-500">Fastest available pickup.</div>
          </div>
        </label>
        
        <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
          pickupTimeOption === 'SCHEDULED' 
            ? 'border-blue-600 bg-blue-50' 
            : 'border-gray-200 hover:border-blue-100'
        }`}>
          <input
            type="radio"
            name="pickupTimeOption"
            value="SCHEDULED"
            checked={pickupTimeOption === 'SCHEDULED'}
            onChange={() => onPickupTimeOptionChange('SCHEDULED')}
            className="mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <div>
            <div className="font-semibold text-gray-900">Schedule Pickup</div>
            <div className="text-sm text-gray-500">Choose a specific time.</div>
          </div>
        </label>
      </div>
      
      {pickupTimeOption === 'SCHEDULED' && (
        <div className="mt-4">
          <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700">Select Time</label>
          {timeOptions.length > 0 ? (
            <select
              id="pickupTime"
              name="pickupTime"
              value={pickupTime}
              onChange={(e) => onPickupTimeChange(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border-0 bg-gray-100 p-3 text-gray-900 shadow-inner focus:ring-2 focus:ring-blue-500 transition duration-150"
            >
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          ) : (
            <div className="mt-1 block w-full rounded-xl border-0 bg-red-50 p-3 text-red-700 text-sm">
              No scheduled pickup times available. Store closes soon. Please select ASAP.
            </div>
          )}
        </div>
      )}
    </div>
  );
};