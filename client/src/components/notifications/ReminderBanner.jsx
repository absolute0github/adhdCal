import { useState, useEffect } from 'react';
import { useTaskReminders } from '../../hooks/useTaskReminders';

/**
 * ADHD-Friendly Task Reminder Banner
 * 
 * Shows a gentle but attention-grabbing banner when tasks are due soon.
 * Designed to be noticeable without causing anxiety:
 * - Warm amber/orange tones (not aggressive red)
 * - Gentle pulse animation (not frantic)
 * - Clear action buttons (snooze or complete)
 * - Encouraging language
 */
export function ReminderBanner() {
  const { upcomingTasks, snoozeTask, dismissTask } = useTaskReminders();
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-expand when new tasks appear
  useEffect(() => {
    if (upcomingTasks.length > 0) {
      setIsExpanded(true);
    }
  }, [upcomingTasks.length]);

  if (upcomingTasks.length === 0) return null;

  const urgencyStyles = {
    critical: {
      container: 'bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600',
      pulse: 'animate-pulse',
      icon: '🔥',
      text: 'text-white',
      button: 'bg-white/20 hover:bg-white/30 text-white',
      doneButton: 'bg-white text-orange-600 hover:bg-orange-50',
    },
    warning: {
      container: 'bg-gradient-to-r from-amber-400 to-yellow-400 dark:from-amber-500 dark:to-yellow-500',
      pulse: '',
      icon: '⏰',
      text: 'text-amber-900 dark:text-amber-950',
      button: 'bg-amber-900/10 hover:bg-amber-900/20 text-amber-900 dark:text-amber-950',
      doneButton: 'bg-amber-900 text-white hover:bg-amber-800',
    },
    notice: {
      container: 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40',
      pulse: '',
      icon: '📋',
      text: 'text-blue-900 dark:text-blue-100',
      button: 'bg-blue-900/10 hover:bg-blue-900/20 text-blue-900 dark:text-blue-100',
      doneButton: 'bg-blue-600 text-white hover:bg-blue-700',
    },
  };

  // Show the most urgent task prominently
  const primaryTask = upcomingTasks[0];
  const styles = urgencyStyles[primaryTask.urgency];
  const otherCount = upcomingTasks.length - 1;

  const getTimeMessage = (minutes) => {
    if (minutes <= 0) return "Starting now!";
    if (minutes === 1) return "in 1 minute!";
    if (minutes <= 5) return `in ${minutes} minutes!`;
    if (minutes <= 15) return `in ${minutes} minutes`;
    return `in ${minutes} minutes`;
  };

  const getEncouragement = (urgency) => {
    const messages = {
      critical: ["You've got this! 💪", "Time to shine! ✨", "Let's do it! 🚀"],
      warning: ["Getting ready? 🎯", "Almost time!", "You're prepared 👍"],
      notice: ["Coming up soon", "Heads up!", "On the horizon 🌅"],
    };
    const pool = messages[urgency] || messages.notice;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed top-2 right-2 z-50 px-3 py-2 rounded-full shadow-lg ${styles.container} ${styles.text} text-sm font-medium flex items-center gap-2 ${primaryTask.urgency === 'critical' ? 'animate-bounce' : ''}`}
      >
        <span>{styles.icon}</span>
        <span>{upcomingTasks.length} task{upcomingTasks.length !== 1 ? 's' : ''} coming up</span>
      </button>
    );
  }

  return (
    <div className={`relative z-40 ${styles.container} ${styles.pulse} shadow-lg`}>
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Primary task */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className={`flex items-center gap-3 ${styles.text} min-w-0`}>
            <span className="text-2xl flex-shrink-0" role="img" aria-label="reminder">
              {styles.icon}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-lg truncate">
                {primaryTask.title}
              </p>
              <p className="text-sm opacity-90">
                {getTimeMessage(primaryTask.minutesUntil)} · {getEncouragement(primaryTask.urgency)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Snooze button */}
            <button
              onClick={() => snoozeTask(primaryTask.dismissKey)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${styles.button}`}
              title="Remind me in 10 minutes"
            >
              😴 Snooze
            </button>

            {/* Done button */}
            <button
              onClick={() => dismissTask(primaryTask.dismissKey)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm ${styles.doneButton}`}
            >
              ✅ Got it!
            </button>

            {/* Collapse */}
            <button
              onClick={() => setIsExpanded(false)}
              className={`p-1.5 rounded-lg transition-all ${styles.button} opacity-60 hover:opacity-100`}
              title="Minimize"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Additional tasks */}
        {otherCount > 0 && (
          <div className={`mt-2 pt-2 border-t border-white/20 ${styles.text}`}>
            <p className="text-sm opacity-80">
              + {otherCount} more task{otherCount !== 1 ? 's' : ''} coming up:
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {upcomingTasks.slice(1, 4).map(task => (
                <span
                  key={task.dismissKey}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${styles.button}`}
                >
                  {urgencyStyles[task.urgency].icon} {task.title} ({task.minutesUntil}m)
                  <button
                    onClick={() => snoozeTask(task.dismissKey)}
                    className="ml-1 opacity-60 hover:opacity-100"
                    title="Snooze"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReminderBanner;
