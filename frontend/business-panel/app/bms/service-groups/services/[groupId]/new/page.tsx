'use client';

import React, { useState, useEffect } from 'react';
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
import { ServiceStatus, CreateServiceDto } from '@/types';
import { useSalon } from '@/context/SalonContext';

export default function AddServicePage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  
  const [formData, setFormData] = useState<CreateServiceDto>({
    name: '',
    description: '',
    price: 0,
    status: ServiceStatus.ACTIVE,
    durationMin: 60,
    breakAfterServiceMin: 15,
    technicalBreakMin: 0,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const { activeSalon, loading: salonLoading } = useSalon();

  useEffect(() => {
    if (!activeSalon && !salonLoading) {
      setError('No salon selected');
    }
  }, [activeSalon, salonLoading]);

  const handleSave = async () => {
    if (!activeSalon) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await servicesAPI.createService(activeSalon!.id, groupId, formData);
      setSuccess('Service created successfully');
      router.push(`/bms/service-groups/${groupId}`);
    } catch (err) {
      setError('Failed to create service');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/bms/service-groups');
  };

  if (salonLoading) {
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
            Add New Service
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Service'}
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                margin="normal"
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                value={formData.durationMin}
                onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 0 })}
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
                value={formData.breakAfterServiceMin}
                onChange={(e) => setFormData({ ...formData, breakAfterServiceMin: parseInt(e.target.value) || 0 })}
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
                value={formData.technicalBreakMin}
                onChange={(e) => setFormData({ ...formData, technicalBreakMin: parseInt(e.target.value) || 0 })}
                margin="normal"
                required
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ServiceStatus })}
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