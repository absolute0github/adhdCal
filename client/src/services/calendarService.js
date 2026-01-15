import api from './api';

export async function getEvents(start, end) {
  const params = {};
  if (start) params.start = start;
  if (end) params.end = end;

  const response = await api.get('/calendar/events', { params });
  return response.data;
}

export async function getTodayEvents() {
  const response = await api.get('/calendar/events/today');
  return response.data;
}

export async function getAvailableSlots(start, end, minDuration) {
  const params = {};
  if (start) params.start = start;
  if (end) params.end = end;
  if (minDuration) params.minDuration = minDuration;

  const response = await api.get('/calendar/available-slots', { params });
  return response.data;
}

export async function createEvent(eventData) {
  const response = await api.post('/calendar/events', eventData);
  return response.data;
}

export async function deleteEvent(eventId) {
  const response = await api.delete(`/calendar/events/${eventId}`);
  return response.data;
}

export async function getPreferences() {
  const response = await api.get('/preferences');
  return response.data;
}

export async function updatePreferences(preferences) {
  const response = await api.put('/preferences', preferences);
  return response.data;
}
