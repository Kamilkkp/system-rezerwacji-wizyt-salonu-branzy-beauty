import axios from 'axios';
import https from 'https';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const SALON_ID = process.env.NEXT_PUBLIC_SALON_ID;

const isServer = typeof window === 'undefined';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(isServer ? {
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
  } : {}),
});

if (typeof window !== 'undefined') {
  api.defaults.headers.common['Origin'] = window.location.origin;
}



export interface SalonDto {
  id: string;
  name: string;
  aboutUs: string;
  address: AddressDto | null;
  contactInfo: ContactInfoDto | null;
  openHours: OpenHoursDto[];
  slotStepMin: number;
  createdAt: string;
  updatedAt: string;
  frontendUrl: string | null;
  calendarId: string | null;
}

export interface AddressDto {
  city: string;
  streetName: string;
  streetNumber: string;
  apartment: string | null;
  postalCode: string;
}

export interface ContactInfoDto {
  phone: string;
  email: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
}

export interface OpenHoursDto {
  dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  open: string;
  close: string;
}

export interface ServiceGroupDto {
  status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  id: string;
  name: string;
  description: string | null;
  services: ServiceItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceItemDto {
  status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceAfterDiscount?: number;
  discount?: string;
  promotionId?: string; 
  durationMin: number;
}

export interface ItemDto {
  id: string;
  name: string;
}

export interface ReservationDto {
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  serviceId: string;
  salonName: string;
  price: number;
  promotion?: PromotionDto;
}

export interface CreateReservationDto {
  serviceId: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientNotes: string;
  promotionId?: string;
  marketingConsent: boolean;
  notificationsConsent: boolean;
}

export interface PromotionDto {
  status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  id: string;
  name: string;
  serviceGroups: ItemDto[];
  services: ItemDto[];
  value: number;
  startTime: string;
  endTime: string | null;
}

export interface TimeSlotDto {
  startTime: string;
  endTime: string;
  value: string;
}

export interface DailySlotsDto {
  date: string;
  status: 'AVAILABLE' | 'FULLY_BOOKED' | 'CLOSED';
  slots: TimeSlotDto[];
}

export const getSalon = async (): Promise<SalonDto> => {
  const response = await api.get(`/public/salons/${SALON_ID}`);
  return response.data;
};

export const getServiceGroups = async (): Promise<ItemDto[]> => {
  const response = await api.get(`/public/salons/${SALON_ID}/service-groups`);
  return response.data;
};

export const getAllServicesWithGroups = async (): Promise<ServiceGroupDto[]> => {
  const response = await api.get(`/public/salons/${SALON_ID}/service-groups`);
  const groups = response.data;
  
  const detailedGroups = await Promise.all(
    groups.map(async (group: ItemDto) => {
      return await getServiceGroup(group.id);
    })
  );
  
  return detailedGroups;
};

export const getServiceGroup = async (id: string): Promise<ServiceGroupDto> => {
  const response = await api.get(`/public/salons/${SALON_ID}/service-groups/${id}`);
  return response.data;
};

export const getService = async (id: string): Promise<ServiceItemDto> => {
  const response = await api.get(`/public/salons/${SALON_ID}/services/${id}`);
  return response.data;
};



export const getAvailableSlots = async (
  serviceId: string,
  startDate: string,
  endDate: string
): Promise<DailySlotsDto[]> => {
  const response = await api.get(`/public/salons/${SALON_ID}/reservations/available-slots`, {
    params: {
      serviceId,
      startDate,
      endDate,
    },
  });
  return response.data;
};

export const createReservation = async (data: CreateReservationDto): Promise<ReservationDto> => {
  const response = await api.post(`/public/salons/${SALON_ID}/reservations`, data);
  return response.data;
};

export const getReservation = async (id: string): Promise<ReservationDto> => {
  const response = await api.get(`/public/salons/${SALON_ID}/reservations/${id}`);
  return response.data;
};

export const cancelReservation = async (id: string): Promise<void> => {
  await api.post(`/public/salons/${SALON_ID}/reservations/${id}/cancel`);
};

export const changeReservationTime = async (
  id: string,
  startTime: string
): Promise<ReservationDto> => {
  const response = await api.post(`/public/salons/${SALON_ID}/reservations/${id}/change-time`, {
    startTime,
  });
  return response.data;
}; 

export const unsubscribeNotificationEmails =  (token: string) => {
  return  api.post(`/public/salons/${SALON_ID}/unsubscribe/notification-emails/${token}`);
};

export const unsubscribeMarketingEmails =  (token: string) => {
  return  api.post(`/public/salons/${SALON_ID}/unsubscribe/marketing-emails/${token}`);
};