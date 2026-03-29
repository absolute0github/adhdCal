import { useState, useEffect, useCallback, useRef } from 'react';
import { getTasks } from '../services/taskService';

const POLL_INTERVAL = 60000; // Check every 60 seconds
const SNOOZE_DURATION = 10 * 60 * 1000; // 10 minutes
const REMINDER_WINDOW = 30 * 60 * 1000; // 30 minutes before due

/**
 * Custom hook for ADHD-friendly task reminders
 * Polls for upcoming tasks and manages dismiss/snooze state
 */
export function useTaskReminders() {
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef(null);

  // Get dismissed/snoozed tasks from localStorage
  const getDismissedState = useCallback(() => {
    try {
      const stored = localStorage.getItem('adhdcal_dismissed_reminders');
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      const now = Date.now();
      // Clean up expired snoozes
      const cleaned = {};
      for (const [taskId, expiry] of Object.entries(parsed)) {
        if (expiry === 'permanent' || expiry > now) {
          cleaned[taskId] = expiry;
        }
      }
      localStorage.setItem('adhdcal_dismissed_reminders', JSON.stringify(cleaned));
      return cleaned;
    } catch {
      return {};
    }
  }, []);

  // Check for upcoming tasks
  const checkReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      const tasks = await getTasks('active');
      const now = new Date();
      const dismissed = getDismissedState();

      const upcoming = tasks
        .filter(task => {
          // Must have scheduled sessions
          if (!task.sessions || task.sessions.length === 0) return false;

          // Find the next upcoming session
          const nextSession = task.sessions
            .filter(s => {
              const sessionStart = new Date(s.startTime || s.start_time);
              return sessionStart > now;
            })
            .sort((a, b) => {
              const aTime = new Date(a.startTime || a.start_time);
              const bTime = new Date(b.startTime || b.start_time);
              return aTime - bTime;
            })[0];

          if (!nextSession) return false;

          const sessionStart = new Date(nextSession.startTime || nextSession.start_time);
          const timeUntil = sessionStart - now;

          // Within reminder window (30 min)
          if (timeUntil > REMINDER_WINDOW || timeUntil < 0) return false;

          // Check if dismissed/snoozed
          const dismissKey = `${task.id}_${nextSession.id || sessionStart.toISOString()}`;
          if (dismissed[dismissKey]) {
            if (dismissed[dismissKey] === 'permanent') return false;
            if (dismissed[dismissKey] > now.getTime()) return false;
          }

          return true;
        })
        .map(task => {
          const nextSession = task.sessions
            .filter(s => new Date(s.startTime || s.start_time) > now)
            .sort((a, b) => new Date(a.startTime || a.start_time) - new Date(b.startTime || b.start_time))[0];

          const sessionStart = new Date(nextSession.startTime || nextSession.start_time);
          const timeUntilMs = sessionStart - now;
          const minutesUntil = Math.ceil(timeUntilMs / 60000);

          return {
            ...task,
            nextSession,
            sessionStart,
            minutesUntil,
            dismissKey: `${task.id}_${nextSession.id || sessionStart.toISOString()}`,
            urgency: minutesUntil <= 5 ? 'critical' : minutesUntil <= 15 ? 'warning' : 'notice',
          };
        })
        .sort((a, b) => a.minutesUntil - b.minutesUntil);

      setUpcomingTasks(upcoming);

      // Request notification permission if we have upcoming tasks
      if (upcoming.length > 0 && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Send browser notification for critical tasks (≤5 min)
      upcoming
        .filter(t => t.urgency === 'critical')
        .forEach(task => {
          sendBrowserNotification(task);
        });

    } catch (err) {
      console.error('Reminder check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getDismissedState]);

  // Browser notification (with dedup)
  const sendBrowserNotification = useCallback((task) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const notifKey = `adhdcal_notif_${task.dismissKey}`;
    const lastNotif = localStorage.getItem(notifKey);
    const now = Date.now();

    // Don't spam — at most once per 5 minutes per task
    if (lastNotif && now - parseInt(lastNotif) < 5 * 60 * 1000) return;

    localStorage.setItem(notifKey, String(now));

    new Notification(`⏰ ${task.title}`, {
      body: `Starting in ${task.minutesUntil} minute${task.minutesUntil !== 1 ? 's' : ''}!`,
      icon: '/favicon.ico',
      tag: task.dismissKey,
      requireInteraction: true,
    });
  }, []);

  // Snooze a task reminder for 10 minutes
  const snoozeTask = useCallback((dismissKey) => {
    const dismissed = getDismissedState();
    dismissed[dismissKey] = Date.now() + SNOOZE_DURATION;
    localStorage.setItem('adhdcal_dismissed_reminders', JSON.stringify(dismissed));
    setUpcomingTasks(prev => prev.filter(t => t.dismissKey !== dismissKey));
  }, [getDismissedState]);

  // Permanently dismiss a reminder (for this session/occurrence)
  const dismissTask = useCallback((dismissKey) => {
    const dismissed = getDismissedState();
    dismissed[dismissKey] = 'permanent';
    localStorage.setItem('adhdcal_dismissed_reminders', JSON.stringify(dismissed));
    setUpcomingTasks(prev => prev.filter(t => t.dismissKey !== dismissKey));
  }, [getDismissedState]);

  // Start/stop polling
  useEffect(() => {
    checkReminders(); // Initial check
    intervalRef.current = setInterval(checkReminders, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkReminders]);

  return {
    upcomingTasks,
    isLoading,
    snoozeTask,
    dismissTask,
    checkReminders, // Manual refresh
  };
}

export default useTaskReminders;
