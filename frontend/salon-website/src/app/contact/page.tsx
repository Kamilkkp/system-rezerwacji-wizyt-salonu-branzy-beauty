import { Suspense } from 'react';
import { getSalon } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function ContactPageContent() {
  const salon = await getSalon();

  const address = salon.address ? 
    `${salon.address.streetName} ${salon.address.streetNumber}, ${salon.address.postalCode} ${salon.address.city}` : 
    '';
  
  const googleMapsUrl = address ? 
    `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(address)}` : 
    '';

  return (
    <>
      <Header salon={salon} />
      
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Skontaktuj się z nami
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Jesteśmy tutaj, aby odpowiedzieć na Twoje pytania i pomóc w rezerwacji wizyty
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Informacje kontaktowe</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {salon.contactInfo?.phone && (
                <div className="flex items-start">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 mr-4">
                    <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Telefon</h3>
                    <a
                      href={`tel:${salon.contactInfo.phone}`}
                      className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                    >
                      {salon.contactInfo.phone}
                    </a>
                  </div>
                </div>
              )}
              
              {salon.contactInfo?.email && (
                <div className="flex items-start">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 mr-4">
                    <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
                    <a
                      href={`mailto:${salon.contactInfo.email}`}
                      className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                    >
                      {salon.contactInfo.email}
                    </a>
                  </div>
                </div>
              )}
              
              {salon.address && (
                <div className="flex items-start">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 mr-4">
                    <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Adres</h3>
                    <div className="text-gray-600 dark:text-gray-300">
                      <div>{salon.address.streetName} {salon.address.streetNumber}</div>
                      {salon.address.apartment && <div>Lokal {salon.address.apartment}</div>}
                      <div>{salon.address.postalCode} {salon.address.city}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 mr-4">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Godziny otwarcia</h3>
                  <div className="text-gray-600 dark:text-gray-300 space-y-1">
                    {salon.openHours.map((hours) => (
                      <div key={hours.dayOfWeek} className="flex justify-between">
                        <span>{getDayName(hours.dayOfWeek)}</span>
                        <span>{hours.open} - {hours.close}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">Lokalizacja</h3>
              {googleMapsUrl ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                  <iframe
                    src={googleMapsUrl}
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Lokalizacja salonu"
                  ></iframe>
                </div>
              ) : (
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">Brak danych adresowych do wyświetlenia mapy</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer salon={salon} />
    </>
  );
}

function getDayName(day: string): string {
  const days: Record<string, string> = {
    MON: 'Poniedziałek',
    TUE: 'Wtorek',
    WED: 'Środa',
    THU: 'Czwartek',
    FRI: 'Piątek',
    SAT: 'Sobota',
    SUN: 'Niedziela',
  };
  return days[day] || day;
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <ContactPageContent />
    </Suspense>
  );
} 