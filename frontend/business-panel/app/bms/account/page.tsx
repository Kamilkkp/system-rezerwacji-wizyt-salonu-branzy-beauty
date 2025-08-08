'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Person,
  Email,
  CalendarToday,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { accountAPI } from '@/lib/api';
import { AccountDto, UpdateAccountDto } from '@/types';
import { useRouter } from 'next/navigation';

const accountSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function AccountPage() {
  const [account, setAccount] = useState<AccountDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  const router = useRouter();

  const loadAccount = useCallback(async () => {
    try {
      const { data } = await accountAPI.getAccount();
      setAccount(data);
      reset({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError('Failed to load account information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const onSubmit = async (data: AccountFormData) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData: Partial<UpdateAccountDto> = {};
      
      if (data.firstName) updateData.firstName = data.firstName;
      if (data.lastName) updateData.lastName = data.lastName;
      if (data.email) updateData.email = data.email;
      if (data.password) updateData.password = data.password;

      await accountAPI.updateAccount(updateData);
      setSuccess('Account updated successfully');
      await loadAccount();
    } catch (err) {
      setError('Failed to update account');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await accountAPI.deleteAccount();
        setSuccess('Account deleted successfully');
        
        setTimeout(() => {
          router.push('/auth/login');
        }, 1500);
      } catch (err) {
        setError('Failed to delete account');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Account Settings
      </Typography>

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

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
                {account?.firstName?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {account?.firstName} {account?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {account?.email}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" mb={1}>
              <Person fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">
                Member since {account?.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" mb={1}>
              <Email fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {account?.email}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center">
              <CalendarToday fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">
                Last updated: {account?.updatedAt ? new Date(account.updatedAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Edit Profile
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="First Name"
                margin="normal"
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />

              <TextField
                fullWidth
                label="Last Name"
                margin="normal"
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />

              <TextField
                fullWidth
                label="Email"
                margin="normal"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Change Password (optional)
              </Typography>

              <TextField
                fullWidth
                label="New Password"
                margin="normal"
                type="password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                margin="normal"
                type="password"
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />

              <Box display="flex" gap={2} mt={3}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={20} /> : 'Save Changes'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mt: 3, border: '1px solid #f44336' }}>
        <CardContent>
          <Typography variant="h6" color="error" gutterBottom>
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Once you delete your account, there is no going back. Please be certain.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}