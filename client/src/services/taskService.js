import api from './api';

export async function getTasks(status = null) {
  const params = status ? { status } : {};
  const response = await api.get('/tasks', { params });
  return response.data;
}

export async function getTask(id) {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
}

export async function createTask(task) {
  const response = await api.post('/tasks', task);
  return response.data;
}

export async function updateTask(id, updates) {
  const response = await api.put(`/tasks/${id}`, updates);
  return response.data;
}

export async function deleteTask(id) {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
}

export async function scheduleTask(id, slots, sessionPreference) {
  const response = await api.post(`/tasks/${id}/schedule`, {
    slots,
    sessionPreference
  });
  return response.data;
}

export async function unscheduleSession(taskId, sessionId) {
  const response = await api.delete(`/tasks/${taskId}/sessions/${sessionId}`);
  return response.data;
}
