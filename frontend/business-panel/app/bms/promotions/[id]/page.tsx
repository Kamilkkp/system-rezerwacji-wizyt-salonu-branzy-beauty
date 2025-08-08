'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  FormHelperText,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { promotionsAPI, serviceGroupsAPI, servicesAPI } from '@/lib/api';
import { 
  UpdatePromotionDto, 
  PromotionDto,
  PromotionStatus, 
  PromotionType, 
  ServiceGroupStatus,
  ServiceStatus,
  ServiceDto,
  ServiceGroupDto
} from '@/types';
import { useSalon } from '@/context/SalonContext';
import { format } from 'date-fns';

export default function EditPromotionPage() {
  const router = useRouter();
  const params = useParams();
  const promotionId = params.id as string;
  const { activeSalon, loading: salonLoading } = useSalon();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [promotion, setPromotion] = useState<PromotionDto | null>(null);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroupDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [selectedServiceGroups, setSelectedServiceGroups] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [formData, setFormData] = useState<UpdatePromotionDto>({
    name: '',
    status: PromotionStatus.ACTIVE,
    type: PromotionType.PERCENTAGE,
    value: 0,
    startTime: '',
    endTime: null,
  });

  const formatDateTimeForInput = (dateTime: string) => {
    return format(new Date(dateTime), 'yyyy-MM-dd\'T\'HH:mm');
  };

  const loadPromotion = useCallback(async () => {
    if (!activeSalon || !promotionId) return;

    try {
      setLoading(true);
      setError('');

      const response = await promotionsAPI.getPromotion(activeSalon.id, promotionId);
      const promotion = response.data;
      setPromotion(promotion);

      setFormData({
        name: promotion.name,
        status: promotion.status,
        type: promotion.type,
        value: promotion.value,
        startTime: formatDateTimeForInput(promotion.startTime),
        endTime: promotion.endTime ? formatDateTimeForInput(promotion.endTime) : null,
      });

      setSelectedServiceGroups(promotion.serviceGroups.map(sg => sg.id));
      setSelectedServices(promotion.services.map(s => s.id));
    } catch (err: unknown) {
      console.error('Failed to load promotion:', err);
      let errorMessage = 'Failed to load promotion';
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
  }, [activeSalon, promotionId]);

  const loadServiceGroups = useCallback(async () => {
    try {
      const { data } = await serviceGroupsAPI.getAllServiceGroups(
        activeSalon!.id, 
        ServiceGroupStatus.ACTIVE
      );
      setServiceGroups(data);
    } catch (err) {
      console.error('Failed to load service groups:', err);
    }
  }, [activeSalon]);

  const loadServices = useCallback(async () => {
    try {
      const allServices: ServiceDto[] = [];
      for (const group of serviceGroups) {
                  try {
            const { data } = await servicesAPI.getAllServices(activeSalon!.id, group.id, ServiceStatus.ACTIVE);
            allServices.push(...data);
          } catch (err) {
            console.error(`Failed to load services for group ${group.id}:`, err);
          }
      }
      setServices(allServices);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  }, [activeSalon, serviceGroups]);

  useEffect(() => {
    if (activeSalon && promotionId) {
      loadPromotion();
      loadServiceGroups();
    }
  }, [activeSalon, promotionId, loadPromotion, loadServiceGroups]);

  useEffect(() => {
    if (serviceGroups.length > 0) {
      loadServices();
    }
  }, [serviceGroups, loadServices]);

  const handleInputChange = (field: keyof UpdatePromotionDto, value: string | number | undefined | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceGroupToggle = (groupId: string) => {
    setSelectedServiceGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      setError('Promotion name is required');
      return;
    }

    if (!formData.value || formData.value <= 0) {
      setError('Value must be greater than 0');
      return;
    }

    if (!formData.startTime) {
      setError('Start date is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const promotionData: UpdatePromotionDto = {
        ...formData,
        serviceGroupIds: selectedServiceGroups.length > 0 ? selectedServiceGroups : undefined,
        serviceIds: selectedServices.length > 0 ? selectedServices : undefined,
      };

      await promotionsAPI.updatePromotion(activeSalon!.id, promotionId, promotionData);
      router.push('/bms/promotions');
    } catch (err) {
      setError('Failed to update promotion');
      console.error(err);
    } finally {
      setSaving(false);
    }
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

  if (!promotion) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          Promotion not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/bms/promotions')}
        >
          Back to Promotions
        </Button>
        <Typography variant="h4" component="h1">
          Edit Promotion
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" gap={3} flexWrap="wrap">
                <Box flex={1} minWidth="300px">
                  <TextField
                    fullWidth
                    label="Promotion Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </Box>

                <Box flex={1} minWidth="300px">
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <MenuItem value={PromotionStatus.ACTIVE}>Active</MenuItem>
                      <MenuItem value={PromotionStatus.ARCHIVED}>Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box display="flex" gap={3} flexWrap="wrap">
                <Box flex={1} minWidth="300px">
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Type"
                      onChange={(e) => handleInputChange('type', e.target.value)}
                    >
                      <MenuItem value={PromotionType.PERCENTAGE}>Percentage</MenuItem>
                      <MenuItem value={PromotionType.FIXED_AMOUNT}>Fixed Amount</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box flex={1} minWidth="300px">
                  <TextField
                    fullWidth
                    label="Value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText={formData.type === PromotionType.PERCENTAGE ? 'Percentage (e.g., 20 for 20%)' : 'Amount in PLN'}
                  />
                </Box>
              </Box>

              <Box display="flex" gap={3} flexWrap="wrap">
                <Box flex={1} minWidth="300px">
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="datetime-local"
                    value={formData.startTime || ''}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <Box flex={1} minWidth="300px">
                  <TextField
                    fullWidth
                    label="End Date (Optional)"
                    type="datetime-local"
                    value={formData.endTime || ''}
                    onChange={(e) => handleInputChange('endTime', e.target.value.trim() !== '' ? e.target.value : null)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Service Groups (Optional)
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {serviceGroups.map((group) => (
                    <Chip
                      key={group.id}
                      label={group.name}
                      onClick={() => handleServiceGroupToggle(group.id)}
                      color={selectedServiceGroups.includes(group.id) ? 'primary' : 'default'}
                      variant={selectedServiceGroups.includes(group.id) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
                {serviceGroups.length === 0 && (
                  <FormHelperText>No service groups available</FormHelperText>
                )}
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Services (Optional)
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {services.map((service) => (
                    <Chip
                      key={service.id}
                      label={service.name}
                      onClick={() => handleServiceToggle(service.id)}
                      color={selectedServices.includes(service.id) ? 'primary' : 'default'}
                      variant={selectedServices.includes(service.id) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
                {services.length === 0 && (
                  <FormHelperText>No services available</FormHelperText>
                )}
              </Box>

              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => router.push('/bms/promotions')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  disabled={saving}
                >
                  Update Promotion
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 