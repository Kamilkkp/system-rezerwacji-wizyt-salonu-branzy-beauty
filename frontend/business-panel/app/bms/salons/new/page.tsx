'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { salonAPI } from '@/lib/api';
import { useSalon } from '@/context/SalonContext';
import { CreateSalonDto, UpdateSalonDto, DayOfWeek } from '@/types';

const salonSchema = z.object({
  name: z.string().min(1, 'Salon name is required'),
  aboutUs: z.string().optional(),
  slotStepMin: z.number().min(1).max(240).optional(),
  address: z.object({
    city: z.string().optional(),
    streetName: z.string().optional(),
    streetNumber: z.string().optional(),
    apartment: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Invalid email format'
    }),
    instagramUrl: z.string().optional().refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: 'Invalid URL format'
    }),
    facebookUrl: z.string().optional().refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: 'Invalid URL format'
    }),
  }).optional(),
  openHours: z.array(z.object({
    dayOfWeek: z.nativeEnum(DayOfWeek),
    open: z.string(),
    close: z.string(),
  })).optional(),
});

type SalonFormData = z.infer<typeof salonSchema>;

const dayOptions = [
  { value: DayOfWeek.MON, label: 'Monday' },
  { value: DayOfWeek.TUE, label: 'Tuesday' },
  { value: DayOfWeek.WED, label: 'Wednesday' },
  { value: DayOfWeek.THU, label: 'Thursday' },
  { value: DayOfWeek.FRI, label: 'Friday' },
  { value: DayOfWeek.SAT, label: 'Saturday' },
  { value: DayOfWeek.SUN, label: 'Sunday' },
];

export default function CreateSalonPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const { refreshSalons } = useSalon();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SalonFormData>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: '',
      aboutUs: '',
      slotStepMin: 15,
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
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'openHours',
  });

  const onSubmit = async (data: SalonFormData) => {
    try {
      setSaving(true);
      setError('');

      const createData: CreateSalonDto = {
        name: data.name,
      };

      const { data: salonId } = await salonAPI.createSalon(createData);

      const updateData: UpdateSalonDto = {};

      if (data.aboutUs && data.aboutUs.trim() !== '') {
        updateData.aboutUs = data.aboutUs;
      }

      if (data.slotStepMin) {
        updateData.slotStepMin = data.slotStepMin;
      }

      if (data.address) {
        const hasAddressData = (data.address.city && data.address.city.trim() !== '') ||
                              (data.address.streetName && data.address.streetName.trim() !== '') ||
                              (data.address.streetNumber && data.address.streetNumber.trim() !== '') ||
                              (data.address.apartment && data.address.apartment.trim() !== '') ||
                              (data.address.postalCode && data.address.postalCode.trim() !== '');
        
        if (hasAddressData) {
          updateData.address = {
            city: data.address.city || undefined,
            streetName: data.address.streetName || undefined,
            streetNumber: data.address.streetNumber || undefined,
            apartment: data.address.apartment || undefined,
            postalCode: data.address.postalCode || undefined,
          };
        }
      }

      if (data.contactInfo) {
        const hasContactData = (data.contactInfo.phone && data.contactInfo.phone.trim() !== '') ||
                              (data.contactInfo.email && data.contactInfo.email.trim() !== '') ||
                              (data.contactInfo.instagramUrl && data.contactInfo.instagramUrl.trim() !== '') ||
                              (data.contactInfo.facebookUrl && data.contactInfo.facebookUrl.trim() !== '');
        
        if (hasContactData) {
          updateData.contactInfo = {
            phone: data.contactInfo.phone || undefined,
            email: data.contactInfo.email || undefined,
            instagramUrl: data.contactInfo.instagramUrl || undefined,
            facebookUrl: data.contactInfo.facebookUrl || undefined,
          };
        }
      }

      if (data.openHours && data.openHours.length > 0) {
        updateData.openHours = data.openHours;
      }

      if (Object.keys(updateData).length > 0) {
        await salonAPI.updateSalon(salonId, updateData);
      }

      await refreshSalons();
      router.push('/bms/reservations');
    } catch (err) {
      setError('Failed to create salon');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addOpenHour = () => {
    append({
      dayOfWeek: DayOfWeek.MON,
      open: '09:00',
      close: '17:00',
    });
  };

  const removeOpenHour = (index: number) => {
    remove(index);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => router.push('/bms/reservations')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Create New Salon
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Only salon name is required. All other fields are optional and can be configured later.
              </Typography>
              <TextField
                fullWidth
                label="Salon Name *"
                margin="normal"
                {...control.register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
              <TextField
                fullWidth
                label="About Us"
                margin="normal"
                multiline
                rows={4}
                {...control.register('aboutUs')}
                error={!!errors.aboutUs}
                helperText={errors.aboutUs?.message}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Slot Step (minutes) - Optional</InputLabel>
                <Controller
                  name="slotStepMin"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Slot Step (minutes) - Optional"
                      value={field.value || ''}
                      onChange={field.onChange}
                      error={!!errors.slotStepMin}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Use default (15 minutes)</em>
                      </MenuItem>
                      {Array.from({ length: 48 }, (_, i) => (i + 1) * 5).map((minutes) => (
                        <MenuItem key={minutes} value={minutes}>
                          {minutes} minutes
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.slotStepMin && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.slotStepMin.message}
                  </Typography>
                )}
              </FormControl>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Address (Optional)
              </Typography>
              <TextField
                fullWidth
                label="City"
                margin="normal"
                {...control.register('address.city')}
                error={!!errors.address?.city}
                helperText={errors.address?.city?.message}
              />
              <TextField
                fullWidth
                label="Street Name"
                margin="normal"
                {...control.register('address.streetName')}
                error={!!errors.address?.streetName}
                helperText={errors.address?.streetName?.message}
              />
              <TextField
                fullWidth
                label="Street Number"
                margin="normal"
                {...control.register('address.streetNumber')}
                error={!!errors.address?.streetNumber}
                helperText={errors.address?.streetNumber?.message}
              />
              <TextField
                fullWidth
                label="Apartment"
                margin="normal"
                {...control.register('address.apartment')}
                error={!!errors.address?.apartment}
                helperText={errors.address?.apartment?.message}
              />
              <TextField
                fullWidth
                label="Postal Code"
                margin="normal"
                {...control.register('address.postalCode')}
                error={!!errors.address?.postalCode}
                helperText={errors.address?.postalCode?.message}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information (Optional)
              </Typography>
              <TextField
                fullWidth
                label="Phone"
                margin="normal"
                {...control.register('contactInfo.phone')}
                error={!!errors.contactInfo?.phone}
                helperText={errors.contactInfo?.phone?.message}
              />
              <TextField
                fullWidth
                label="Email"
                margin="normal"
                type="email"
                {...control.register('contactInfo.email')}
                error={!!errors.contactInfo?.email}
                helperText={errors.contactInfo?.email?.message}
              />
              <TextField
                fullWidth
                label="Instagram URL"
                margin="normal"
                {...control.register('contactInfo.instagramUrl')}
                error={!!errors.contactInfo?.instagramUrl}
                helperText={errors.contactInfo?.instagramUrl?.message}
              />
              <TextField
                fullWidth
                label="Facebook URL"
                margin="normal"
                {...control.register('contactInfo.facebookUrl')}
                error={!!errors.contactInfo?.facebookUrl}
                helperText={errors.contactInfo?.facebookUrl?.message}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Opening Hours (Optional)
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addOpenHour}
                  variant="outlined"
                  size="small"
                >
                  Add Hours
                </Button>
              </Box>
              
              {fields.map((field, index) => (
                <Box key={field.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">
                      Day {index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => removeOpenHour(index)}
                      color="error"
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                  
                  <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
                    <FormControl fullWidth>
                      <InputLabel>Day</InputLabel>
                      <Controller
                        name={`openHours.${index}.dayOfWeek`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            label="Day"
                            value={field.value}
                            onChange={field.onChange}
                          >
                            {dayOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                    
                    <TextField
                      label="Open"
                      type="time"
                      {...control.register(`openHours.${index}.open`)}
                      InputLabelProps={{ shrink: true }}
                    />
                    
                    <TextField
                      label="Close"
                      type="time"
                      {...control.register(`openHours.${index}.close`)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Box>
              ))}
              
              {fields.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No opening hours added yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button
            variant="outlined"
            onClick={() => router.push('/bms/reservations')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Creating...' : 'Create Salon'}
          </Button>
        </Box>
      </form>
    </Box>
  );
} 