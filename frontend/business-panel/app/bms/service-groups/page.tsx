'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group,
  LocalOffer,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { serviceGroupsAPI, servicesAPI } from '@/lib/api';
import { ServiceGroupDto, ServiceGroupStatus, ServiceStatus } from '@/types';
import { useSalon } from '@/context/SalonContext';

export default function ServiceGroupsPage() {
  const router = useRouter();
  const [serviceGroups, setServiceGroups] = useState<ServiceGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ServiceGroupStatus | 'ALL'>('ALL');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<ServiceStatus | 'ALL'>('ALL');

  const { activeSalon, loading: salonLoading } = useSalon();

  const loadServiceGroups = useCallback(async () => {
    if (!activeSalon) return;

    setLoading(true);
    setError('');

    try {
      const [activeGroupsResponse, archivedGroupsResponse] = await Promise.all([
        serviceGroupsAPI.getAllServiceGroups(activeSalon.id, ServiceGroupStatus.ACTIVE),
        serviceGroupsAPI.getAllServiceGroups(activeSalon.id, ServiceGroupStatus.ARCHIVED)
      ]);

      const allGroups = [...activeGroupsResponse.data, ...archivedGroupsResponse.data];
      const groupsWithDetails: ServiceGroupDto[] = [];

      for (const group of allGroups) {
        try {
          const groupDetails = await serviceGroupsAPI.getServiceGroup(
            activeSalon.id,
            group.id,
            ServiceStatus.ACTIVE
          );

          try {
            const archivedServicesResponse = await serviceGroupsAPI.getServiceGroup(
              activeSalon.id,
              group.id,
              ServiceStatus.ARCHIVED
            );

            const allServices = [
              ...(groupDetails.data.services || []),
              ...(archivedServicesResponse.data.services || [])
            ];

            groupDetails.data.services = allServices;
          } catch (err) {
            console.error(`Failed to load services with promotions for ${group.name}:`, err);
          }

          groupsWithDetails.push(groupDetails.data);
        } catch (err) {
          console.error(`Failed to load group details for ${group.id} (${group.name}):`, err);
          if (err && typeof err === 'object' && 'response' in err) {
            const errorResponse = err as { response?: { data?: unknown; status?: number } };
            console.error('Error details:', errorResponse.response?.data);
            console.error('Error status:', errorResponse.response?.status);
          }

          groupsWithDetails.push({
            id: group.id,
            name: group.name,
            description: undefined,
            services: [],
            status: ServiceGroupStatus.ACTIVE,
            salonId: activeSalon!.id,
            createdAt: '',
            updatedAt: ''
          });
        }
      }

      setServiceGroups(groupsWithDetails);
    } catch (err) {
      console.error('Error loading service groups:', err);
      setError('Failed to load service groups');
    } finally {
      setLoading(false);
    }
  }, [activeSalon]);

  useEffect(() => {
    if (activeSalon && !salonLoading) {
      loadServiceGroups();
    }
  }, [loadServiceGroups, salonLoading, activeSalon]);

  const handleEditGroup = (groupId: string) => {
    router.push(`/bms/service-groups/${groupId}`);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this service group?')) {
      try {
        await serviceGroupsAPI.deleteServiceGroup(activeSalon?.id || '', groupId);
        await loadServiceGroups();
      } catch (err) {
        setError('Failed to delete service group');
        console.error(err);
      }
    }
  };

  const handleEditService = (groupId: string, serviceId: string) => {
    router.push(`/bms/service-groups/services/${groupId}/${serviceId}`);
  };

  const handleDeleteService = async (groupId: string, serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await servicesAPI.deleteService(activeSalon?.id || '', groupId, serviceId);
        await loadServiceGroups();
      } catch (err) {
        setError('Failed to delete service');
        console.error(err);
      }
    }
  };

  const handleToggleGroupStatus = async (groupId: string, currentStatus: ServiceGroupStatus) => {
    const newStatus = currentStatus === ServiceGroupStatus.ACTIVE 
      ? ServiceGroupStatus.ARCHIVED 
      : ServiceGroupStatus.ACTIVE;
    
    try {
      await serviceGroupsAPI.updateServiceGroup(
        activeSalon?.id || '', 
        groupId,
        { status: newStatus }
      );
      await loadServiceGroups();
    } catch (err) {
      setError('Failed to update group status');
      console.error(err);
    }
  };

  const handleToggleServiceStatus = async (groupId: string, serviceId: string, currentStatus: ServiceStatus) => {
    const newStatus = currentStatus === ServiceStatus.ACTIVE 
      ? ServiceStatus.ARCHIVED 
      : ServiceStatus.ACTIVE;
    
    try {
      await servicesAPI.updateService(
        activeSalon?.id || '', 
        groupId,
        serviceId,
        { status: newStatus }
      );
      await loadServiceGroups();
      
      if (newStatus === ServiceStatus.ARCHIVED && serviceStatusFilter === ServiceStatus.ACTIVE) {
        setServiceStatusFilter(ServiceStatus.ARCHIVED);
      }
      else if (newStatus === ServiceStatus.ACTIVE && serviceStatusFilter === ServiceStatus.ARCHIVED) {
        setServiceStatusFilter(ServiceStatus.ACTIVE);
      }
    } catch (err) {
      setError('Failed to update service status');
      console.error(err);
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Service Groups
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Groups</InputLabel>
            <Select
              value={statusFilter}
              label="Filter Groups"
              onChange={(e) => setStatusFilter(e.target.value as ServiceGroupStatus | 'ALL')}
              startAdornment={<FilterIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="ALL">All Groups</MenuItem>
              <MenuItem value={ServiceGroupStatus.ACTIVE}>Active Groups</MenuItem>
              <MenuItem value={ServiceGroupStatus.ARCHIVED}>Archived Groups</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Services</InputLabel>
            <Select
              value={serviceStatusFilter}
              label="Filter Services"
              onChange={(e) => setServiceStatusFilter(e.target.value as ServiceStatus | 'ALL')}
              startAdornment={<FilterIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="ALL">All Services</MenuItem>
              <MenuItem value={ServiceStatus.ACTIVE}>Active Services</MenuItem>
              <MenuItem value={ServiceStatus.ARCHIVED}>Archived Services</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={() => {
              setStatusFilter('ALL');
              setServiceStatusFilter('ALL');
            }}
            disabled={statusFilter === 'ALL' && serviceStatusFilter === 'ALL'}
          >
            Clear Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/bms/service-groups/new')}
          >
            Add Service Group
          </Button>
        </Box>
      </Box>



      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {(statusFilter !== 'ALL' || serviceStatusFilter !== 'ALL') && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Active filters: 
            {statusFilter !== 'ALL' && ` Groups: ${statusFilter}`}
            {statusFilter !== 'ALL' && serviceStatusFilter !== 'ALL' && ' | '}
            {serviceStatusFilter !== 'ALL' && ` Services: ${serviceStatusFilter}`}
          </Typography>
        </Alert>
      )}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          All services (active and archived) are loaded for each group. Use the service filter to show only specific statuses.
        </Typography>
      </Alert>

      <Paper>
        <List>
          {serviceGroups
            .filter(group => statusFilter === 'ALL' || group.status === statusFilter)
            .map((group, groupIndex) => (
            <React.Fragment key={group.id}>
              <ListItem>
                <ListItemIcon>
                  <Group />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" fontWeight="medium">
                        {group.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1, 
                          bgcolor: group.status === 'ACTIVE' ? 'success.light' : 'warning.light',
                          color: group.status === 'ACTIVE' ? 'success.dark' : 'warning.dark'
                        }}
                      >
                        {group.status}
                      </Typography>
                      {group.description && (
                        <Typography variant="body2" color="text.secondary">
                          - {group.description}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={`${group.services?.filter(service => serviceStatusFilter === 'ALL' || service.status === serviceStatusFilter).length || 0} of ${group.services?.length || 0} services`}
                />
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => router.push(`/bms/service-groups/services/${group.id}/new`)}
                  >
                    Add Service
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color={group.status === ServiceGroupStatus.ACTIVE ? "warning" : "success"}
                    onClick={() => handleToggleGroupStatus(group.id, group.status)}
                  >
                    {group.status === ServiceGroupStatus.ACTIVE ? 'Archive' : 'Activate'}
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleEditGroup(group.id)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>

              {group.services && group.services.length > 0 ? (
                group.services
                  .filter(service => serviceStatusFilter === 'ALL' || service.status === serviceStatusFilter)
                  .map((service) => (
                  <ListItem key={service.id} sx={{ pl: 4 }}>
                    <ListItemIcon>
                      <LocalOffer fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                                            primary={
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="body1">
                            {service.name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="text.secondary">
                            {service.price} PLN
                          </Typography>
                            {service.priceAfterDiscount && service.priceAfterDiscount !== service.price && (
                              <Typography variant="body2" color="success.main" fontWeight="bold">
                                → {service.priceAfterDiscount} PLN
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {service.durationMin || 0} min
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1, 
                              bgcolor: service.status === 'ACTIVE' ? 'success.light' : 'warning.light',
                              color: service.status === 'ACTIVE' ? 'success.dark' : 'warning.dark'
                            }}
                          >
                            {service.status}
                          </Typography>
                        </Box>
                      }
                      secondary={service.description || 'No description'}
                    />
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        color={service.status === ServiceStatus.ACTIVE ? "warning" : "success"}
                        onClick={() => handleToggleServiceStatus(group.id, service.id, service.status)}
                      >
                        {service.status === ServiceStatus.ACTIVE ? 'Archive' : 'Activate'}
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleEditService(group.id, service.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteService(group.id, service.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))
              ) : (
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText
                    secondary={
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        {group.services && group.services.length > 0 
                          ? `No services match the current filter (${serviceStatusFilter})`
                          : 'No services in this group'
                        }
                      </Typography>
                    }
                  />
                </ListItem>
              )}

              {groupIndex < serviceGroups.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {serviceGroups.filter(group => statusFilter === 'ALL' || group.status === statusFilter).length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No service groups found
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Create your first service group to get started
          </Typography>
        </Box>
      )}
    </Box>
  );
} 