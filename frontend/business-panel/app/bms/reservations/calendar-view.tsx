"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  Event,
  SlotInfo,
  View,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  isWithinInterval,
  isBefore,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  Box,
  Typography,
  Button,
  Chip,
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
} from "@mui/material";
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person,
  Email,
  Phone,
} from "@mui/icons-material";
import { reservationsAPI, salonAPI, openHoursExceptionsAPI } from "@/lib/api";
import {
  ReservationDto,
  ReservationStatus,
  SalonDto,
  OpenHoursExceptionDto,
  DayOfWeek,
} from "@/types";
import { useSalon } from "@/context/SalonContext";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  pl: pl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent extends Event {
  reservation: ReservationDto;
}

export default function CalendarView() {
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [salonDetails, setSalonDetails] = useState<SalonDto | null>(null);
  const [openHoursExceptions, setOpenHoursExceptions] = useState<
    OpenHoursExceptionDto[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all"
  );
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const { activeSalon, loading: salonLoading } = useSalon();

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (view === Views.WEEK) {
        startDate = new Date(date);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 7);
      } else if (view === Views.DAY) {
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
      } else if (view === Views.MONTH) {
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      } else if (view === Views.AGENDA) {
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 30);
      }

      const { data } = await reservationsAPI.getAllReservations(
        activeSalon!.id,
        statusFilter !== "all" ? statusFilter : undefined,
        startDate,
        endDate
      );
      setReservations(data);
    } catch (err) {
      setError("Failed to load reservations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeSalon, statusFilter, view, date]);

  const loadSalonDetails = useCallback(async () => {
    try {
      const { data } = await salonAPI.getSalon(activeSalon!.id);
      setSalonDetails(data);
    } catch (err) {
      console.error("Failed to load salon details:", err);
    }
  }, [activeSalon]);

  const loadOpenHoursExceptions = useCallback(async () => {
    try {
      let startDate: Date;
      let endDate: Date;

      if (view === Views.WEEK) {
        startDate = new Date(date);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 7);
      } else if (view === Views.DAY) {
        startDate = new Date(date);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
      } else {
        startDate = new Date(date);
        startDate.setDate(startDate.getDate() - 30);
        endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 30);
      }

      const { data } = await openHoursExceptionsAPI.getAllExceptions(
        activeSalon!.id,
        {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
        }
      );
      setOpenHoursExceptions(data);
    } catch (err) {
      console.error("Failed to load open hours exceptions:", err);
    }
  }, [activeSalon, view, date]);

  useEffect(() => {
    if (activeSalon) {
      loadReservations();
      loadSalonDetails();
      loadOpenHoursExceptions();
    }
  }, [
    activeSalon,
    loadReservations,
    loadSalonDetails,
    loadOpenHoursExceptions,
  ]);

  const events: CalendarEvent[] = useMemo(() => {
    const mappedEvents = reservations.map((reservation) => {
      const startDate = new Date(reservation.startTime);
      const endDate = new Date(reservation.endTime);

      return {
        id: reservation.id,
        title: `${reservation.clientName} - ${reservation.serviceName}`,
        start: startDate,
        end: endDate,
        reservation,
      };
    });

    return mappedEvents;
  }, [reservations]);

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleSlotSelect = (slotInfo: SlotInfo) => {
    const startTime = slotInfo.start.toISOString();
    const endTime = slotInfo.end.toISOString();
    router.push(
      `/bms/reservations/new?startTime=${startTime}&endTime=${endTime}`
    );
  };

  const handleConfirmReservation = async (reservationId: string) => {
    try {
      await reservationsAPI.confirmReservation(activeSalon!.id, reservationId, );
      await loadReservations();
      setDialogOpen(false);
    } catch (err) {
      setError("Failed to confirm reservation");
      console.error(err);
    }
  };

  const handleCompleteReservation = async (reservationId: string) => {
    try {
      await reservationsAPI.completeReservation(activeSalon!.id, reservationId, );
      await loadReservations();
      setDialogOpen(false);
    } catch (err) {
      setError("Failed to complete reservation");
      console.error(err);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      await reservationsAPI.cancelReservation(activeSalon!.id, reservationId);
      await loadReservations();
      setDialogOpen(false);
    } catch (err) {
      setError("Failed to cancel reservation");
      console.error(err);
    }
  };

  const getStatusColor = (
    status: ReservationStatus
  ): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return "success";
      case ReservationStatus.PENDING:
        return "warning";
      case ReservationStatus.CANCELLED:
        return "error";
      case ReservationStatus.COMPLETED:
        return "success";
      default:
        return "default";
    }
  };

  const getDayOfWeek = (date: Date): DayOfWeek => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return days[date.getDay()] as DayOfWeek;
  };

  const isWithinWorkingHours = (date: Date): boolean => {
    if (!salonDetails?.openHours) return true;

    const dayOfWeek = getDayOfWeek(date);
    const openHours = salonDetails.openHours.find(
      (oh) => oh.dayOfWeek === dayOfWeek
    );

    if (!openHours) return false;

    const timeString = date.toTimeString().slice(0, 5);
    const openTime = openHours.open;
    const closeTime = openHours.close;

    if (closeTime < openTime) {
      return timeString >= openTime || timeString < closeTime;
    }

    return timeString >= openTime && timeString < closeTime;
  };

  const isAffectedByException = (
    date: Date
  ): { isWorking?: boolean; isException: boolean } => {
    if (!openHoursExceptions.length) {
      return { isException: false };
    }

    const exception = openHoursExceptions.find(
      (ex) => (isWithinInterval(date, {start: ex.startTime, end: ex.endTime}) && isBefore(date, ex.endTime))
    );

    if (exception) {
      return { isWorking: exception.isWorking, isException: true };
    }

    return { isException: false };
  };

  const getTimeScale = () => {
    return {
      min: new Date(0, 0, 0, 0, 0, 0),
      max: new Date(0, 0, 0, 23, 59, 0),
    };
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.reservation.status;
    let backgroundColor = "#3174ad";
    let borderColor = "#3174ad";

    switch (status) {
      case ReservationStatus.CONFIRMED:
        backgroundColor = "#4caf50";
        borderColor = "#4caf50";
        break;
      case ReservationStatus.PENDING:
        backgroundColor = "#ff9800";
        borderColor = "#ff9800";
        break;
      case ReservationStatus.CANCELLED:
        backgroundColor = "#f44336";
        borderColor = "#f44336";
        break;
      case ReservationStatus.COMPLETED:
        backgroundColor = "#2196f3";
        borderColor = "#2196f3";
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "2px solid",
        display: "block",
        fontSize: "12px",
        fontWeight: "bold",
      },
    };
  };

  const slotPropGetter = (date: Date) => {
    const withinWorkingHours = isWithinWorkingHours(date);
    const exception = isAffectedByException(date);

    let backgroundColor = "#ffffff";
    let color = "#000000";
    let opacity = 1;

    if (exception.isException) {
      if (!exception.isWorking) {
        backgroundColor = "#e0e0e0";
        color = "#424242";
        opacity = 0.8;
      } else {
        backgroundColor = "#ffffff";
        color = "#000000";
        opacity = 1;
      }
    } else if (!withinWorkingHours) {
      backgroundColor = "#e0e0e0";
      color = "#424242";
      opacity = 0.8;
    }

    return {
      style: {
        backgroundColor,
        color,
        opacity,
      },
    };
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pl-PL");
  };

  if (salonLoading || loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!activeSalon) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography variant="h6" color="text.secondary">
          No salon selected
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Calendar View
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() => router.push("/bms/reservations")}
          >
            List View
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/bms/reservations/new")}
          >
            Add Reservation
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} alignItems="center">
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) =>
              setStatusFilter(e.target.value as ReservationStatus | "all")
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value={ReservationStatus.PENDING}>Pending</MenuItem>
            <MenuItem value={ReservationStatus.CONFIRMED}>Confirmed</MenuItem>
            <MenuItem value={ReservationStatus.COMPLETED}>Completed</MenuItem>
            <MenuItem value={ReservationStatus.CANCELLED}>Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Working Hours Legend:
        </Typography>
        <Box display="flex" gap={3} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 20,
                height: 20,
                bgcolor: "#ffffff",
                border: "1px solid #ddd",
              }}
            />
            <Typography variant="body2">Regular working hours</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{ width: 20, height: 20, bgcolor: "#e0e0e0", opacity: 0.8 }}
            />
            <Typography variant="body2">Closed (outside hours)</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{ width: 20, height: 20, bgcolor: "#ffffff", opacity: 1 }}
            />
            <Typography variant="body2">Special opening (exception)</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{ width: 20, height: 20, bgcolor: "#e0e0e0", opacity: 0.8 }}
            />
            <Typography variant="body2">Special closing (exception)</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ height: "calc(100vh - 200px)" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleEventSelect}
          onSelectSlot={handleSlotSelect}
          selectable
          eventPropGetter={eventStyleGetter}
          slotPropGetter={slotPropGetter}
          length={30}
          messages={{
            next: "Next",
            previous: "Previous",
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            agenda: "Agenda",
            date: "Date",
            time: "Time",
            event: "Event",
            noEventsInRange: "No reservations in this range",
            showMore: (total: number) => `+${total} more`,
          }}
          min={getTimeScale().min}
          max={getTimeScale().max}
          step={30}
          timeslots={2}
        />
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogContent>
              <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
                gap={3}
              >
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Client Information
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Person fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedEvent.reservation.clientName}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Email fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedEvent.reservation.clientEmail}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Phone fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedEvent.reservation.clientPhone}
                    </Typography>
                  </Box>
                  {selectedEvent.reservation.clientNotes && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      <strong>Notes:</strong>{" "}
                      {selectedEvent.reservation.clientNotes}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Service Details
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Service:</strong>{" "}
                    {selectedEvent.reservation.serviceName}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Salon:</strong>{" "}
                    {selectedEvent.reservation.salonName}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Price:</strong>{" "}
                    {selectedEvent.reservation.promotion ? (
                      <>
                        <span
                          style={{
                            color: "#4caf50",
                            fontWeight: "bold",
                            marginLeft: "8px",
                          }}
                        >
                          {selectedEvent.reservation.price} PLN
                        </span>
                        <span
                          style={{
                            color: "#4caf50",
                            fontSize: "0.8em",
                            marginLeft: "4px",
                          }}
                        >
                          (
                          {selectedEvent.reservation.promotion.type ===
                          "PERCENTAGE"
                            ? `-${selectedEvent.reservation.promotion.value}%`
                            : `-${selectedEvent.reservation.promotion.value}zł`}
                          )
                        </span>
                      </>
                    ) : (
                      `${selectedEvent.reservation.price} PLN`
                    )}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Status:</strong>
                    <Chip
                      label={selectedEvent.reservation.status}
                      color={getStatusColor(selectedEvent.reservation.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>

                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography variant="h6" gutterBottom>
                    Schedule
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      <strong>Start:</strong>{" "}
                      {formatDateTime(selectedEvent.reservation.startTime)}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    <strong>End:</strong>{" "}
                    {formatDateTime(selectedEvent.reservation.endTime)}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>

              {selectedEvent.reservation.status ===
                ReservationStatus.PENDING && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() =>
                    handleConfirmReservation(selectedEvent.reservation.id)
                  }
                >
                  Confirm
                </Button>
              )}

              {selectedEvent.reservation.status ===
                ReservationStatus.CONFIRMED && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ScheduleIcon />}
                  onClick={() =>
                    handleCompleteReservation(selectedEvent.reservation.id)
                  }
                >
                  Complete
                </Button>
              )}

              {selectedEvent.reservation.status !==
                ReservationStatus.CANCELLED &&
                selectedEvent.reservation.status !==
                  ReservationStatus.COMPLETED && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() =>
                      handleCancelReservation(selectedEvent.reservation.id)
                    }
                  >
                    Cancel
                  </Button>
                )}

              <Button
                variant="contained"
                onClick={() => {
                  setDialogOpen(false);
                  router.push(
                    `/bms/reservations/${selectedEvent.reservation.id}`
                  );
                }}
              >
                Edit Reservation
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
