'use client';

import { ServiceItemDto } from '@/lib/api';

interface ServiceCardProps {
  service: ServiceItemDto;
  onSelect: (service: ServiceItemDto) => void;
}

export default function ServiceCard({ service, onSelect }: ServiceCardProps) {
  const hasDiscount = service.priceAfterDiscount!==undefined && service.priceAfterDiscount < service.price;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
        <div className="text-right">
          {hasDiscount ? (
            <div>
              <span className="text-sm text-gray-500 line-through">{service.price} zł</span>
              <div className="text-xl font-bold text-green-600">{service.priceAfterDiscount} zł</div>
            </div>
          ) : (
            <div className="text-xl font-bold text-gray-900">{service.price} zł</div>
          )}
        </div>
      </div>
      
      {service.description && (
        <p className="text-gray-600 mb-4">{service.description}</p>
      )}
      
      {hasDiscount && (
        <div className="mb-4">
          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            {service.discount}
          </span>
        </div>
      )}
      
      <button
        onClick={() => onSelect(service)}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
      >
        Zarezerwuj
      </button>
    </div>
  );
} 