import { Suspense } from 'react';
import { getSalon, getReservation } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Clock, User, Mail, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import ReservationActions from '@/components/ReservationActions';

interface ReservationPageProps {
  params: Promise<{ id: string }>;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'text-green-600';
    case 'PENDING':
      return 'text-yellow-600';
    case 'CANCELLED':
      return 'text-red-600';
    case 'COMPLETED':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'PENDING':
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    case 'CANCELLED':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'COMPLETED':
      return <CheckCircle className="h-5 w-5 text-blue-600" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-600" />;
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'Potwierdzona';
    case 'PENDING':
      return 'Oczekująca';
    case 'CANCELLED':
      return 'Anulowana';
    case 'COMPLETED':
      return 'Zakończona';
    default:
      return status;
  }
}

async function ReservationPageContent({ params }: ReservationPageProps) {
  const { id } = await params;
  
  try {
    const [salon, reservation] = await Promise.all([
      getSalon(),
      getReservation(id)
    ]);

    const startDate = new Date(reservation.startTime);
    const endDate = new Date(reservation.endTime);

    return (
      <>
        <Header salon={salon} />
        
        <main className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Szczegóły rezerwacji
                </h1>
                <div className="flex items-center justify-center space-x-2">
                  {getStatusIcon(reservation.status)}
                  <span className={`font-semibold ${getStatusColor(reservation.status)}`}>
                    {getStatusText(reservation.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Szczegóły usługi</h2>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Usługa:</span>
                      <p className="text-gray-900">{reservation.serviceName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Salon:</span>
                      <p className="text-gray-900">{reservation.salonName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Cena:</span>
                      <p className="text-gray-900">
                        {reservation.promotion ? (
                          <>
                            <span className="line-through text-gray-500 text-sm">
                              {reservation.promotion.type === 'PERCENTAGE' 
                                ? (reservation.price / (1 - reservation.promotion.value / 100)).toFixed(2)
                                : (reservation.price + reservation.promotion.value).toFixed(2)} zł
                            </span>
                            <span className="ml-2 text-green-600 font-bold">
                              {reservation.price} zł
                            </span>
                            <span className="ml-2 text-xs text-green-600">
                              {reservation.promotion.type === 'PERCENTAGE' 
                                ? `-${reservation.promotion.value}%` 
                                : `-${reservation.promotion.value}zł`}
                            </span>
                          </>
                        ) : (
                          `${reservation.price} zł`
                        )}
                      </p>
                    </div>
                    {reservation.promotion && (
                      <div>
                        <span className="font-medium text-gray-700">Promocja:</span>
                        <p className="text-gray-900">{reservation.promotion.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Termin wizyty</h2>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-gray-900">
                        {format(startDate, 'EEEE, dd MMMM yyyy', { locale: pl })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-gray-900">
                        {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Dane kontaktowe</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-gray-900">{reservation.clientName}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-gray-900">{reservation.clientEmail}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-gray-900">{reservation.clientPhone}</span>
                  </div>
                </div>
                {reservation.clientNotes && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Dodatkowe informacje:</span>
                    <p className="text-gray-900 mt-1">{reservation.clientNotes}</p>
                  </div>
                )}
              </div>
              <ReservationActions reservation={reservation} />
            </div>
          </div>
        </main>

        <Footer salon={salon} />
      </>
    );
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Błąd</h1>
          <p className="text-gray-600">Nie udało się załadować danych rezerwacji</p>
        </div>
      </div>
    );
  }
}

export default function ReservationPage({ params }: ReservationPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <ReservationPageContent params={params} />
    </Suspense>
  );
} 