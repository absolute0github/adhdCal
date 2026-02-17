import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Track PASSWORD_RECOVERY event globally so ResetPassword page can check it
// even if the event fired before the component mounted
export let passwordRecoveryDetected = false;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

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

  // Fetch user profile with subscription info
  const fetchUserProfile = useCallback(async (accessToken) => {
    if (!accessToken) {
      setUserProfile(null);
      return;
    }
    try {
      const response = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        setUserProfile(null);
      }
    } catch {
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          // Wait for profile to load before marking as ready,
          // so hasFeatureAccess works on first render
          await Promise.all([
            checkGoogleCalendar(session.access_token),
            fetchUserProfile(session.access_token)
          ]);
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
        if (event === 'PASSWORD_RECOVERY') {
          passwordRecoveryDetected = true;
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          await Promise.all([
            checkGoogleCalendar(session.access_token),
            fetchUserProfile(session.access_token)
          ]);
        } else {
          setGoogleCalendarConnected(false);
          setUserProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkGoogleCalendar, fetchUserProfile]);

  // Sign in with Google (Supabase auth, not calendar)
  const signInWithGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/app'
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
    setUserProfile(null);
  };

  // Check if user has access to a premium feature
  const hasFeatureAccess = (feature) => {
    if (!userProfile) return false;
    return userProfile.featureAccess?.[feature] ?? false;
  };

  // Check if user is premium
  const isPremium = userProfile?.isPremium ?? false;

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
    userProfile,
    isPremium,
    hasFeatureAccess,
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
