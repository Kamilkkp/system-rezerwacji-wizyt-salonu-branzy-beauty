import { Suspense } from 'react';
import { getSalon, getServiceGroups, getServiceGroup } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceBookingFlow from '@/components/ServiceBookingFlow';
import { notFound } from 'next/navigation';

interface NewReservationPageProps {
  searchParams: Promise<{ serviceId?: string }>;
}

async function NewReservationPageContent({ searchParams }: NewReservationPageProps) {
  const { serviceId } = await searchParams;
  
  if (!serviceId) {
    notFound();
  }

  try {
    const salon = await getSalon();
    
    const groups = await getServiceGroups();
    
    let selectedService = null;
    
    for (const group of groups) {
      const groupDetails = await getServiceGroup(group.id);
      const service = groupDetails.services.find(s => s.id === serviceId);
      if (service) {
        selectedService = service;
        break;
      }
    }
    
    if (!selectedService) {
      notFound();
    }

    return (
      <>
        <Header salon={salon} />
        
        <main className="py-16 bg-gray-50 dark:bg-gray-800 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Rezerwacja usługi
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Wybrana usługa: <span className="font-semibold">{selectedService.name}</span>
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              <ServiceBookingFlow service={selectedService} />
            </div>
          </div>
        </main>

        <Footer salon={salon} />
      </>
    );
  } catch (error) {
    console.error('Error loading service:', error);
    notFound();
  }
}

export default function NewReservationPage({ searchParams }: NewReservationPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <NewReservationPageContent searchParams={searchParams} />
    </Suspense>
  );
} 