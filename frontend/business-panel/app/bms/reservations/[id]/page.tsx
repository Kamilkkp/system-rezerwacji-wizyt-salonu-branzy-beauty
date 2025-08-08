'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

import { reservationsAPI } from '@/lib/api';
import { 
  ReservationDto, 
  ReservationStatus
} from '@/types';
import { useSalon } from '@/context/SalonContext';

export default function EditReservationPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = params.id as string;
  
  const [reservation, setReservation] = useState<ReservationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const { activeSalon, loading: salonLoading } = useSalon();

  const loadReservation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getReservation(
        activeSalon?.id || '', 
        reservationId
      );
      setReservation(response.data);
    } catch (err) {
      console.error('Error loading reservation:', err);
      setError('Failed to load reservation');
    } finally {
      setLoading(false);
    }
  }, [activeSalon?.id, reservationId]);

  useEffect(() => {
    if (activeSalon && !salonLoading && reservationId) {
      loadReservation();
    }
  }, [activeSalon, salonLoading, reservationId, loadReservation]);

  const handleSave = async () => {
    if (!reservation || !activeSalon) return;

    try {
      setSaving(true);
      setError('');
      
      await reservationsAPI.updateReservation(
        activeSalon.id,
        reservation.id,
        {
          clientName: reservation.clientName,
          clientEmail: reservation.clientEmail,
          clientPhone: reservation.clientPhone,
          clientNotes: reservation.clientNotes,
        }
      );
      
      setSuccess('Reservation updated successfully');
    } catch (err) {
      console.error('Error updating reservation:', err);
      setError('Failed to update reservation');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/bms/reservations');
  };

  const getStatusColor = (status: ReservationStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return 'success';
      case ReservationStatus.PENDING:
        return 'warning';
      case ReservationStatus.CANCELLED:
        return 'error';
      case ReservationStatus.COMPLETED:
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  if (!reservation) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          Reservation not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Edit Reservation
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Reservations
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
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={3}>
            <Box>
              <Typography variant="h6" gutterBottom>Reservation Details</Typography>
              
              <TextField
                fullWidth
                label="Client Name"
                value={reservation.clientName}
                onChange={(e) => setReservation(prev => prev ? { ...prev, clientName: e.target.value } : null)}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Client Email"
                value={reservation.clientEmail}
                onChange={(e) => setReservation(prev => prev ? { ...prev, clientEmail: e.target.value } : null)}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Client Phone"
                value={reservation.clientPhone || ''}
                onChange={(e) => setReservation(prev => prev ? { ...prev, clientPhone: e.target.value } : null)}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Notes"
                value={reservation.clientNotes || ''}
                onChange={(e) => setReservation(prev => prev ? { ...prev, clientNotes: e.target.value } : null)}
                margin="normal"
                multiline
                rows={3}
              />
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>Reservation Info</Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Service:</strong> {reservation.serviceName}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Start Time:</strong> {formatDate(reservation.startTime)}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>End Time:</strong> {formatDate(reservation.endTime)}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Price:</strong> {reservation.price} PLN
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Duration:</strong> {reservation.serviceDurationMin} minutes
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography variant="body2">
                  <strong>Status:</strong>
                </Typography>
                <Chip 
                  label={reservation.status} 
                  color={getStatusColor(reservation.status)}
                  size="small"
                />
              </Box>
            </Box>
          </Box>

          <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              Save Changes
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 