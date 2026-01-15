import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkAuthStatus, logout as logoutApi, getLoginUrl } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = await checkAuthStatus();
      setIsAuthenticated(status.authenticated);
      setError(null);
    } catch (err) {
      setIsAuthenticated(false);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    window.location.href = getLoginUrl();
  };

  const logout = async () => {
    try {
      await logoutApi();
      setIsAuthenticated(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
