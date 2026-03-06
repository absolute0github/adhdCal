import { Router } from 'express';
import {
  addDays,
  parseISO
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import {
  getAuthenticatedClient,
  listEvents,
  getFreeBusy,
  createEvent,
  deleteEvent
} from '../services/googleCalendarService.js';
import { findAvailableSlots } from '../services/schedulingService.js';
import { getPreferences } from '../services/storageService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

// Get start of day in a specific timezone (returns UTC Date)
function startOfDayInTz(date, timezone) {
  const zonedDate = toZonedTime(date, timezone);
  zonedDate.setHours(0, 0, 0, 0);
  return fromZonedTime(zonedDate, timezone);
}

// Get end of day in a specific timezone (returns UTC Date)
function endOfDayInTz(date, timezone) {
  const zonedDate = toZonedTime(date, timezone);
  zonedDate.setHours(23, 59, 59, 999);
  return fromZonedTime(zonedDate, timezone);
}

const router = Router();

// Get events for a date range
router.get('/events', async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    const preferences = await getPreferences();
    const timezone = preferences.timezone || 'America/New_York';
    const { start, end } = req.query;

    const timeMin = start ? parseISO(start) : startOfDayInTz(new Date(), timezone);
    const timeMax = end ? parseISO(end) : endOfDayInTz(new Date(), timezone);

    const events = await listEvents(client, timeMin, timeMax);

    const transformedEvents = events.map(event => ({
      id: event.id,
      summary: event.summary || 'No title',
      description: event.description,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      allDay: !event.start.dateTime,
      colorId: event.colorId
    }));

    res.json(transformedEvents);
  } catch (error) {
    next(error);
  }
});

// Get today's events (for sidebar)
router.get('/events/today', async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    const preferences = await getPreferences();
    const timezone = preferences.timezone || 'America/New_York';
    const now = new Date();

    const events = await listEvents(client, startOfDayInTz(now, timezone), endOfDayInTz(now, timezone));

    const transformedEvents = events.map(event => ({
      id: event.id,
      summary: event.summary || 'No title',
      description: event.description,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      allDay: !event.start.dateTime,
      colorId: event.colorId
    }));

    res.json(transformedEvents);
  } catch (error) {
    next(error);
  }
});

// Get available time slots
router.get('/available-slots', async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    const preferences = await getPreferences();
    const timezone = preferences.timezone || 'America/New_York';

    const { start, end, minDuration, override } = req.query;

    const timeMin = start ? parseISO(start) : startOfDayInTz(new Date(), timezone);
    const timeMax = end ? parseISO(end) : endOfDayInTz(addDays(new Date(), 14), timezone); // Default 2 weeks

    const busyPeriods = await getFreeBusy(client, timeMin, timeMax);

    // Build override object if requested
    const overrideConfig = override === 'true' ? {
      skipDayCheck: true,
      customHours: { start: '06:00', end: '22:00' }
    } : null;

    const slots = findAvailableSlots(
      busyPeriods,
      preferences,
      { start: timeMin, end: timeMax },
      minDuration ? parseInt(minDuration) : 30,
      overrideConfig
    );

    res.json(slots);
  } catch (error) {
    console.error('Available slots error:', error);
    next(error);
  }
});

// Create a calendar event
router.post('/events', async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    const preferences = await getPreferences();

    const { summary, description, startTime, endTime } = req.body;

    if (!summary || !startTime || !endTime) {
      return res.status(400).json({ error: 'summary, startTime, and endTime are required' });
    }

    const event = await createEvent(client, {
      summary,
      description,
      startTime,
      endTime,
      timezone: preferences.timezone
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

// Delete a calendar event
router.delete('/events/:eventId', async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    await deleteEvent(client, req.params.eventId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
