import { google } from 'googleapis';
import { config } from '../config/index.js';
import { getTokens, saveTokens } from './storageService.js';

// Create OAuth2 client
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

// Generate auth URL for user consent
export function getAuthUrl(oauth2Client) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: config.google.scopes,
    prompt: 'consent'
  });
}

// Exchange auth code for tokens
export async function getTokensFromCode(oauth2Client, code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

// Get authenticated client with valid tokens
export async function getAuthenticatedClient() {
  const tokens = await getTokens();
  if (!tokens) {
    return null;
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);

  // Check if token needs refresh (5 min buffer)
  const expiryBuffer = 5 * 60 * 1000;
  if (tokens.expiry_date && tokens.expiry_date - Date.now() < expiryBuffer) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await saveTokens(credentials);
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  return oauth2Client;
}

// Get calendar instance
export function getCalendar(oauth2Client) {
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// List events for a date range
export async function listEvents(oauth2Client, timeMin, timeMax) {
  const calendar = getCalendar(oauth2Client);
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  });
  return response.data.items || [];
}

// Get busy times using freebusy query
export async function getFreeBusy(oauth2Client, timeMin, timeMax) {
  const calendar = getCalendar(oauth2Client);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: 'primary' }]
    }
  });

  // Safely access nested properties
  const calendars = response.data?.calendars;
  if (!calendars || !calendars.primary) {
    return [];
  }

  return calendars.primary.busy || [];
}

// Create a calendar event
export async function createEvent(oauth2Client, eventDetails) {
  const calendar = getCalendar(oauth2Client);
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: eventDetails.summary,
      description: eventDetails.description || '',
      start: {
        dateTime: eventDetails.startTime,
        timeZone: eventDetails.timezone
      },
      end: {
        dateTime: eventDetails.endTime,
        timeZone: eventDetails.timezone
      },
      colorId: '9' // Blue color for scheduled tasks
    }
  });
  return response.data;
}

// Delete a calendar event
export async function deleteEvent(oauth2Client, eventId) {
  const calendar = getCalendar(oauth2Client);
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId
  });
}

// Update a calendar event
export async function updateEvent(oauth2Client, eventId, eventDetails) {
  const calendar = getCalendar(oauth2Client);
  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: eventDetails
  });
  return response.data;
}
