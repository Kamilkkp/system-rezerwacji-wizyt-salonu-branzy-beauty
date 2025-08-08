export interface AccountDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAccountDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface ItemDto {
  id: string;
  name: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export enum DayOfWeek {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}

export interface OpenHoursDto {
  dayOfWeek: DayOfWeek;
  open: string;
  close: string;
}

export interface CreateOpenHoursDto {
  dayOfWeek: DayOfWeek;
  open: string;
  close: string;
}

export interface AddressDto {
  streetName?: string;
  streetNumber?: string;
  apartment?: string;
  postalCode?: string;
  city?: string;
}

export interface ContactInfoDto {
  phone?: string;
  email?: string;
  instagramUrl?: string;
  facebookUrl?: string;
}

export interface SalonItemDto {
  id: string;
  name: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalonDto extends SalonItemDto {
  aboutUs?: string;
  openHours: OpenHoursDto[];
  slotStepMin: number;
  frontendUrl?: string;
  reminderMinutesBefore: number;
  calendarId?: string;
  address?: AddressDto;
  contactInfo?: ContactInfoDto;
}

export interface CreateSalonDto {
  name: string;
}

export interface UpdateSalonDto {
  name?: string;
  aboutUs?: string;
  openHours?: OpenHoursDto[];
  slotStepMin?: number;
  frontendUrl?: string;
  reminderMinutesBefore?: number;
  calendarId?: string | null;
  address?: AddressDto;
  contactInfo?: ContactInfoDto;
}

export enum ServiceGroupStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface ServiceGroupDto extends ItemDto {
  name: string;
  description?: string;
  status: ServiceGroupStatus;
  salonId: string;
  services: ServiceItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceGroupDto {
  name: string;
  description?: string;
}

export interface UpdateServiceGroupDto {
  name?: string;
  description?: string;
  status?: ServiceGroupStatus;
}

export enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface ServiceDto extends ItemDto {
  name: string;
  description?: string;
  price: number;
  status: ServiceStatus;
  durationMin: number;
  breakAfterServiceMin: number;
  technicalBreakMin: number;
  serviceGroupId: string;
  salonId: string;
}

export interface ServiceItemDto extends ItemDto {
  name: string;
  description?: string;
  price: number;
  priceAfterDiscount?: number;
  discount?: string;
  promotionId?: string;
  status: ServiceStatus;
  durationMin: number;
  breakAfterServiceMin: number;
  technicalBreakMin: number;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  price: number;
  status: ServiceStatus;
  durationMin: number;
  breakAfterServiceMin: number;
  technicalBreakMin: number;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  price?: number;
  status?: ServiceStatus;
  durationMin?: number;
  breakAfterServiceMin?: number;
  technicalBreakMin?: number;
}

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum PromotionStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface PromotionDto extends ItemDto {
  name: string;
  type: PromotionType;
  value: number;
  startTime: string;
  endTime: string | null;
  status: PromotionStatus;
  salonId: string;
  serviceGroups: ItemDto[];
  services: ItemDto[];
}

export interface CreatePromotionDto {
  name: string;
  type: PromotionType;
  value: number;
  startTime: string;
  endTime: string | null;
  status: PromotionStatus;
  serviceGroupIds: string[];
  serviceIds: string[];
}

export interface UpdatePromotionDto {
  name?: string;
  type?: PromotionType;
  value?: number;
  startTime?: string;
  endTime?: string | null;
  status?: PromotionStatus;
  serviceGroupIds?: string[];
  serviceIds?: string[];
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface ReservationDto extends ItemDto {
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientNotes?: string;
  salonId: string;
  serviceId: string;
  serviceName: string;
  serviceDurationMin: number;
  price: number;
  salonName: string;
  promotion?: {
    name: string;
    type: PromotionType;
    value: number;
  };
}

export interface CreateReservationDto {
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientNotes?: string;
  serviceId: string;
  promotionId?: string;
}

export interface UpdateReservationDto {
  startTime?: string;
  endTime?: string;
  status?: ReservationStatus;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientNotes?: string;
  serviceId?: string;
}

export interface SendEmailMessageDto {
  subject: string;
  content: string;
}

export interface SendMessageResponseDto {
  success: boolean;
  message: string;
}

export interface OpenHoursExceptionDto {
  id: string;
  startTime: string;
  endTime: string;
  isWorking: boolean;
  salonId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOpenHoursExceptionDto {
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

export interface FindOpenHoursExceptionsQueryDto {
  startDate?: string;
  endDate?: string;
}

export enum DailySlotStatusValue {
  AVAILABLE = 'AVAILABLE',
  FULLY_BOOKED = 'FULLY_BOOKED',
  CLOSED = 'CLOSED',
}

export interface TimeSlotDto {
  startTime: string;
  endTime: string;
  value: string;
}

export interface DailySlotsDto {
  date: string;
  status: DailySlotStatusValue;
  slots?: TimeSlotDto[];
}