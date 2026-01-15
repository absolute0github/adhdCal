import { Router } from 'express';
import {
  startOfDay,
  endOfDay,
  addDays,
  parseISO
} from 'date-fns';
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

const router = Router();

// Get events for a date range
router.get('/events', authMiddleware, async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    const { start, end } = req.query;

    const timeMin = start ? parseISO(start) : startOfDay(new Date());
    const timeMax = end ? parseISO(end) : endOfDay(new Date());

    const events = await listEvents(client, timeMin, timeMax);

    // Transform events for frontend
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
router.get('/events/today', authMiddleware, async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    const now = new Date();

    const events = await listEvents(client, startOfDay(now), endOfDay(now));

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
router.get('/available-slots', authMiddleware, async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    const preferences = await getPreferences();

    const { start, end, minDuration } = req.query;

    const timeMin = start ? parseISO(start) : startOfDay(new Date());
    const timeMax = end ? parseISO(end) : endOfDay(addDays(new Date(), 14)); // Default 2 weeks

    const busyPeriods = await getFreeBusy(client, timeMin, timeMax);

    const slots = findAvailableSlots(
      busyPeriods,
      preferences,
      { start: timeMin, end: timeMax },
      minDuration ? parseInt(minDuration) : 30
    );

    res.json(slots);
  } catch (error) {
    console.error('Available slots error:', error);
    next(error);
  }
});

// Create a calendar event
router.post('/events', authMiddleware, async (req, res, next) => {
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
router.delete('/events/:eventId', authMiddleware, async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    await deleteEvent(client, req.params.eventId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
