'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { SalonDto } from '@/lib/api';

interface HeaderProps {
  salon: SalonDto;
}

export default function Header({ salon }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              {salon.name}
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Strona główna
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Kontakt
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {salon.contactInfo?.phone && (
              <a
                href={`tel:${salon.contactInfo.phone}`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <Phone className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{salon.contactInfo.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 