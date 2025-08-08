'use client';

import { useState } from 'react';
import { ServiceItemDto, CreateReservationDto, createReservation } from '@/lib/api';
import BookingForm from './BookingForm';
import ModernTimeSlotPicker from './ModernTimeSlotPicker';
import { useRouter } from 'next/navigation';

interface ServiceBookingFlowProps {
  service: ServiceItemDto;
}

export default function ServiceBookingFlow({ service }: ServiceBookingFlowProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [step, setStep] = useState<'date' | 'form'>('date');
  const router = useRouter();

  const handleDateSelect = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    if (date && time) {
      setStep('form');
    }
  };

  const handleFormSubmit = async (data: CreateReservationDto) => {
    try {
      const reservation = await createReservation(data);
      router.push(`/reservation/${reservation.id}`);
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Wystąpił błąd podczas tworzenia rezerwacji. Spróbuj ponownie.');
    }
  };

  const handleCancel = () => {
    if (step === 'form') {
      setStep('date');
      setSelectedTime('');
    } else {
      router.back();
    }
  };

  if (step === 'date') {
    return (
      <div className="max-w-4xl mx-auto">
        <ModernTimeSlotPicker 
          service={service}
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />
      </div>
    );
  }

  if (!selectedDate || !selectedTime) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Proszę wybrać termin wizyty.</p>
        <button
          onClick={() => setStep('date')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Wybierz termin
        </button>
      </div>
    );
  }

  return (
    <BookingForm
      service={service}
      selectedDate={selectedDate}
      selectedTime={selectedTime}
      onSubmit={handleFormSubmit}
      onCancel={handleCancel}
    />
  );
} 