'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { salonAPI } from '@/lib/api';
import { useSalon } from '@/context/SalonContext';
import { 
  SalonDto, 
  UpdateSalonDto, 
  DayOfWeek, 
  CreateOpenHoursDto 
} from '@/types';

import { v4 as uuidv4 } from 'uuid';

const salonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  aboutUs: z.string().optional(),
  address: z.object({
    city: z.string().optional(),
    streetName: z.string().optional(),
    streetNumber: z.string().optional(),
    apartment: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    instagramUrl: z.string().optional(),
    facebookUrl: z.string().optional(),
  }).optional(),
  openHours: z.array(z.object({
    dayOfWeek: z.nativeEnum(DayOfWeek),
    open: z.string(),
    close: z.string(),
  })).optional(),
  slotStepMin: z.number().min(15).max(60).optional(),
  frontendUrl: z.string().optional(),
  reminderMinutesBefore: z.number().min(15).max(60*24*2).optional(),
  publicCalendar: z.boolean().optional(),
});

type SalonFormData = z.infer<typeof salonSchema>;

export default function SalonSettingsPage() {
  const { activeSalon, refreshSalons } = useSalon();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [salonDetails, setSalonDetails] = useState<SalonDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SalonFormData>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: '',
      aboutUs: '',
      address: {
        city: '',
        streetName: '',
        streetNumber: '',
        apartment: '',
        postalCode: '',
      },
      contactInfo: {
        phone: '',
        email: '',
        instagramUrl: '',
        facebookUrl: '',
      },
      openHours: [],
      slotStepMin: 15,
      frontendUrl: '',
      reminderMinutesBefore: 60,
      publicCalendar: false,
    },
  });

  const loadSalon = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await salonAPI.getSalon(activeSalon!.id);
      setSalonDetails(data);
      
      reset({
        name: data.name,
        aboutUs: data.aboutUs || '',
        slotStepMin: data.slotStepMin || 60,
        reminderMinutesBefore: data.reminderMinutesBefore || 60,
        frontendUrl: data.frontendUrl || '',
        publicCalendar: !!data.calendarId,
        address: data.address ? {
          city: data.address.city || '',
          streetName: data.address.streetName || '',
          streetNumber: data.address.streetNumber || '',
          apartment: data.address.apartment || '',
          postalCode: data.address.postalCode || '',
        } : {
          city: '',
          streetName: '',
          streetNumber: '',
          apartment: '',
          postalCode: '',
        },
        contactInfo: data.contactInfo ? {
          phone: data.contactInfo.phone || '',
          email: data.contactInfo.email || '',
          instagramUrl: data.contactInfo.instagramUrl || '',
          facebookUrl: data.contactInfo.facebookUrl || '',
        } : {
          phone: '',
          email: '',
          instagramUrl: '',
          facebookUrl: '',
        },
        openHours: data.openHours || [],
      });
    } catch (err) {
      console.error('Failed to load salon:', err);
      setError('Failed to load salon details');
    } finally {
      setLoading(false);
    }
  }, [activeSalon, reset]);

  useEffect(() => {
    if (activeSalon) {
      loadSalon();
    }
  }, [activeSalon, loadSalon]);

  const handleDeleteSalon = async () => {
    if (!activeSalon) return;
    
    try {
      setDeleting(true);
      setError(null);
      
      await salonAPI.deleteSalon(activeSalon.id);
      
      await refreshSalons();
      setSuccess('Salon deleted successfully');
    } catch (err: unknown) {
      console.error('Failed to delete salon:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err && 
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
        ? String(err.response.data.message)
        : 'Failed to delete salon';
      setError(errorMessage);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const onSubmit = async (data: SalonFormData) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      let calendarId: string | null = null;
      if (data.publicCalendar) {
        if (!salonDetails?.calendarId) {
          calendarId = uuidv4();
        } else {
          calendarId = salonDetails.calendarId;
        }
      }

      const updateData: UpdateSalonDto = {};

      if (data.name !== salonDetails?.name) {
        updateData.name = data.name;
      }

      if (data.aboutUs !== salonDetails?.aboutUs) {
        updateData.aboutUs = data.aboutUs;
      }

      if (data.slotStepMin !== salonDetails?.slotStepMin) {
        updateData.slotStepMin = data.slotStepMin;
      }

      if (data.frontendUrl !== salonDetails?.frontendUrl) {
        updateData.frontendUrl = data.frontendUrl;
      }

      if (data.reminderMinutesBefore !== salonDetails?.reminderMinutesBefore) {
        updateData.reminderMinutesBefore = data.reminderMinutesBefore;
      }

      if (data.publicCalendar && calendarId) {
        updateData.calendarId = calendarId;
      } else if (!data.publicCalendar && salonDetails?.calendarId) {
        updateData.calendarId = null;
      }

      if (data.address) {
        const currentAddress = salonDetails?.address;
        const newAddress = data.address;
        
        const hasAddressData = (newAddress.city && newAddress.city.trim() !== '') ||
                              (newAddress.streetName && newAddress.streetName.trim() !== '') || 
                              (newAddress.streetNumber && newAddress.streetNumber.trim() !== '') || 
                              (newAddress.apartment && newAddress.apartment.trim() !== '') || 
                              (newAddress.postalCode && newAddress.postalCode.trim() !== '');
        
        if (hasAddressData) {
          if (!currentAddress) {
            updateData.address = {
              city: newAddress.city || undefined,
              streetName: newAddress.streetName || undefined,
              streetNumber: newAddress.streetNumber || undefined,
              apartment: newAddress.apartment || undefined,
              postalCode: newAddress.postalCode || undefined,
            };
          } else {
            if (
              currentAddress.city !== (newAddress.city || '') ||
              currentAddress.streetName !== (newAddress.streetName || '') ||
              currentAddress.streetNumber !== (newAddress.streetNumber || '') ||
              currentAddress.apartment !== (newAddress.apartment || '') ||
              currentAddress.postalCode !== (newAddress.postalCode || '')
            ) {
              updateData.address = {
                city: newAddress.city || undefined,
                streetName: newAddress.streetName || undefined,
                streetNumber: newAddress.streetNumber || undefined,
                apartment: newAddress.apartment || undefined,
                postalCode: newAddress.postalCode || undefined,
              };
            }
          }
        }
      }
      
      if (data.contactInfo) {
        const currentContact = salonDetails?.contactInfo;
        const newContact = data.contactInfo;
        
        const hasContactData = (newContact.phone && newContact.phone.trim() !== '') || 
                              (newContact.email && newContact.email.trim() !== '') || 
                              (newContact.instagramUrl && newContact.instagramUrl.trim() !== '') || 
                              (newContact.facebookUrl && newContact.facebookUrl.trim() !== '');
        
        if (hasContactData) {
          if (!currentContact) {
            updateData.contactInfo = {
              phone: newContact.phone || undefined,
              email: newContact.email || undefined,
              instagramUrl: newContact.instagramUrl || undefined,
              facebookUrl: newContact.facebookUrl || undefined,
            };
          } else {
            if (
              currentContact.phone !== (newContact.phone || '') ||
              currentContact.email !== (newContact.email || '') ||
              currentContact.instagramUrl !== (newContact.instagramUrl || '') ||
              currentContact.facebookUrl !== (newContact.facebookUrl || '')
            ) {
              updateData.contactInfo = {
                phone: newContact.phone || undefined,
                email: newContact.email || undefined,
                instagramUrl: newContact.instagramUrl || undefined,
                facebookUrl: newContact.facebookUrl || undefined,
              };
            }
          }
        }
      }
      
      if (data.openHours && salonDetails?.openHours) {
        const currentHours = salonDetails.openHours;
        const newHours = data.openHours;
        
        if (currentHours.length !== newHours.length) {
          updateData.openHours = newHours;
        } else {
          const hasChanges = newHours.some((newHour, index) => {
            const currentHour = currentHours[index];
            return (
              currentHour.dayOfWeek !== newHour.dayOfWeek ||
              currentHour.open !== newHour.open ||
              currentHour.close !== newHour.close
            );
          });
          
          if (hasChanges) {
            updateData.openHours = newHours;
          }
        }
      } else if (data.openHours && !salonDetails?.openHours) {
        updateData.openHours = data.openHours;
      }

      if (Object.keys(updateData).length === 0) {
        setSuccess('No changes to save');
        return;
      }

      await salonAPI.updateSalon(activeSalon!.id, updateData);
      await refreshSalons();
      
      setSuccess('Salon settings updated successfully!');
    } catch (err: unknown) {
      console.error('Failed to update salon:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update salon settings';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const addOpenHour = () => {
    const currentOpenHours = control._formValues.openHours || [];
    const newOpenHour: CreateOpenHoursDto = {
      dayOfWeek: DayOfWeek.MON,
      open: '09:00',
      close: '17:00',
    };
    
    reset({
      ...control._formValues,
      openHours: [...currentOpenHours, newOpenHour],
    });
  };

  const removeOpenHour = (index: number) => {
    const currentOpenHours = control._formValues.openHours || [];
    const newOpenHours = currentOpenHours.filter((_: CreateOpenHoursDto, i: number) => i !== index);
    
    reset({
      ...control._formValues,
      openHours: newOpenHours,
    });
  };

  if (loading) {
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
          Salon Settings
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure your salon&apos;s basic information and scheduling settings.
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <TextField
                    label="Salon Name"
                    fullWidth
                    {...control.register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <FormControl fullWidth>
                    <InputLabel>Time Slot Step (minutes)</InputLabel>
                    <Controller
                      name="slotStepMin"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          label="Time Slot Step (minutes)"
                          error={!!errors.slotStepMin}
                        >
                          <MenuItem value={5}>5 minutes</MenuItem>
                          <MenuItem value={10}>10 minutes</MenuItem>
                          <MenuItem value={15}>15 minutes</MenuItem>
                          <MenuItem value={20}>20 minutes</MenuItem>
                          <MenuItem value={30}>30 minutes</MenuItem>
                          <MenuItem value={45}>45 minutes</MenuItem>
                          <MenuItem value={60}>60 minutes</MenuItem>
                          <MenuItem value={90}>90 minutes</MenuItem>
                          <MenuItem value={120}>120 minutes</MenuItem>
                          <MenuItem value={180}>180 minutes</MenuItem>
                          <MenuItem value={240}>240 minutes</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Box>
              </Box>

              <Box>
                <TextField
                  label="About Us"
                  fullWidth
                  multiline
                  rows={4}
                  {...control.register('aboutUs')}
                  error={!!errors.aboutUs}
                  helperText={errors.aboutUs?.message}
                />
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Notification Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure when reminder emails are sent to clients before their appointments. 
                  The Frontend URL is also required for CORS access, allowing your salon website to communicate with the booking system.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <FormControl fullWidth>
                    <InputLabel>Reminder Email (minutes before appointment)</InputLabel>
                    <Controller
                      name="reminderMinutesBefore"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          label="Reminder Email (minutes before appointment)"
                          error={!!errors.reminderMinutesBefore}
                        >
                          <MenuItem value={15}>15 minutes</MenuItem>
                          <MenuItem value={30}>30 minutes</MenuItem>
                          <MenuItem value={60}>1 hour</MenuItem>
                          <MenuItem value={120}>2 hours</MenuItem>
                          <MenuItem value={240}>4 hours</MenuItem>
                          <MenuItem value={480}>8 hours</MenuItem>
                          <MenuItem value={720}>12 hours</MenuItem>
                          <MenuItem value={1440}>24 hours</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                  {errors.reminderMinutesBefore && (
                    <Typography variant="caption" color="error">
                      {errors.reminderMinutesBefore.message}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <TextField
                    label="Frontend URL (required for CORS)"
                    fullWidth
                    {...control.register('frontendUrl')}
                    error={!!errors.frontendUrl}
                    helperText={errors.frontendUrl?.message || "URL to your salon's public website. Required for CORS access and email notifications."}
                    placeholder="https://your-salon.com"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Public Calendar Access
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Allow clients to subscribe to your reservation calendar for automatic updates.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Controller
                    name="publicCalendar"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Public Calendar Access</InputLabel>
                        <Select
                          {...field}
                          label="Public Calendar Access"
                          value={field.value ? 'enabled' : 'disabled'}
                          onChange={(e) => field.onChange(e.target.value === 'enabled')}
                        >
                          <MenuItem value="enabled">Enabled</MenuItem>
                          <MenuItem value="disabled">Disabled</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>

                {control._formValues.publicCalendar && salonDetails?.calendarId && (
                  <Box sx={{ flex: 1, minWidth: 300 }}>
                    <TextField
                      label="Calendar Export URL"
                      fullWidth
                      value={`${window.location.origin}/public/salons/${activeSalon?.id}/reservations/calendar/${salonDetails.calendarId}/ics`}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/public/salons/${activeSalon?.id}/reservations/calendar/${salonDetails.calendarId}/ics`);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            edge="end"
                          >
                            <CopyIcon />
                          </IconButton>
                        ),
                      }}
                      helperText={copied ? "URL copied to clipboard!" : "URL to subscribe your calendar"}
                    />
                  </Box>
                )}
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Address
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 2, minWidth: 300 }}>
                  <TextField
                    label="Street Name"
                    fullWidth
                    {...control.register('address.streetName')}
                    error={!!errors.address?.streetName}
                    helperText={errors.address?.streetName?.message}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 150 }}>
                  <TextField
                    label="Street Number"
                    fullWidth
                    {...control.register('address.streetNumber')}
                    error={!!errors.address?.streetNumber}
                    helperText={errors.address?.streetNumber?.message}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 150 }}>
                  <TextField
                    label="Apartment"
                    fullWidth
                    {...control.register('address.apartment')}
                    error={!!errors.address?.apartment}
                    helperText={errors.address?.apartment?.message}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <TextField
                    label="City"
                    fullWidth
                    {...control.register('address.city')}
                    error={!!errors.address?.city}
                    helperText={errors.address?.city?.message}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <TextField
                    label="Postal Code"
                    fullWidth
                    {...control.register('address.postalCode')}
                    error={!!errors.address?.postalCode}
                    helperText={errors.address?.postalCode?.message}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Contact details that will be displayed to clients and used for communication.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <TextField
                    label="Phone (+48XXXXXXXXX)"
                    fullWidth
                    {...control.register('contactInfo.phone')}
                    error={!!errors.contactInfo?.phone}
                    helperText={errors.contactInfo?.phone?.message}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <TextField
                    label="Email"
                    fullWidth
                    type="email"
                    {...control.register('contactInfo.email')}
                    error={!!errors.contactInfo?.email}
                    helperText={errors.contactInfo?.email?.message}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <TextField
                    label="Instagram URL (optional)"
                    fullWidth
                    {...control.register('contactInfo.instagramUrl')}
                    error={!!errors.contactInfo?.instagramUrl}
                    helperText={errors.contactInfo?.instagramUrl?.message}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <TextField
                    label="Facebook URL (optional)"
                    fullWidth
                    {...control.register('contactInfo.facebookUrl')}
                    error={!!errors.contactInfo?.facebookUrl}
                    helperText={errors.contactInfo?.facebookUrl?.message}
                  />
                </Box>
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h6">
                      Opening Hours
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Define when your salon is open for appointments.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addOpenHour}
                    disabled={control._formValues.openHours?.length >= 7}
                  >
                    Add Day
                  </Button>
                </Box>
                
                {control._formValues.openHours?.length === 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No opening hours configured. Add at least one day.
                  </Alert>
                )}
              </Box>

              {control._formValues.openHours?.map((openHour: CreateOpenHoursDto, index: number) => {
                const usedDays = control._formValues.openHours
                  ?.map((oh: CreateOpenHoursDto, i: number) => i !== index ? oh.dayOfWeek : null)
                  .filter(Boolean) || [];
                
                return (
                  <Box key={index}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent sx={{ py: 2, px: 2 }}>
                        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                          <Box sx={{ minWidth: 150, flex: 1 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Day</InputLabel>
                              <Controller
                                name={`openHours.${index}.dayOfWeek`}
                                control={control}
                                render={({ field }) => (
                                  <Select 
                                    {...field} 
                                    label="Day"
                                    error={usedDays.includes(field.value)}
                                  >
                                    <MenuItem value={DayOfWeek.MON} disabled={usedDays.includes(DayOfWeek.MON)}>
                                      Monday
                                    </MenuItem>
                                    <MenuItem value={DayOfWeek.TUE} disabled={usedDays.includes(DayOfWeek.TUE)}>
                                      Tuesday
                                    </MenuItem>
                                    <MenuItem value={DayOfWeek.WED} disabled={usedDays.includes(DayOfWeek.WED)}>
                                      Wednesday
                                    </MenuItem>
                                    <MenuItem value={DayOfWeek.THU} disabled={usedDays.includes(DayOfWeek.THU)}>
                                      Thursday
                                    </MenuItem>
                                    <MenuItem value={DayOfWeek.FRI} disabled={usedDays.includes(DayOfWeek.FRI)}>
                                      Friday
                                    </MenuItem>
                                    <MenuItem value={DayOfWeek.SAT} disabled={usedDays.includes(DayOfWeek.SAT)}>
                                      Saturday
                                    </MenuItem>
                                    <MenuItem value={DayOfWeek.SUN} disabled={usedDays.includes(DayOfWeek.SUN)}>
                                      Sunday
                                    </MenuItem>
                                  </Select>
                                )}
                              />
                            </FormControl>
                          </Box>
                          <Box sx={{ minWidth: 120, flex: 1 }}>
                            <TextField
                              label="Open"
                              type="time"
                              fullWidth
                              size="small"
                              {...control.register(`openHours.${index}.open`)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Box>
                          <Box sx={{ minWidth: 120, flex: 1 }}>
                            <TextField
                              label="Close"
                              type="time"
                              fullWidth
                              size="small"
                              {...control.register(`openHours.${index}.close`)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Box>
                          <Box sx={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                            <Chip
                              label={`${control._formValues.openHours?.[index]?.open || '--'} - ${control._formValues.openHours?.[index]?.close || '--'}`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => removeOpenHour(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}

              <Box>
                <Box display="flex" gap={2} justifyContent="space-between" alignItems="center">
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<WarningIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={saving || deleting}
                  >
                    Delete Salon
                  </Button>
                  
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => router.back()}
                      disabled={saving || deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={saving || deleting}
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Delete Salon
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this salon? This action cannot be undone.
            All reservations, services, and other data associated with this salon will be permanently deleted.
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Salon to be deleted:</strong> {activeSalon?.name}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSalon}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete Salon'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 