'use client';

import { useState } from 'react';
import { cancelReservation, changeReservationTime, ReservationDto, getService, ServiceItemDto } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import ModernTimeSlotPicker from './ModernTimeSlotPicker';

interface ReservationActionsProps {
  reservation: ReservationDto;
}

export default function ReservationActions({ reservation }: ReservationActionsProps) {
  const [cancelling, setCancelling] = useState(false);
  const [changingTime, setChangingTime] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [service, setService] = useState<ServiceItemDto | null>(null);
  const [loadingService, setLoadingService] = useState(false);

  const handleCancelReservation = async () => {
    setCancelling(true);
    try {
      await cancelReservation(reservation.id);
      toast.success('Rezerwacja została anulowana');
      window.location.reload();
    } catch (error) {
      console.error('Błąd podczas anulowania rezerwacji:', error);
      toast.error('Nie udało się anulować rezerwacji');
    } finally {
      setCancelling(false);
    }
  };

  const handleChangeTime = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Proszę wybrać nowy termin');
      return;
    }

    setChangingTime(true);
    try {
      const newStartTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      newStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const formattedStartTime = format(newStartTime, "yyyy-MM-dd'T'HH:mm");
      await changeReservationTime(reservation.id, formattedStartTime);
      toast.success('Termin rezerwacji został zmieniony');
      window.location.reload();
    } catch (error) {
      console.error('Błąd podczas zmiany terminu:', error);
      toast.error('Nie udało się zmienić terminu rezerwacji');
    } finally {
      setChangingTime(false);
    }
  };

  const handleDateSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const openTimeModal = async () => {
    setShowTimeModal(true);
    setSelectedDate(null);
    setSelectedTime('');
    
    if (!service && !loadingService) {
      setLoadingService(true);
      try {
        const serviceData = await getService(reservation.serviceId);
        setService(serviceData);
      } catch (error) {
        console.error('Błąd podczas pobierania danych usługi:', error);
        toast.error('Nie udało się pobrać danych usługi');
      } finally {
        setLoadingService(false);
      }
    }
  };

  return (
    <>
      <div className="flex justify-center space-x-4">
        {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
          <>
            <button
              onClick={openTimeModal}
              className="bg-yellow-600 text-white px-6 py-3 rounded-md hover:bg-yellow-700 transition-colors font-medium"
            >
              Zmień termin
            </button>
            <button
              onClick={handleCancelReservation}
              disabled={cancelling}
              className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {cancelling ? 'Anuluję...' : 'Anuluj rezerwację'}
            </button>
          </>
        )}
        
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Zarezerwuj kolejną wizytę
        </Link>
      </div>

      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Zmień termin rezerwacji</h2>
                <button
                  onClick={() => setShowTimeModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {loadingService ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-600 dark:text-gray-300">Ładowanie danych usługi...</div>
                </div>
              ) : service ? (
                <ModernTimeSlotPicker
                  service={service}
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onClose={() => setShowTimeModal(false)}
                  hideSummary={true}
                />
              ) : (
                <div className="flex justify-center items-center py-8">
                  <div className="text-red-600 dark:text-red-400">Nie udało się załadować danych usługi</div>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setShowTimeModal(false)}
                  className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleChangeTime}
                  disabled={!selectedDate || !selectedTime || changingTime}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {changingTime ? 'Zmieniam...' : 'Zmień termin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 