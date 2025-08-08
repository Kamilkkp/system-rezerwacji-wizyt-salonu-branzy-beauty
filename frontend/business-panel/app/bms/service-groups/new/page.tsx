'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serviceGroupsAPI } from '@/lib/api';
import { useSalon } from '@/context/SalonContext';
import { CreateServiceGroupDto } from '@/types';

const serviceGroupSchema = z.object({
  name: z.string().min(1, 'Service group name is required'),
  description: z.string().optional(),
});

type ServiceGroupFormData = z.infer<typeof serviceGroupSchema>;

export default function NewServiceGroupPage() {
  const router = useRouter();
  const { activeSalon } = useSalon();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceGroupFormData>({
    resolver: zodResolver(serviceGroupSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: ServiceGroupFormData) => {
    if (!activeSalon) {
      setError('No active salon selected');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const createData: CreateServiceGroupDto = {
        name: data.name,
        description: data.description || '',
      };

      await serviceGroupsAPI.createServiceGroup(activeSalon.id, createData);
      router.push('/bms/service-groups');
    } catch (err) {
      setError('Failed to create service group');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!activeSalon) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No active salon selected</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">Add New Service Group</Typography>
      </Box>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Service Group Name"
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name?.message}
                required
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description (Optional)"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Service Group'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
} 