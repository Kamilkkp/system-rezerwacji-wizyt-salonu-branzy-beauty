'use client';

import { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { mailingSystemAPI } from '@/lib/api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { Email, Send } from '@mui/icons-material';

export default function MailingSystemPage() {
  const { activeSalon } = useSalon();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeSalon) {
      setError('No active salon selected');
      return;
    }

    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await mailingSystemAPI.sendEmailMessage(activeSalon.id, {
        subject: subject.trim(),
        content: content.trim(),
      });

      setSuccess(response.data.message);
      setSubject('');
      setContent('');
    } catch (err: unknown) {
      console.error('Failed to send email:', err);
      let errorMessage = 'Failed to send email';
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
  };

  if (!activeSalon) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No active salon selected</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Email sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Mailing System
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Send marketing emails to clients who have given consent to receive promotional messages.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Send Email Campaign
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            placeholder="Enter email subject..."
          />
          
          <TextField
            fullWidth
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            margin="normal"
            required
            multiline
            rows={8}
            disabled={loading}
            placeholder="Enter email content..."
            helperText="This content will be sent to all clients who have given marketing consent."
          />
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Send />}
              disabled={loading || !subject.trim() || !content.trim()}
              size="large"
            >
              {loading ? 'Sending...' : 'Send Email Campaign'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => {
                setSubject('');
                setContent('');
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
            >
              Clear Form
            </Button>
          </Box>
        </form>
      </Paper>

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
          <Typography variant="h6" sx={{ mb: 2 }}>
            Important Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary" paragraph>
            • Emails will only be sent to clients who have given marketing consent during their reservation.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Each email includes an unsubscribe link for compliance with email marketing regulations.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
} 