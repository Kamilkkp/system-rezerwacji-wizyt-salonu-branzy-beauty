'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { servicesAPI } from '@/lib/api';
import { ServiceDto, ServiceStatus, UpdateServiceDto } from '@/types';

import { useSalon } from '@/context/SalonContext';

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const serviceId = params.serviceId as string;
  
  const [service, setService] = useState<ServiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const { activeSalon, loading: salonLoading } = useSalon();

  const loadService = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await servicesAPI.getAllServices(
        activeSalon?.id || '', 
        groupId
      );
      
      const foundService = response.data.find(s => s.id === serviceId);
      if (foundService) {
        setService(foundService);
      } else {
        setError('Service not found');
      }
    } catch (err) {
      console.error('Error loading service:', err);
      setError('Failed to load service');
    } finally {
      setLoading(false);
    }
  }, [activeSalon, groupId, serviceId]);

  useEffect(() => {
    if (activeSalon && !salonLoading && groupId && serviceId) {
      loadService();
    }
  }, [loadService, salonLoading, activeSalon, groupId, serviceId]);

  const handleSave = async () => {
    if (!service) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updateData: UpdateServiceDto = {
        name: service.name,
        description: service.description,
        price: service.price,
        status: service.status,
        durationMin: service.durationMin,
        breakAfterServiceMin: service.breakAfterServiceMin,
        technicalBreakMin: service.technicalBreakMin,
      };

      await servicesAPI.updateService(
        activeSalon?.id || '', 
        groupId,
        serviceId,
        updateData
      );

      setSuccess('Service updated successfully');
      
      setTimeout(() => {
        router.push('/bms/service-groups');
      }, 1500);
    } catch (err) {
      console.error('Error updating service:', err);
      setError('Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/bms/service-groups');
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

  if (!service) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          Service not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Service Groups
          </Button>
          <Typography variant="h4" component="h1">
            Edit Service: {service.name}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
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
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Service Name"
                value={service.name}
                onChange={(e) => setService({ ...service, name: e.target.value })}
                margin="normal"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={service.price}
                onChange={(e) => setService({ ...service, price: parseFloat(e.target.value) || 0 })}
                margin="normal"
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={service.description || ''}
                onChange={(e) => setService({ ...service, description: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={service.durationMin || 0}
                onChange={(e) => setService({ ...service, durationMin: parseInt(e.target.value) || 0 })}
                margin="normal"
                required
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Break After Service (minutes)"
                type="number"
                value={service.breakAfterServiceMin || 0}
                onChange={(e) => setService({ ...service, breakAfterServiceMin: parseInt(e.target.value) || 0 })}
                margin="normal"
                required
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Technical Break (minutes)"
                type="number"
                value={service.technicalBreakMin || 0}
                onChange={(e) => setService({ ...service, technicalBreakMin: parseInt(e.target.value) || 0 })}
                margin="normal"
                required
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={service.status}
                  label="Status"
                  onChange={(e) => setService({ ...service, status: e.target.value as ServiceStatus })}
                >
                  <MenuItem value={ServiceStatus.ACTIVE}>Active</MenuItem>
                  <MenuItem value={ServiceStatus.ARCHIVED}>Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
} 