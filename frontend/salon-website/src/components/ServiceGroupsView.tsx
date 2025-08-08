'use client';

import { useState } from 'react';
import { ServiceGroupDto, ServiceItemDto } from '@/lib/api';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ServiceGroupsViewProps {
  serviceGroups: ServiceGroupDto[];
}

export default function ServiceGroupsView({ serviceGroups }: ServiceGroupsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleBookService = (service: ServiceItemDto) => {
    router.push(`/reservation/new?serviceId=${service.id}`);
  };

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const filteredGroups = serviceGroups.filter(group => {
    if (!searchTerm) return true;
    
    const groupMatches = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const serviceMatches = group.services.some(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return groupMatches || serviceMatches;
  });

  const formatPrice = (price: number) => {
    return `${price.toFixed(2).replace('.', ',')} zł`;
  };

  const formatDuration = (duration: number) => {
    return `${duration} min`;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usługi</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Szukaj usługi"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredGroups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.id);
          const hasServices = group.services.length > 0;
          
          return (
            <div key={group.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{group.name}</h2>
                  {hasServices && (
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                    </button>
                  )}
                </div>

              </div>

              {group.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{group.description}</p>
              )}

              {!isCollapsed && hasServices && (
                <div className="space-y-4">
                  {group.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{service.name}</h3>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {service.priceAfterDiscount && service.priceAfterDiscount < service.price ? (
                              <>
                                <span className="line-through text-gray-500 dark:text-gray-400 text-sm">
                                  {formatPrice(service.price)}
                                </span>
                                <span className="ml-2 text-green-600 dark:text-green-400 font-bold">
                                  {formatPrice(service.priceAfterDiscount)}
                                </span>
                                {service.discount && (
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    {service.discount}
                                  </span>
                                )}
                              </>
                            ) : (
                              formatPrice(service.price)
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDuration(service.durationMin)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleBookService(service)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                        >
                          Umów
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {searchTerm ? 'Nie znaleziono usług pasujących do wyszukiwania.' : 'Brak dostępnych usług w tej chwili.'}
          </p>
        </div>
      )}
    </div>
  );
} 