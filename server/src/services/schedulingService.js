import { v4 as uuidv4 } from 'uuid';
import {
  parseISO,
  startOfDay,
  endOfDay,
  addDays,
  addMinutes,
  setHours,
  setMinutes,
  isAfter,
  isBefore,
  differenceInMinutes,
  format
} from 'date-fns';
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

// Set time on a date
function setTimeOnDate(date, timeStr) {
  const { hours, minutes } = parseTimeString(timeStr);
  return setMinutes(setHours(date, hours), minutes);
}

// Find available time slots between busy periods
export function findAvailableSlots(busyPeriods, preferences, dateRange, minDuration = 30) {
  const slots = [];
  const { workingHours } = preferences;

  // Process each day in the range
  let currentDate = startOfDay(dateRange.start);
  const endDate = endOfDay(dateRange.end);

  while (isBefore(currentDate, endDate)) {
    const dayStart = setTimeOnDate(currentDate, workingHours.start);
    const dayEnd = setTimeOnDate(currentDate, workingHours.end);

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
              date: format(currentDate, 'yyyy-MM-dd'),
              displayDate: format(currentDate, 'EEE, MMM d'),
              displayTime: `${format(currentTime, 'h:mm a')} - ${format(busy.start, 'h:mm a')}`
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
            date: format(currentDate, 'yyyy-MM-dd'),
            displayDate: format(currentDate, 'EEE, MMM d'),
            displayTime: `${format(currentTime, 'h:mm a')} - ${format(dayEnd, 'h:mm a')}`
          });
        }
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  return slots;
}

// Split a task into sessions based on available slots
export function splitTaskIntoSessions(task, availableSlots, sessionLength) {
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
        displayTime: `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`
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
      status: 'scheduled'
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
      // Continue even if calendar deletion fails
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
