import { v4 as uuidv4 } from 'uuid';
import {
  parseISO,
  addDays,
  addMinutes,
  isAfter,
  isBefore,
  differenceInMinutes
} from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import {
  getTaskById,
  updateTask,
  getPreferences
} from './storageService.js';
import {
  getAuthenticatedClient,
  createEvent,
  deleteEvent
} from './googleCalendarService.js';

// Parse time string (HH:mm) to hours and minutes
function parseTimeString(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

// Set time on a date in a specific timezone
// Creates a UTC Date that corresponds to the given hours:minutes in the target timezone
function setTimeOnDateInTz(date, timeStr, timezone) {
  const { hours, minutes } = parseTimeString(timeStr);
  // Get the date in the user's timezone
  const zonedDate = toZonedTime(date, timezone);
  // Set hours/minutes on the zoned date
  zonedDate.setHours(hours, minutes, 0, 0);
  // Convert back to UTC
  return fromZonedTime(zonedDate, timezone);
}

// Get start of day in a specific timezone
function startOfDayInTz(date, timezone) {
  const zonedDate = toZonedTime(date, timezone);
  zonedDate.setHours(0, 0, 0, 0);
  return fromZonedTime(zonedDate, timezone);
}

// Get end of day in a specific timezone
function endOfDayInTz(date, timezone) {
  const zonedDate = toZonedTime(date, timezone);
  zonedDate.setHours(23, 59, 59, 999);
  return fromZonedTime(zonedDate, timezone);
}

// Map JS getDay() (0=Sun) to our day keys
const DAY_INDEX_TO_KEY = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

// Check if a date falls on a working day (in user's timezone)
function isWorkingDay(date, workingDays, timezone) {
  if (!workingDays) return true; // Default: all days are working days
  const zonedDate = toZonedTime(date, timezone);
  const dayKey = DAY_INDEX_TO_KEY[zonedDate.getDay()];
  return workingDays[dayKey] !== false; // Default to true if not specified
}

// Find available time slots between busy periods
// override: { skipDayCheck: true, customHours: { start, end } }
export function findAvailableSlots(busyPeriods, preferences, dateRange, minDuration = 30, override = null) {
  const slots = [];
  const { workingHours, workingDays } = preferences;
  const timezone = preferences.timezone || 'America/New_York';

  // Use override hours if provided, otherwise use preferences
  const effectiveHours = override?.customHours || workingHours;

  // Process each day in the range
  let currentDate = startOfDayInTz(dateRange.start, timezone);
  const endDate = endOfDayInTz(dateRange.end, timezone);

  while (isBefore(currentDate, endDate)) {
    // Check if this is a working day (skip check if override)
    if (!override?.skipDayCheck && !isWorkingDay(currentDate, workingDays, timezone)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    const dayStart = setTimeOnDateInTz(currentDate, effectiveHours.start, timezone);
    const dayEnd = setTimeOnDateInTz(currentDate, effectiveHours.end, timezone);

    // Skip if day start is in the past
    const now = new Date();
    const effectiveStart = isAfter(now, dayStart) ? now : dayStart;

    if (isBefore(effectiveStart, dayEnd)) {
      // Get busy periods for this day
      const dayBusy = busyPeriods
        .map(b => ({
          start: typeof b.start === 'string' ? parseISO(b.start) : b.start,
          end: typeof b.end === 'string' ? parseISO(b.end) : b.end
        }))
        .filter(b =>
          (isBefore(b.start, dayEnd) && isAfter(b.end, effectiveStart))
        )
        .sort((a, b) => a.start - b.start);

      // Find gaps between busy periods
      let currentTime = effectiveStart;

      for (const busy of dayBusy) {
        // If there's a gap before this busy period
        if (isBefore(currentTime, busy.start)) {
          const slotDuration = differenceInMinutes(busy.start, currentTime);
          if (slotDuration >= minDuration) {
            slots.push({
              id: uuidv4(),
              start: currentTime.toISOString(),
              end: busy.start.toISOString(),
              duration: slotDuration,
              date: formatInTimeZone(currentDate, timezone, 'yyyy-MM-dd'),
              displayDate: formatInTimeZone(currentDate, timezone, 'EEE, MMM d'),
              displayTime: `${formatInTimeZone(currentTime, timezone, 'h:mm a')} - ${formatInTimeZone(busy.start, timezone, 'h:mm a')}`,
              isOverride: !!override
            });
          }
        }
        // Move past the busy period
        if (isAfter(busy.end, currentTime)) {
          currentTime = busy.end;
        }
      }

      // Check remaining time until end of work day
      if (isBefore(currentTime, dayEnd)) {
        const slotDuration = differenceInMinutes(dayEnd, currentTime);
        if (slotDuration >= minDuration) {
          slots.push({
            id: uuidv4(),
            start: currentTime.toISOString(),
            end: dayEnd.toISOString(),
            duration: slotDuration,
            date: formatInTimeZone(currentDate, timezone, 'yyyy-MM-dd'),
            displayDate: formatInTimeZone(currentDate, timezone, 'EEE, MMM d'),
            displayTime: `${formatInTimeZone(currentTime, timezone, 'h:mm a')} - ${formatInTimeZone(dayEnd, timezone, 'h:mm a')}`,
            isOverride: !!override
          });
        }
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  return slots;
}

// Split a task into sessions based on available slots
export function splitTaskIntoSessions(task, availableSlots, sessionLength, timezone = 'America/New_York') {
  const sessions = [];
  let remainingDuration = task.estimatedDuration;
  const maxSession = Math.min(sessionLength, 240); // Cap at 4 hours

  for (const slot of availableSlots) {
    if (remainingDuration <= 0) break;

    // Calculate how much of this slot we can use
    const usableDuration = Math.min(
      slot.duration,
      maxSession,
      remainingDuration
    );

    if (usableDuration >= 30) { // Minimum 30 min session
      const startTime = parseISO(slot.start);
      const endTime = addMinutes(startTime, usableDuration);

      sessions.push({
        sessionId: uuidv4(),
        slotId: slot.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: usableDuration,
        date: slot.date,
        displayDate: slot.displayDate,
        displayTime: `${formatInTimeZone(startTime, timezone, 'h:mm a')} - ${formatInTimeZone(endTime, timezone, 'h:mm a')}`,
        isOverride: slot.isOverride || false
      });

      remainingDuration -= usableDuration;
    }
  }

  return {
    sessions,
    totalScheduled: task.estimatedDuration - remainingDuration,
    remainingDuration,
    fullyScheduled: remainingDuration <= 0
  };
}

// Schedule a task by creating calendar events
export async function scheduleTask(taskId, slots, sessionPreference) {
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const preferences = await getPreferences();
  const client = await getAuthenticatedClient();

  if (!client) {
    throw new Error('Not authenticated');
  }

  const sessionLength = sessionPreference || preferences.defaultSessionLength;
  const scheduledSessions = [...(task.scheduledSessions || [])];

  for (const slot of slots) {
    // Create calendar event
    const event = await createEvent(client, {
      summary: task.name,
      description: `Scheduled task session\nTask ID: ${taskId}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timezone: preferences.timezone
    });

    scheduledSessions.push({
      sessionId: slot.sessionId || uuidv4(),
      calendarEventId: event.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      status: 'scheduled',
      isOverride: slot.isOverride || false
    });
  }

  // Calculate total scheduled time
  const totalScheduled = scheduledSessions.reduce((sum, s) => sum + s.duration, 0);
  const remainingDuration = task.estimatedDuration - totalScheduled;

  // Update task status
  let status = 'backlog';
  if (totalScheduled > 0) {
    status = remainingDuration <= 0 ? 'scheduled' : 'partial';
  }

  const updatedTask = await updateTask(taskId, {
    scheduledSessions,
    sessionPreference: sessionLength,
    status
  });

  return {
    task: updatedTask,
    sessionsCreated: slots.length,
    totalScheduled,
    remainingDuration
  };
}

// Unschedule a session (delete from calendar and task)
export async function unscheduleSession(taskId, sessionId) {
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const session = task.scheduledSessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const client = await getAuthenticatedClient();
  if (!client) {
    throw new Error('Not authenticated');
  }

  // Delete from Google Calendar
  if (session.calendarEventId) {
    try {
      await deleteEvent(client, session.calendarEventId);
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
    }
  }

  // Remove session from task
  const updatedSessions = task.scheduledSessions.filter(s => s.sessionId !== sessionId);

  // Recalculate status
  const totalScheduled = updatedSessions.reduce((sum, s) => sum + s.duration, 0);
  let status = 'backlog';
  if (totalScheduled > 0) {
    status = totalScheduled >= task.estimatedDuration ? 'scheduled' : 'partial';
  }

  const updatedTask = await updateTask(taskId, {
    scheduledSessions: updatedSessions,
    status
  });

  return {
    task: updatedTask,
    remainingDuration: task.estimatedDuration - totalScheduled
  };
}
