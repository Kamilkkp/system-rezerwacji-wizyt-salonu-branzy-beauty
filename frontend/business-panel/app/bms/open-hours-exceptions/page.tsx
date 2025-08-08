"use client";

import { useState, useEffect, useCallback } from "react";
import { useSalon } from "@/context/SalonContext";
import { openHoursExceptionsAPI } from "@/lib/api";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
} from "@mui/material";
import { EventBusy, Add, Edit, Delete } from "@mui/icons-material";
import { OpenHoursExceptionDto, CreateOpenHoursExceptionDto } from "@/types";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, addDays } from "date-fns";
import { pl } from "date-fns/locale";

export default function OpenHoursExceptionsPage() {
  const { activeSalon } = useSalon();
  const [exceptions, setExceptions] = useState<OpenHoursExceptionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingException, setEditingException] =
    useState<OpenHoursExceptionDto | null>(null);
  const [formData, setFormData] = useState<CreateOpenHoursExceptionDto>({
    isWorking: false,
    startTime: "",
    endTime: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const loadExceptions = useCallback(async () => {
    if (!activeSalon) return;

    setLoading(true);
    setError(null);

    try {
      const startDate = format(addDays(selectedDate, -1), "yyyy-MM-dd");
      const endDate = format(addDays(selectedDate, 1), "yyyy-MM-dd");

      const response = await openHoursExceptionsAPI.getAllExceptions(
        activeSalon.id,
        {
          startDate,
          endDate,
        }
      );
      setExceptions(response.data);
    } catch (err: unknown) {
      console.error("Failed to load exceptions:", err);
      let errorMessage = "Failed to load exceptions";
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } })
          .response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [activeSalon, selectedDate]);

  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  const handleOpenDialog = (exception?: OpenHoursExceptionDto) => {
    if (exception) {
      setEditingException(exception);
      setFormData({
        isWorking: exception.isWorking,
        startTime: formatDateForInput(exception.startTime),
        endTime: formatDateForInput(exception.endTime),
      });
    } else {
      setEditingException(null);
      setFormData({
        isWorking: false,
        startTime: "",
        endTime: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingException(null);
    setFormData({
      isWorking: false,
      startTime: "",
      endTime: "",
    });
  };

  const handleSubmit = async () => {
    if (!activeSalon) return;

    if (!formData.startTime || !formData.endTime) {
      setError("Start time and end time are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingException) {
        await openHoursExceptionsAPI.updateException(
          activeSalon.id,
          editingException.id,
          {
            ...formData,
            startTime: new Date(formData.startTime).toISOString(),
            endTime: new Date(formData.endTime).toISOString(),
          }
        );
        setSuccess("Exception updated successfully");
      } else {
        await openHoursExceptionsAPI.createException(activeSalon.id, {
          ...formData,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
        });
        setSuccess("Exception created successfully");
      }

      handleCloseDialog();
      loadExceptions();
    } catch (err: unknown) {
      console.error("Failed to save exception:", err);
      let errorMessage = "Failed to save exception";
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } })
          .response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeSalon) return;

    if (!confirm("Are you sure you want to delete this exception?")) return;

    setLoading(true);
    setError(null);

    try {
      await openHoursExceptionsAPI.deleteException(activeSalon.id, id);
      setSuccess("Exception deleted successfully");
      loadExceptions();
    } catch (err: unknown) {
      console.error("Failed to delete exception:", err);
      let errorMessage = "Failed to delete exception";
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } })
          .response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

const formatDateForInput = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
};

  const formatDateForDisplay = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
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
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <EventBusy sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Open Hours Exceptions
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage exceptions to regular opening hours (e.g., holidays, special
        hours, closures).
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

      <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Calendar View</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              disabled={loading}
            >
              Add Exception
            </Button>
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={pl}>
            <DateCalendar
              value={selectedDate}
              onChange={(newDate) => {
                if (newDate) {
                  setSelectedDate(newDate);
                }
              }}
              sx={{
                width: "100%",
                "& .MuiPickersDay-root": {
                  fontSize: "0.875rem",
                },
              }}
            />
          </LocalizationProvider>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Exceptions for{" "}
            {format(selectedDate, "EEEE, MMMM d, yyyy", { locale: pl })}
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {exceptions.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 3 }}
                >
                  No exceptions found for this period
                </Typography>
              ) : (
                <List>
                  {exceptions.map((exception) => (
                    <Card key={exception.id} sx={{ mb: 2 }}>
                      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Chip
                                label={
                                  exception.isWorking ? "Working" : "Closed"
                                }
                                color={
                                  exception.isWorking ? "success" : "error"
                                }
                                size="small"
                                sx={{ mr: 1 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {formatDateForDisplay(exception.startTime)} -{" "}
                              {formatDateForDisplay(exception.endTime)}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(exception)}
                              disabled={loading}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(exception.id)}
                              disabled={loading}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </List>
              )}
            </>
          )}
        </Paper>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingException ? "Edit Exception" : "Add Exception"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isWorking}
                  onChange={(e) =>
                    setFormData({ ...formData, isWorking: e.target.checked })
                  }
                  disabled={loading}
                />
              }
              label={formData.isWorking ? "Working Hours" : "Closed"}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Start Time"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              margin="normal"
              required
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="End Time"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              margin="normal"
              required
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.startTime || !formData.endTime}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : editingException ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
