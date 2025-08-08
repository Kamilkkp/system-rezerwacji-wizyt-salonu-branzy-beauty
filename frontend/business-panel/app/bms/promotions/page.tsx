'use client';

import { useState, useEffect, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer,
} from '@mui/icons-material';
import { promotionsAPI } from '@/lib/api';
import { ItemDto, PromotionDto, PromotionStatus, PromotionType } from '@/types';
import { useSalon } from '@/context/SalonContext';

export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<ItemDto[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PromotionStatus>(PromotionStatus.ACTIVE);

  const { activeSalon, loading: salonLoading } = useSalon();

  const loadPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await promotionsAPI.getAllPromotions(
        activeSalon!.id, 
        [PromotionType.PERCENTAGE, PromotionType.FIXED_AMOUNT],
        statusFilter
      );
      setPromotions(data);
    } catch (err) {
      setError('Failed to load promotions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeSalon, statusFilter]);

  useEffect(() => {
    if (activeSalon) {
      loadPromotions();
    }
  }, [activeSalon, loadPromotions]);

  useEffect(() => {
    if (activeSalon) {
      loadPromotions();
    }
  }, [statusFilter, activeSalon, loadPromotions]);

  const handlePromotionClick = async (promotionId: string) => {
    try {
      const { data } = await promotionsAPI.getPromotion(activeSalon!.id, promotionId);
      setSelectedPromotion(data);
      setDialogOpen(true);
    } catch (err) {
      setError('Failed to load promotion details');
      console.error(err);
    }
  };

  const handleEditPromotion = (promotionId: string) => {
    router.push(`/bms/promotions/${promotionId}`);
  };

  const handleDeletePromotion = async (promotionId: string) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await promotionsAPI.deletePromotion(activeSalon!.id, promotionId);
        await loadPromotions();
      } catch (err) {
        setError('Failed to delete promotion');
        console.error(err);
      }
    }
  };

  const getStatusColor = (status: PromotionStatus): 'success' | 'warning' | 'default' => {
    switch (status) {
      case PromotionStatus.ACTIVE:
        return 'success';
      case PromotionStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Promotions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/bms/promotions/new')}
        >
          Add Promotion
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={3}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as PromotionStatus)}
          >
            <MenuItem value={PromotionStatus.ACTIVE}>Active</MenuItem>
            <MenuItem value={PromotionStatus.ARCHIVED}>Archived</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {promotions.length === 0 && !loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography variant="h6" color="text.secondary">
            No promotions found for the selected status
          </Typography>
        </Box>
      ) : (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {promotions.map((promotion) => (
              <TableRow 
                key={promotion.id}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                onClick={() => handlePromotionClick(promotion.id)}
              >
                <TableCell>{promotion.name}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocalOffer fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        Click to view details
                      </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color="text.secondary">
                        Click to view details
                      </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                                     <Chip 
                     label={statusFilter} 
                     color={getStatusColor(statusFilter)}
                     size="small"
                   />
                </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      Click to view details
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      Click to view details
                    </Typography>
                  </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPromotion(promotion.id);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePromotion(promotion.id);
                      }}
                    >
                      <DeleteIcon />
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
        {selectedPromotion && (
          <>
            <DialogTitle>
              {selectedPromotion.name}
            </DialogTitle>
            <DialogContent>
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>Promotion Details</Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Type:</strong> {selectedPromotion.type}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Value:</strong> {selectedPromotion.value}
                    {selectedPromotion.type === PromotionType.PERCENTAGE ? '%' : ' PLN'}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Status:</strong> {selectedPromotion.status}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>Time Period</Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Start:</strong> {formatDate(selectedPromotion.startTime)}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>End:</strong> {selectedPromotion.endTime 
                      ? formatDate(selectedPromotion.endTime)
                      : 'No end date'
                    }
                  </Typography>
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="h6" gutterBottom>Applied To</Typography>
                  {selectedPromotion.serviceGroups.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>Service Groups:</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {selectedPromotion.serviceGroups.map((group) => (
                          <Chip key={group.id} label={group.name} size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}
                  {selectedPromotion.services.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Services:</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {selectedPromotion.services.map((service) => (
                          <Chip key={service.id} label={service.name} size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setDialogOpen(false);
                  handleEditPromotion(selectedPromotion.id);
                }}
              >
                Edit Promotion
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}