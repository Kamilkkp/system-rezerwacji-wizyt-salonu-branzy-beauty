'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ServiceItemDto, DailySlotsDto, getAvailableSlots } from '@/lib/api';

interface TimeSlotPickerProps {
  service: ServiceItemDto;
  onDateSelect: (date: Date, time: string) => void;
  selectedDate: Date | null;
  selectedTime: string | null;
}

export default function TimeSlotPicker({ 
  service, 
  onDateSelect, 
  selectedDate, 
  selectedTime 
}: TimeSlotPickerProps) {
  const [availableSlots, setAvailableSlots] = useState<DailySlotsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);

  useEffect(() => {
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfDay(new Date()), currentWeek * 7 + i);
      return date;
    });

    const fetchSlots = async () => {
      setLoading(true);
      try {
        const startDate = weekDays[0];
        const endDate = addDays(weekDays[6], 1);
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');
        
        const slots = await getAvailableSlots(
          service.id,
          startDateStr,
          endDateStr
        );
        
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Błąd podczas pobierania dostępnych terminów:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [service.id, currentWeek]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfDay(new Date()), currentWeek * 7 + i);
    return date;
  });

  const handleDateSelect = (date: Date, time: string) => {
    onDateSelect(date, time);
  };

  const getSlotsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slot = availableSlots.find(slot => slot.date === dateStr);
    
    return slot;
  };

  const isDateAvailable = (date: Date) => {
    const slots = getSlotsForDate(date);
    return slots && slots.status === 'AVAILABLE' && slots.slots.length > 0;
  };

  const isDateSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wybierz termin</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentWeek(prev => prev - 1)}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {format(weekDays[0], 'dd MMM', { locale: pl })} - {format(weekDays[6], 'dd MMM', { locale: pl })}
          </span>
          <button
            onClick={() => setCurrentWeek(prev => prev + 1)}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Ładowanie dostępnych terminów...</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const slots = getSlotsForDate(date);
            const isAvailable = isDateAvailable(date);
            const isSelected = isDateSelected(date);

            return (
              <div key={date.toISOString()} className="text-center">
                <div
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isAvailable
                      ? 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => isAvailable && handleDateSelect(date, '')}
                >
                  <div className="text-xs font-medium">
                    {format(date, 'EEE', { locale: pl })}
                  </div>
                  <div className="text-lg font-bold">
                    {format(date, 'dd')}
                  </div>
                  {slots && (
                    <div className="text-xs mt-1">
                      {slots.status === 'AVAILABLE' && slots.slots.length > 0 && (
                        <span className="text-green-600">✓</span>
                      )}
                      {slots.status === 'FULLY_BOOKED' && (
                        <span className="text-red-600">✗</span>
                      )}
                      {slots.status === 'CLOSED' && (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                  )}
                </div>

                {isSelected && slots && slots.slots.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Dostępne godziny:</h4>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-1">
                        {slots.slots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => handleDateSelect(date, slot.startTime)}
                            className={`text-xs p-1 rounded ${
                              selectedTime === slot.startTime
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {slot.startTime}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
        <p>• <span className="text-green-600">✓</span> - Dostępne terminy</p>
        <p>• <span className="text-red-600">✗</span> - Brak wolnych terminów</p>
        <p>• <span className="text-gray-500">—</span> - Salon zamknięty</p>
      </div>
    </div>
  );
} 