import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);

  // Check Google Calendar connection status
  const checkGoogleCalendar = useCallback(async (accessToken) => {
    if (!accessToken) {
      setGoogleCalendarConnected(false);
      return;
    }
    try {
      const response = await fetch('/api/auth/status', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await response.json();
      setGoogleCalendarConnected(data.googleConnected || false);
    } catch {
      setGoogleCalendarConnected(false);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          checkGoogleCalendar(session.access_token);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to get session:', err);
        setIsLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          checkGoogleCalendar(session.access_token);
        } else {
          setGoogleCalendarConnected(false);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkGoogleCalendar]);

  // Sign in with Google (Supabase auth, not calendar)
  const signInWithGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) setError(error.message);
  };

  // Sign in with email/password
  const signInWithEmail = async (email, password) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) setError(error.message);
    return { error };
  };

  // Sign up with email/password
  const signUpWithEmail = async (email, password, displayName) => {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName
        }
      }
    });
    if (error) setError(error.message);
    return { error };
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
    setGoogleCalendarConnected(false);
  };

  // Connect Google Calendar (separate OAuth flow)
  const connectGoogleCalendar = () => {
    // Redirect to our backend's Google Calendar OAuth
    window.location.href = '/api/auth/google/connect';
  };

  // Get access token for API calls
  const getAccessToken = () => {
    return session?.access_token;
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    error,
    googleCalendarConnected,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    connectGoogleCalendar,
    getAccessToken
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
