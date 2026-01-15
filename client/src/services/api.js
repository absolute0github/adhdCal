import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could trigger re-auth
      console.error('Unauthorized - please sign in again');
    }
    return Promise.reject(error);
  }
);

export default api;
