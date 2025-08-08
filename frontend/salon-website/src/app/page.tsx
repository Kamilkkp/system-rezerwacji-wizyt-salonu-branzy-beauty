import { getSalon, getAllServicesWithGroups,  } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceGroupsView from '@/components/ServiceGroupsView';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const salon = await getSalon();
  const serviceGroups = await getAllServicesWithGroups();

  return (
    <>
      <Header salon={salon} />
      
      <main>
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">O nas</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {salon.aboutUs}
              </p>
            </div>
          </div>
        </section>

        <section id="services" className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ServiceGroupsView 
              serviceGroups={serviceGroups} 
            />
          </div>
        </section>

      </main>

      <Footer salon={salon} />
    </>
  );
}
