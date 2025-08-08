'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ServiceItemDto, CreateReservationDto } from '@/lib/api';
import { Calendar, Clock, User, Mail, Phone, MessageSquare } from 'lucide-react';

const bookingSchema = z.object({
  clientName: z.string().min(1, 'Imię jest wymagane').max(30, 'Imię może mieć maksymalnie 30 znaków'),
  clientEmail: z.string().email('Nieprawidłowy adres email'),
  clientPhone: z.string().min(1, 'Telefon jest wymagany'),
  clientNotes: z.string().optional(),
  marketingConsent: z.boolean(),
  notificationsConsent: z.boolean(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  service: ServiceItemDto;
  selectedDate: Date;
  selectedTime: string;
  onSubmit: (data: CreateReservationDto) => Promise<void>;
  onCancel: () => void;
}

export default function BookingForm({ 
  service, 
  selectedDate, 
  selectedTime, 
  onSubmit, 
  onCancel 
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      marketingConsent: false,
      notificationsConsent: true,
    },
  });

  const handleFormSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    try {
      const startTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const reservationData: CreateReservationDto = {
        serviceId: service.id,
        startTime: startTime.toISOString(),
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        clientNotes: data.clientNotes || '',
        promotionId: service.promotionId, 
        marketingConsent: data.marketingConsent,
        notificationsConsent: data.notificationsConsent,
      };

      await onSubmit(reservationData);
    } catch (error) {
      console.error('Błąd podczas rezerwacji:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Rezerwacja wizyty</h2>
      
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{service.name}</h3>
        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{selectedDate.toLocaleDateString('pl-PL')}</span>
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
          <Clock className="h-4 w-4 mr-2" />
          <span>{selectedTime}</span>
        </div>
        <div className="text-lg font-bold text-gray-900 dark:text-white">
          {(service.priceAfterDiscount!==undefined && service.priceAfterDiscount < service.price) ? (
            <span>
              <span className="line-through text-gray-500 dark:text-gray-400">{service.price} zł</span>
              <span className="ml-2 text-green-600 dark:text-green-400">{service.priceAfterDiscount} zł</span>
            </span>
          ) : (
            <span>{service.price} zł</span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <User className="h-4 w-4 inline mr-1" />
            Imię i nazwisko
          </label>
          <input
            type="text"
            {...register('clientName')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Wprowadź swoje imię"
          />
          {errors.clientName && (
            <p className="text-red-600 text-sm mt-1">{errors.clientName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Mail className="h-4 w-4 inline mr-1" />
            Email
          </label>
          <input
            type="email"
            {...register('clientEmail')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="twoj@email.com"
          />
          {errors.clientEmail && (
            <p className="text-red-600 text-sm mt-1">{errors.clientEmail.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Phone className="h-4 w-4 inline mr-1" />
            Telefon
          </label>
          <input
            type="tel"
            {...register('clientPhone')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="123 456 789"
          />
          {errors.clientPhone && (
            <p className="text-red-600 text-sm mt-1">{errors.clientPhone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <MessageSquare className="h-4 w-4 inline mr-1" />
            Dodatkowe informacje (opcjonalnie)
          </label>
          <textarea
            {...register('clientNotes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Dodatkowe uwagi lub informacje..."
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('notificationsConsent')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Wyrażam zgodę na otrzymywanie powiadomień o wizytach
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('marketingConsent')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Wyrażam zgodę na otrzymywanie informacji marketingowych
            </span>
          </label>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Rezerwuję...' : 'Zarezerwuj'}
          </button>
        </div>
      </form>
    </div>
  );
} 