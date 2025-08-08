import axios, { AxiosInstance, AxiosResponse } from 'axios';
import https from 'https';
import { 
  Tokens, 
  LoginDto, 
  AccountDto, 
  UpdateAccountDto,
  SalonItemDto,
  SalonDto,
  CreateSalonDto,
  UpdateSalonDto,
  ServiceGroupDto,
  CreateServiceGroupDto,
  UpdateServiceGroupDto,
  ServiceDto,
  CreateServiceDto,
  UpdateServiceDto,
  PromotionDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  ReservationDto,
  CreateReservationDto,
  UpdateReservationDto,
  SendEmailMessageDto,
  SendMessageResponseDto,
  OpenHoursExceptionDto,
  CreateOpenHoursExceptionDto,
  FindOpenHoursExceptionsQueryDto,
  ServiceGroupStatus,
  ServiceStatus,
  PromotionType,
  PromotionStatus,
  ReservationStatus,
  DailySlotsDto,
  ServiceItemDto
} from '@/types';

const isServer = typeof window === 'undefined';

export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(isServer ? {
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
  } : {}),
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const tokensString = localStorage.getItem('tokens');
      if (tokensString) {
        try {
          const tokens: Tokens = JSON.parse(tokensString);
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        } catch (error) {
          console.error('Failed to parse tokens:', error);
          localStorage.removeItem('tokens');
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        const tokensString = localStorage.getItem('tokens');
        if (tokensString) {
          try {
            const tokens: Tokens = JSON.parse(tokensString);
            const response = await api.post('/auth/refresh', {
              refresh_token: tokens.refreshToken,
            });
            
            const newTokens: Tokens = {
              accessToken: response.data.access_token,
              refreshToken: response.data.refresh_token,
            };
            localStorage.setItem('tokens', JSON.stringify(newTokens));
            
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('tokens');
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data: LoginDto): Promise<AxiosResponse<Tokens>> => {
    const response = await api.post('/auth/login', data);
    return {
      ...response,
      data: {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      }
    };
  },
  refresh: async (refreshToken: string): Promise<AxiosResponse<Tokens>> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return {
      ...response,
      data: {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      }
    };
  },
  logout: (): Promise<AxiosResponse<void>> => 
    api.post('/auth/logout'),
};

export const accountAPI = {
  getAccount: (): Promise<AxiosResponse<AccountDto>> => 
    api.get('/bms/account'),
  updateAccount: (data: UpdateAccountDto): Promise<AxiosResponse<AccountDto>> => 
    api.patch('/bms/account', data),
  deleteAccount: (): Promise<AxiosResponse<void>> => 
    api.delete('/bms/account'),
};

export const salonAPI = {
  getAllSalons: (): Promise<AxiosResponse<SalonItemDto[]>> => 
    api.get('/bms/salons'),
  getSalon: (id: string): Promise<AxiosResponse<SalonDto>> => 
    api.get(`/bms/salons/${id}`),
  createSalon: (data: CreateSalonDto): Promise<AxiosResponse<string>> => 
    api.post('/bms/salons', data),
  updateSalon: (id: string, data: UpdateSalonDto): Promise<AxiosResponse<SalonDto>> => 
    api.patch(`/bms/salons/${id}`, data),
  deleteSalon: (id: string): Promise<AxiosResponse<void>> => 
    api.delete(`/bms/salons/${id}`),
};

export const serviceGroupsAPI = {
  createServiceGroup: (salonId: string, data: CreateServiceGroupDto): Promise<AxiosResponse<ServiceGroupDto>> => 
    api.post(`/bms/salons/${salonId}/service-groups`, data),
  getAllServiceGroups: (salonId: string, status: ServiceGroupStatus): Promise<AxiosResponse<ServiceGroupDto[]>> => 
    api.get(`/bms/salons/${salonId}/service-groups`, { params: { status } }),
  getServiceGroup: (salonId: string, id: string, status: ServiceStatus): Promise<AxiosResponse<ServiceGroupDto>> => 
    api.get(`/bms/salons/${salonId}/service-groups/${id}`, { params: { status } }),
  updateServiceGroup: (salonId: string, id: string, data: UpdateServiceGroupDto): Promise<AxiosResponse<ServiceGroupDto>> => 
    api.patch(`/bms/salons/${salonId}/service-groups/${id}`, data),
  deleteServiceGroup: (salonId: string, id: string): Promise<AxiosResponse<void>> => 
    api.delete(`/bms/salons/${salonId}/service-groups/${id}`),
  updateServiceGroupStatus: (salonId: string, id: string, status: ServiceGroupStatus): Promise<AxiosResponse<ServiceGroupDto>> => 
    api.patch(`/bms/salons/${salonId}/service-groups/${id}/status`, { status }),
};

export const servicesAPI = {
  createService: (salonId: string, groupId: string, data: CreateServiceDto): Promise<AxiosResponse<ServiceDto>> => 
    api.post(`/bms/salons/${salonId}/service-groups/${groupId}/services`, data),
  getAllServices: (salonId: string, groupId: string, status?: ServiceStatus): Promise<AxiosResponse<ServiceDto[]>> => 
    api.get(`/bms/salons/${salonId}/service-groups/${groupId}/services`, { params: { status } }),
  getService: (salonId: string, groupId: string, serviceId: string): Promise<AxiosResponse<ServiceDto>> => 
    api.get(`/bms/salons/${salonId}/service-groups/${groupId}/services/${serviceId}`),
  updateService: (salonId: string, groupId: string, serviceId: string, data: UpdateServiceDto): Promise<AxiosResponse<ServiceDto>> => 
    api.patch(`/bms/salons/${salonId}/service-groups/${groupId}/services/${serviceId}`, data),
  deleteService: (salonId: string, groupId: string, serviceId: string): Promise<AxiosResponse<void>> => 
    api.delete(`/bms/salons/${salonId}/service-groups/${groupId}/services/${serviceId}`),

  getAllServicesForSalon: async (salonId: string, status?: ServiceStatus): Promise<ServiceItemDto[]> => {
    const { data: serviceGroups } = await serviceGroupsAPI.getAllServiceGroups(salonId, ServiceGroupStatus.ACTIVE);
    const allServices: ServiceItemDto[] = [];
    
    for (const group of serviceGroups) {
      try {
        const data = await serviceGroupsAPI.getServiceGroup(salonId, group.id, status || ServiceStatus.ACTIVE);

          allServices.push(...data.data.services);
      } catch (err) {
        console.error(`Failed to load services for group ${group.id}:`, err);
      }
    }
    
    return allServices;
  },
};

export const promotionsAPI = {
  createPromotion: (salonId: string, data: CreatePromotionDto): Promise<AxiosResponse<PromotionDto>> => 
    api.post(`/bms/salons/${salonId}/promotions`, data),
  getAllPromotions: (salonId: string, types?: PromotionType[], status?: PromotionStatus): Promise<AxiosResponse<PromotionDto[]>> => 
    api.get(`/bms/salons/${salonId}/promotions`, { 
      params: { 
        type: types ? types.join(',') : undefined,
        status: status || PromotionStatus.ACTIVE
      } 
    }),
  getPromotion: (salonId: string, id: string): Promise<AxiosResponse<PromotionDto>> => 
    api.get(`/bms/salons/${salonId}/promotions/${id}`),
  updatePromotion: (salonId: string, id: string, data: UpdatePromotionDto): Promise<AxiosResponse<PromotionDto>> => 
    api.patch(`/bms/salons/${salonId}/promotions/${id}`, data),
  deletePromotion: (salonId: string, id: string): Promise<AxiosResponse<void>> => 
    api.delete(`/bms/salons/${salonId}/promotions/${id}`),
};

export const reservationsAPI = {
  createReservation: (salonId: string, data: CreateReservationDto): Promise<AxiosResponse<ReservationDto>> => 
    api.post(`/bms/salons/${salonId}/reservations`, data),
  getAllReservations: (
    salonId: string, 
    status?: ReservationStatus,
    startDate?: Date,
    endDate?: Date
  ): Promise<AxiosResponse<ReservationDto[]>> => 
    api.get(`/bms/salons/${salonId}/reservations`, { 
      params: { 
        status,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined
      } 
    }),
  getReservation: (salonId: string, id: string): Promise<AxiosResponse<ReservationDto>> => 
    api.get(`/bms/salons/${salonId}/reservations/${id}`),
  updateReservation: (salonId: string, id: string, data: UpdateReservationDto): Promise<AxiosResponse<ReservationDto>> => 
    api.patch(`/bms/salons/${salonId}/reservations/${id}`, data),
  deleteReservation: (salonId: string, id: string): Promise<AxiosResponse<void>> => 
    api.delete(`/bms/salons/${salonId}/reservations/${id}`),
  confirmReservation: (salonId: string, id: string): Promise<AxiosResponse<ReservationDto>> => 
    api.post(`/bms/salons/${salonId}/reservations/${id}/confirm`),
  completeReservation: (salonId: string, id: string): Promise<AxiosResponse<ReservationDto>> => 
    api.post(`/bms/salons/${salonId}/reservations/${id}/complete`),
  cancelReservation: (salonId: string, id: string): Promise<AxiosResponse<ReservationDto>> => 
    api.post(`/bms/salons/${salonId}/reservations/${id}/cancel`),
  getAvailableSlots: (salonId: string, serviceId: string, startDate: string, endDate: string): Promise<AxiosResponse<DailySlotsDto[]>> => 
    api.get(`/bms/salons/${salonId}/reservations/available-slots`, { 
      params: { serviceId, startDate, endDate } 
    }),
};

export const mailingSystemAPI = {
  sendEmailMessage: (salonId: string, data: SendEmailMessageDto): Promise<AxiosResponse<SendMessageResponseDto>> => 
    api.post(`/bms/salons/${salonId}/mailing-system`, data),
};

export const openHoursExceptionsAPI = {
  createException: (salonId: string, data: CreateOpenHoursExceptionDto): Promise<AxiosResponse<OpenHoursExceptionDto>> => 
    api.post(`/bms/salons/${salonId}/open-hours/exceptions`, data),
  getAllExceptions: (salonId: string, query?: FindOpenHoursExceptionsQueryDto): Promise<AxiosResponse<OpenHoursExceptionDto[]>> => 
    api.get(`/bms/salons/${salonId}/open-hours/exceptions`, { params: query }),
  getException: (salonId: string, id: string): Promise<AxiosResponse<OpenHoursExceptionDto>> => 
    api.get(`/bms/salons/${salonId}/open-hours/exceptions/${id}`),
  updateException: (salonId: string, id: string, data: CreateOpenHoursExceptionDto): Promise<AxiosResponse<OpenHoursExceptionDto>> => 
    api.patch(`/bms/salons/${salonId}/open-hours/exceptions/${id}`, data),
  deleteException: (salonId: string, id: string): Promise<AxiosResponse<void>> => 
    api.delete(`/bms/salons/${salonId}/open-hours/exceptions/${id}`),
};