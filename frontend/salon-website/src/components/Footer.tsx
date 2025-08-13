'use client';

import { Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import { SalonDto } from '@/lib/api';

interface FooterProps {
  salon: SalonDto;
}

export default function Footer({ salon }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-4">Kontakt</h4>
            <div className="space-y-2">
              {salon.contactInfo?.phone && (
                <div className="flex items-center text-gray-300">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href={`tel:${salon.contactInfo.phone}`} className="hover:text-white">
                    {salon.contactInfo.phone}
                  </a>
                </div>
              )}
              {salon.contactInfo?.email && (
                <div className="flex items-center text-gray-300">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href={`mailto:${salon.contactInfo.email}`} className="hover:text-white">
                    {salon.contactInfo.email}
                  </a>
                </div>
              )}
              {salon.address && (
                <div className="flex items-start text-gray-300">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                  <div>
                    <div>{salon.address.streetName} {salon.address.streetNumber}</div>
                    {salon.address.apartment && <div>Lokal {salon.address.apartment}</div>}
                    <div>{salon.address.postalCode} {salon.address.city}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Godziny otwarcia</h4>
            <div className="space-y-1 text-gray-300">
              {salon.openHours.map((hours) => (
                <div key={hours.dayOfWeek} className="flex justify-between">
                  <span>{getDayName(hours.dayOfWeek)}</span>
                  <span>{hours.open} - {hours.close}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-4">Social Media</h4>
              <div className="flex space-x-4">
                {salon.contactInfo?.instagramUrl && (
                  <a
                    href={salon.contactInfo.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                )}
                {salon.contactInfo?.facebookUrl && (
                  <a
                    href={salon.contactInfo.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} {salon.name}. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
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