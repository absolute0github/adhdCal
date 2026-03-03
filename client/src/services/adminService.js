import api from './api';

export async function getUsers() {
  const response = await api.get('/admin/users');
  return response.data;
}

export async function suspendUser(userId) {
  const response = await api.put(`/admin/users/${userId}/suspend`);
  return response.data;
}

export async function unsuspendUser(userId) {
  const response = await api.put(`/admin/users/${userId}/unsuspend`);
  return response.data;
}

export async function resetUserPassword(userId) {
  const response = await api.post(`/admin/users/${userId}/reset-password`);
  return response.data;
}
