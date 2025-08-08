'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person,
  Email,
  Phone,
  ViewWeek as ViewWeekIcon,
} from '@mui/icons-material';
import { reservationsAPI } from '@/lib/api';
import { ReservationDto, ReservationStatus } from '@/types';
import { useSalon } from '@/context/SalonContext';

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);

  const { activeSalon, loading: salonLoading } = useSalon();

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      const { data } = await reservationsAPI.getAllReservations(
        activeSalon!.id, 
        status,
        startDateFilter || undefined,
        endDateFilter || undefined
      );
      setReservations(data);
    } catch (err) {
      setError('Failed to load reservations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, startDateFilter, endDateFilter, activeSalon]);

  useEffect(() => {
    if (activeSalon) {
      loadReservations();
    }
  }, [activeSalon, loadReservations]);

  const handleReservationClick = async (reservationId: string) => {
    try {
      const { data } = await reservationsAPI.getReservation(activeSalon!.id, reservationId);
      setSelectedReservation(data);
      setDialogOpen(true);
    } catch (err) {
      setError('Failed to load reservation details');
      console.error(err);
    }
  };

  const handleConfirmReservation = async (reservationId: string) => {
    try {
      setError('');
      setSuccess('');
      await reservationsAPI.confirmReservation(activeSalon!.id, reservationId);
      await loadReservations();
      setSuccess('Reservation confirmed successfully');
    } catch (err) {
      setError('Failed to confirm reservation');
      console.error(err);
    }
  };

  const handleCompleteReservation = async (reservationId: string) => {
    try {
      setError('');
      setSuccess('');
      await reservationsAPI.completeReservation(activeSalon!.id, reservationId);
      await loadReservations();
      setSuccess('Reservation completed successfully');
    } catch (err) {
      setError('Failed to complete reservation');
      console.error(err);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        setError('');
        setSuccess('');
        await reservationsAPI.cancelReservation(activeSalon!.id, reservationId);
        await loadReservations();
        setSuccess('Reservation cancelled successfully');
      } catch (err) {
        setError('Failed to cancel reservation');
        console.error(err);
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Reservations
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<ViewWeekIcon />}
              onClick={() => router.push('/bms/reservations/calendar')}
            >
              Calendar View
            </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/bms/reservations/new')}
          >
            Add Reservation
          </Button>
          </Box>
        </Box>

        <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | 'all')}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value={ReservationStatus.PENDING}>Pending</MenuItem>
              <MenuItem value={ReservationStatus.CONFIRMED}>Confirmed</MenuItem>
              <MenuItem value={ReservationStatus.COMPLETED}>Completed</MenuItem>
              <MenuItem value={ReservationStatus.CANCELLED}>Cancelled</MenuItem>
            </Select>
          </FormControl>
          
          <DatePicker
            label="Start Date"
            value={startDateFilter}
            onChange={(newValue) => setStartDateFilter(newValue)}
            slotProps={{ textField: { size: 'small' } }}
          />
          
          <DatePicker
            label="End Date"
            value={endDateFilter}
            onChange={(newValue) => setEndDateFilter(newValue)}
            slotProps={{ textField: { size: 'small' } }}
          />
          
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setStartDateFilter(null);
              setEndDateFilter(null);
            }}
          >
            Clear Dates
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            {reservations.length} reservation{reservations.length !== 1 ? 's' : ''} found
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

      {reservations.length === 0 && !loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography variant="h6" color="text.secondary">
            No reservations found for the selected status
                </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow 
                  key={reservation.id}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => handleReservationClick(reservation.id)}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {reservation.clientName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reservation.clientEmail}
                      </Typography>
                </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {reservation.serviceName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {formatDateTime(reservation.startTime)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                      </Typography>
            </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={reservation.status} 
                      color={getStatusColor(reservation.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {reservation.price} PLN
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {reservation.status === ReservationStatus.PENDING && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmReservation(reservation.id);
                          }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      
                      {reservation.status === ReservationStatus.CONFIRMED && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteReservation(reservation.id);
                          }}
                        >
                          <ScheduleIcon />
                        </IconButton>
                      )}
                      
                      {reservation.status !== ReservationStatus.CANCELLED && 
                       reservation.status !== ReservationStatus.COMPLETED && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelReservation(reservation.id);
                          }}
                        >
                          <CancelIcon />
                        </IconButton>
                      )}
                      
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/bms/reservations/${reservation.id}`);
                            }}
                          >
                        <EditIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedReservation && (
          <>
            <DialogTitle>
              Reservation Details
            </DialogTitle>
            <DialogContent>
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>Client Information</Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Person fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">{selectedReservation.clientName}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Email fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">{selectedReservation.clientEmail}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Phone fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">{selectedReservation.clientPhone}</Typography>
                  </Box>
                  {selectedReservation.clientNotes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Notes:</strong> {selectedReservation.clientNotes}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>Service Details</Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Service:</strong> {selectedReservation.serviceName}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Salon:</strong> {selectedReservation.salonName}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Price:</strong> {selectedReservation.price} PLN
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Status:</strong> 
                    <Chip 
                      label={selectedReservation.status} 
                      color={getStatusColor(selectedReservation.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="h6" gutterBottom>Schedule</Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      <strong>Start:</strong> {formatDateTime(selectedReservation.startTime)}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    <strong>End:</strong> {formatDateTime(selectedReservation.endTime)}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setDialogOpen(false);
                  router.push(`/bms/reservations/${selectedReservation.id}`);
                }}
              >
                Edit Reservation
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
} 