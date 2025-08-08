'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfDay, isSameDay, addMinutes } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ServiceItemDto, DailySlotsDto, getAvailableSlots } from '@/lib/api';

interface ModernTimeSlotPickerProps {
  service: ServiceItemDto;
  onDateSelect: (date: Date, time: string) => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  onClose?: () => void;
  hideSummary?: boolean;
}



export default function ModernTimeSlotPicker({ 
  service, 
  onDateSelect, 
  selectedDate, 
  selectedTime,
  onClose,
  hideSummary = false
}: ModernTimeSlotPickerProps) {
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
    const today = new Date();
    const date = addDays(startOfDay(today), currentWeek * 7 + i);
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
    const today = startOfDay(new Date());
    const dateStart = startOfDay(date);
    const isInFuture = dateStart >= today;
    
    return slots && slots.status === 'AVAILABLE' && slots.slots.length > 0 && isInFuture;
  };

  const isDateSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  const getEndTime = (startTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = addMinutes(start, service.durationMin);
    return format(end, 'HH:mm');
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2).replace('.', ',')} zł`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {format(weekDays[0], 'MMMM yyyy', { locale: pl })}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentWeek(prev => prev - 1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="grid grid-cols-7 gap-2 flex-1 mx-4">
            {weekDays.map((date) => {
              const isAvailable = isDateAvailable(date);
              const isSelected = isDateSelected(date);
              const slots = getSlotsForDate(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`text-center p-3 rounded-lg cursor-pointer transition-colors ${
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
                    {format(date, 'd')}
                  </div>
                  {slots && slots.status === 'AVAILABLE' && slots.slots.length > 0 && (
                    <div className="w-full h-0.5 bg-green-500 mt-1"></div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentWeek(prev => prev + 1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selectedDate && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dostępne godziny
            </h3>
            <div className="flex space-x-2">
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
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
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {(() => {
                const slots = getSlotsForDate(selectedDate);
                if (!slots || slots.slots.length === 0) {
                  return (
                    <div className="text-gray-500 dark:text-gray-400 text-center w-full py-4">
                      Brak dostępnych terminów
                    </div>
                  );
                }
                
                return slots.slots.map((slot: { startTime: string }, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(selectedDate, slot.startTime)}
                    className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedTime === slot.startTime
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div>{slot.startTime}</div>
                    <div className="text-xs opacity-75">
                      {slot.startTime} - {getEndTime(slot.startTime)}
                    </div>
                  </button>
                ));
              })()}
            </div>
          )}
        </div>
      )}

      {selectedDate && selectedTime && (
        <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {service.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {service.description || 'Brak opisu'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {service.priceAfterDiscount!==undefined && service.priceAfterDiscount < service.price ? (
                  <>
                    <span className="line-through text-gray-500 dark:text-gray-400 text-sm">
                      {formatPrice(service.price)}
                    </span>
                    <span className="ml-2 text-green-600 dark:text-green-400">
                      {formatPrice(service.priceAfterDiscount)}
                    </span>
                  </>
                ) : (
                  formatPrice(service.price)
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div className="font-medium">{selectedTime} - {getEndTime(selectedTime)}</div>
                <div className="text-xs">Czas trwania: {service.durationMin} min</div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200">
              Zmień
            </button>
          </div>
        </div>
      )}

      {!hideSummary && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                Łącznie: {service.priceAfterDiscount!==undefined && service.priceAfterDiscount < service.price ? formatPrice(service.priceAfterDiscount) : formatPrice(service.price)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {service.durationMin} min
              </div>
            </div>
            <button
              onClick={() => selectedDate && selectedTime && handleDateSelect(selectedDate, selectedTime)}
              disabled={!selectedDate || !selectedTime}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Dalej
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 