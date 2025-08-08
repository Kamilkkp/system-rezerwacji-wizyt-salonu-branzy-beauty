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
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { serviceGroupsAPI } from '@/lib/api';
import { ServiceGroupDto, ServiceGroupStatus, ServiceStatus, UpdateServiceGroupDto } from '@/types';

import { useSalon } from '@/context/SalonContext';

export default function EditServiceGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  
  const [serviceGroup, setServiceGroup] = useState<ServiceGroupDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const { activeSalon, loading: salonLoading } = useSalon();

  const loadServiceGroup = useCallback(async () => {
    if (!activeSalon || !groupId) return;

    setLoading(true);
    setError('');

    try {
      const response = await serviceGroupsAPI.getServiceGroup(activeSalon.id, groupId, ServiceStatus.ACTIVE);
      setServiceGroup(response.data);
    } catch (err: unknown) {
      console.error('Failed to load service group:', err);
      let errorMessage = 'Failed to load service group';
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
  }, [activeSalon, groupId]);

  useEffect(() => {
    if (activeSalon && !salonLoading && groupId) {
      loadServiceGroup();
    }
  }, [loadServiceGroup, salonLoading, activeSalon, groupId]);

  const handleSave = async () => {
    if (!serviceGroup) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updateData: UpdateServiceGroupDto = {
        status: serviceGroup.status,
        name: serviceGroup.name,
        description: serviceGroup.description,
      };

      await serviceGroupsAPI.updateServiceGroup(
        activeSalon?.id || '', 
        groupId, 
        updateData
      );

      setSuccess('Service group updated successfully');
    } catch (err) {
      console.error('Error updating service group:', err);
      setError('Failed to update service group');
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

  if (!serviceGroup) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          Service group not found
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
            Edit Service Group: {serviceGroup.name}
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
          <Box display="flex" flexDirection="column" gap={3}>
            <Box>
              <TextField
                fullWidth
                label="Group Name"
                value={serviceGroup.name}
                onChange={(e) => setServiceGroup({ ...serviceGroup, name: e.target.value })}
                margin="normal"
              />
            </Box>
            
            <Box>
              <TextField
                fullWidth
                label="Description"
                value={serviceGroup.description || ''}
                onChange={(e) => setServiceGroup({ ...serviceGroup, description: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Box>

            <Box display="flex" gap={3} flexWrap="wrap">
              <Box flex={1} minWidth="300px">
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={serviceGroup.status}
                    label="Status"
                    onChange={(e) => setServiceGroup({ ...serviceGroup, status: e.target.value as ServiceGroupStatus })}
                  >
                    <MenuItem value={ServiceGroupStatus.ACTIVE}>Active</MenuItem>
                    <MenuItem value={ServiceGroupStatus.ARCHIVED}>Archived</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box flex={1} minWidth="300px">
                <TextField
                  fullWidth
                  label="Services Count"
                  value={serviceGroup.services?.length || 0}
                  disabled
                  margin="normal"
                  helperText="Number of services in this group"
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {serviceGroup.services && serviceGroup.services.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Services in this group
            </Typography>
            <Box>
              {serviceGroup.services.map((service) => (
                <Box key={service.id} mb={1} p={1} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="body2" fontWeight="medium">
                    {service.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {service.description || 'No description'}
                  </Typography>
                  <Typography variant="body2">
                    {service.price} zł
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
} 