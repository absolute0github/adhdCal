import api from './api';

export async function checkAuthStatus() {
  const response = await api.get('/auth/status');
  return response.data;
}

export function getLoginUrl() {
  return '/api/auth/login';
}

export async function logout() {
  const response = await api.post('/auth/logout');
  return response.data;
}
