'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { servicesAPI, reservationsAPI } from '@/lib/api';
import { useSalon } from '@/context/SalonContext';
import { CreateReservationDto, ServiceItemDto, DailySlotsDto, TimeSlotDto, ServiceStatus } from '@/types';

const reservationSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientPhone: z.string().min(1, 'Client phone is required'),
  clientEmail: z.string().email('Invalid email'),
  clientNotes: z.string().optional(),
  marketingConsent: z.boolean(),
  notificationsConsent: z.boolean(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

export default function NewReservationPage() {
  const router = useRouter();
  const { activeSalon, loading: salonLoading } = useSalon();
  
  const [services, setServices] = useState<ServiceItemDto[]>([]);
  const [availableSlots, setAvailableSlots] = useState<DailySlotsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      serviceId: '',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      clientNotes: '',
      marketingConsent: false,
      notificationsConsent: true,
    },
  });

  const selectedServiceId = watch('serviceId');

  const loadServices = useCallback(async () => {
    if (!activeSalon) return;

    setLoading(true);
    setError('');

    try {
      const allServices = await servicesAPI.getAllServicesForSalon(activeSalon.id, ServiceStatus.ACTIVE);
      setServices(allServices);
    } catch (err: unknown) {
      console.error('Failed to load services:', err);
      let errorMessage = 'Failed to load services';
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [activeSalon]);

  const loadAvailableSlots = useCallback(async () => {
    try {
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7);
      
      const { data } = await reservationsAPI.getAvailableSlots(
        activeSalon!.id,
        selectedServiceId,
        selectedDate,
        endDate.toISOString().split('T')[0]
      );
      setAvailableSlots(data);
    } catch (err) {
      console.error('Failed to load available slots:', err);
    }
  }, [activeSalon, selectedServiceId, selectedDate]);

  useEffect(() => {
    if (activeSalon) {
      loadServices();
    }
  }, [activeSalon, loadServices]);

  useEffect(() => {
    if (activeSalon && selectedServiceId && selectedDate) {
      loadAvailableSlots();
      setSelectedSlot(''); 
    }
  }, [activeSalon, selectedServiceId, selectedDate, loadAvailableSlots]);

  const onSubmit = async (data: ReservationFormData) => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    if (!selectedServiceId) {
      setError('Please select a service');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const selectedService = services.find(s => s.id === selectedServiceId);
      if (!selectedService) {
        setError('Selected service not found');
        return;
      }

      const startTime = new Date(selectedSlot);
      const endTime = new Date(startTime.getTime() + selectedService.durationMin * 60000);

      const reservationData: CreateReservationDto = {
        ...data,
        promotionId: selectedService.promotionId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
      
      await reservationsAPI.createReservation(activeSalon!.id, reservationData);
      router.push('/bms/reservations');
    } catch (err) {
      setError('Failed to create reservation');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getAvailableSlotsForDate = (date: string) => {
    const daySlots = availableSlots.find(slot => slot.date === date);
    return daySlots?.slots || [];
  };

  if (salonLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!activeSalon) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          No salon selected
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => router.push('/bms/reservations')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Add New Reservation
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" gap={3} flexWrap="wrap">
                <Box flex={1} minWidth="300px">
                  <FormControl fullWidth>
                    <InputLabel>Service</InputLabel>
                    <Controller
                      name="serviceId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          label="Service"
                          error={!!errors.serviceId}
                        >
                          {services.map((service) => (
                            <MenuItem key={service.id} value={service.id}>
                              {service.name} - {service.priceAfterDiscount ? (
                                <>
                                  <span style={{ textDecoration: 'line-through', color: '#666' }}>
                                    {service.price} PLN
                                  </span>
                                  <span style={{ color: '#4caf50', fontWeight: 'bold', marginLeft: '8px' }}>
                                    {service.priceAfterDiscount} PLN
                                  </span>
                                  {service.discount && (
                                    <span style={{ color: '#4caf50', fontSize: '0.8em', marginLeft: '4px' }}>
                                      ({service.discount})
                                    </span>
                                  )}
                                </>
                              ) : (
                                `${service.price} PLN`
                              )}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>
                </Box>

                <Box flex={1} minWidth="300px">
                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>

              <Box display="flex" gap={3} flexWrap="wrap">
                <Box flex={1} minWidth="300px">
                  <Controller
                    name="clientName"
                    control={control}
                    render={({ field }) => (
                  <TextField
                        {...field}
                    label="Client Name"
                    fullWidth
                    error={!!errors.clientName}
                    helperText={errors.clientName?.message}
                      />
                    )}
                  />
                </Box>

                <Box flex={1} minWidth="300px">
                  <Controller
                    name="clientPhone"
                    control={control}
                    render={({ field }) => (
                  <TextField
                        {...field}
                    label="Client Phone"
                    fullWidth
                    error={!!errors.clientPhone}
                    helperText={errors.clientPhone?.message}
                      />
                    )}
                  />
                </Box>
              </Box>

              <Box display="flex" gap={3} flexWrap="wrap">
                <Box flex={1} minWidth="300px">
                  <Controller
                    name="clientEmail"
                    control={control}
                    render={({ field }) => (
                  <TextField
                        {...field}
                    label="Client Email"
                    type="email"
                    fullWidth
                    error={!!errors.clientEmail}
                    helperText={errors.clientEmail?.message}
                      />
                    )}
                  />
                </Box>

                <Box flex={1} minWidth="300px">
                  <FormControl fullWidth>
                    <InputLabel>Time Slot</InputLabel>
                    <Select
                      value={selectedSlot}
                      label="Time Slot"
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      disabled={!selectedDate || !selectedServiceId || getAvailableSlotsForDate(selectedDate).length === 0}
                    >
                      {selectedDate && selectedServiceId && getAvailableSlotsForDate(selectedDate).map((slot: TimeSlotDto, index: number) => {
                        const [hours, minutes] = slot.startTime.split(':');
                        const date = new Date(selectedDate);
                        date.setHours(parseInt(hours), parseInt(minutes));
                        const isoString = date.toISOString();
                        
                        return (
                          <MenuItem key={index} value={isoString}>
                            {slot.startTime} - {slot.endTime}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {!selectedDate && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        Please select a date first
                      </Typography>
                    )}
                    {selectedDate && !selectedServiceId && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        Please select a service first
                      </Typography>
                    )}
                    {selectedDate && selectedServiceId && getAvailableSlotsForDate(selectedDate).length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        No available slots for this date and service
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              </Box>

              <Box display="flex" gap={3} flexWrap="wrap">
                <Box flex={1}>
                  <Controller
                    name="clientNotes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Client Notes (optional)"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.clientNotes}
                        helperText={errors.clientNotes?.message}
                      />
                    )}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Consent
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Controller
                    name="notificationsConsent"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label="I agree to receive notifications about my reservation (confirmations, reminders, changes)"
                      />
                    )}
                  />
                  
                  <Controller
                    name="marketingConsent"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label="I agree to receive marketing communications (promotions, special offers)"
                      />
                    )}
                  />
                </Box>
              </Box>

              {selectedDate && selectedServiceId && getAvailableSlotsForDate(selectedDate).length === 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    No available slots for this date. Please select a different date or service.
                  </Typography>
                </Box>
              )}

              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => router.push('/bms/reservations')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Creating...' : 'Create Reservation'}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
} 