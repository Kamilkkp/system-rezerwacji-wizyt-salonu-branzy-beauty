'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { salonAPI } from '@/lib/api';
import { SalonItemDto } from '@/types';
import { useAuth } from './AuthContext';

interface SalonContextType {
  salons: SalonItemDto[];
  activeSalon: SalonItemDto | null;
  setActiveSalon: (salon: SalonItemDto | null) => void;
  loading: boolean;
  error: string | null;
  refreshSalons: () => Promise<void>;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export function SalonProvider({ children }: { children: ReactNode }) {
  const [salons, setSalons] = useState<SalonItemDto[]>([]);
  const [activeSalon, setActiveSalon] = useState<SalonItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();


  const setActiveSalonAndPersist = (salon: SalonItemDto | null) => {
    setActiveSalon(salon);
    if (typeof window !== 'undefined') {
      if (salon) {
        localStorage.setItem('activeSalonId', salon.id);
      } else {
        localStorage.removeItem('activeSalonId');
      }
    }
  };

  const loadSalons = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const response = await salonAPI.getAllSalons();
      const userSalons = response.data;
      setSalons(userSalons);

      if (userSalons.length > 0) {
        let foundSalon = null;
        const savedSalonId = typeof window !== 'undefined' ? localStorage.getItem('activeSalonId') : null;
        if (savedSalonId) {
          foundSalon = userSalons.find(s => s.id === savedSalonId);
        }
        if (foundSalon) {
          setActiveSalon(foundSalon);
        } else {
          setActiveSalon(userSalons[0]);
        }
      } else {
        setActiveSalon(null);
        setTimeout(() => {
          router.push('/bms/salons/new');
        }, 0);
      }
    } catch (err) {
      console.error('Failed to load salons:', err);
      setError('Failed to load salons');
    } finally {
      setLoading(false);
    }
  };

  const refreshSalons = async () => {
    await loadSalons();
  };

  useEffect(() => {
    if (user) {
      loadSalons();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && salons.length === 0 && !error) {
      setTimeout(() => {
        router.push('/bms/salons/new');
      }, 0);
    }
  }, [loading, salons.length, error, router]);

  return (
    <SalonContext.Provider value={{ 
      salons, 
      activeSalon, 
      setActiveSalon: setActiveSalonAndPersist, 
      loading, 
      error, 
      refreshSalons 
    }}>
      {children}
    </SalonContext.Provider>
  );
}

export function useSalon() {
  const context = useContext(SalonContext);
  if (context === undefined) {
    throw new Error('useSalon must be used within a SalonProvider');
  }
  return context;
} 