import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { getTodayEvents, getEvents, deleteEvent } from '../../services/calendarService';
import { formatTime, isToday } from '../../utils/timeUtils';

export default function Sidebar({ isMobile = false }) {
  const { isAuthenticated } = useAuth();
  const { tasks, unscheduleSession } = useTasks();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);

  // Build lookup: calendarEventId → { taskId, sessionId }
  const sessionLookup = useMemo(() => {
    const map = {};
    for (const task of tasks) {
      if (task.scheduledSessions) {
        for (const session of task.scheduledSessions) {
          if (session.calendarEventId) {
            map[session.calendarEventId] = { taskId: task.id, sessionId: session.sessionId };
          }
        }
      }
    }
    return map;
  }, [tasks]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated, selectedDate]);

  async function fetchEvents() {
    setIsLoading(true);
    setError(null);
    try {
      let data;
      if (isToday(selectedDate)) {
        data = await getTodayEvents();
      } else {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        data = await getEvents(start.toISOString(), end.toISOString());
      }
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  function navigateDay(delta) {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
  }

  function formatDateHeader(date) {
    if (isToday(date)) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  // Calculate scheduled time for today
  const totalScheduledMinutes = events.reduce((total, event) => {
    if (event.allDay) return total;
    const start = new Date(event.start);
    const end = new Date(event.end);
    return total + (end - start) / 60000;
  }, 0);

  const scheduledHours = Math.floor(totalScheduledMinutes / 60);
  const scheduledMinutes = Math.round(totalScheduledMinutes % 60);

  async function handleRemoveSession(taskId, sessionId) {
    if (window.confirm('Remove this scheduled session from your calendar?')) {
      try {
        await unscheduleSession(taskId, sessionId);
        fetchEvents();
      } catch (err) {
        alert('Failed to remove session: ' + err.message);
      }
    }
  }

  async function handleDeleteEvent(eventId) {
    if (window.confirm('Delete this event from your Google Calendar?')) {
      try {
        await deleteEvent(eventId);
        fetchEvents();
      } catch (err) {
        alert('Failed to delete event: ' + (err.response?.data?.error || err.message));
      }
    }
  }

  const baseClasses = isMobile
    ? "flex-1 bg-gray-50 flex flex-col h-full overflow-hidden"
    : "w-80 bg-gray-50 border-r border-gray-200 flex flex-col";

  return (
    <aside className={baseClasses}>
      {/* Date Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigateDay(-1)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="font-medium text-gray-900">
            {formatDateHeader(selectedDate)}
          </h2>
          <button
            onClick={() => navigateDay(1)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Schedule Summary */}
      {isAuthenticated && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {scheduledHours > 0 || scheduledMinutes > 0
                ? `${scheduledHours}h ${scheduledMinutes}m scheduled`
                : 'No events scheduled'}
            </span>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4">
        {!isAuthenticated ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              Sign in to see your schedule
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={fetchEvents}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No events scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                sessionInfo={sessionLookup[event.id]}
                onRemove={handleRemoveSession}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Google Calendar Link */}
      {isAuthenticated && (
        <div className="p-4 border-t border-gray-200">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Google Calendar
          </a>
        </div>
      )}
    </aside>
  );
}

function EventCard({ event, sessionInfo, onRemove, onDelete }) {
  const startTime = event.allDay ? 'All day' : formatTime(event.start);
  const endTime = event.allDay ? '' : formatTime(event.end);

  // Color mapping for Google Calendar colors
  const colorMap = {
    '1': 'bg-blue-100 border-blue-300',
    '2': 'bg-green-100 border-green-300',
    '3': 'bg-purple-100 border-purple-300',
    '4': 'bg-red-100 border-red-300',
    '5': 'bg-yellow-100 border-yellow-300',
    '6': 'bg-orange-100 border-orange-300',
    '7': 'bg-teal-100 border-teal-300',
    '8': 'bg-gray-100 border-gray-300',
    '9': 'bg-blue-100 border-blue-400', // Task color
    '10': 'bg-green-100 border-green-300',
    '11': 'bg-red-100 border-red-300',
  };

  const colorClass = colorMap[event.colorId] || 'bg-blue-50 border-blue-200';

  function handleDelete() {
    if (sessionInfo && onRemove) {
      // If it's a scheduled session, unschedule it (removes from both calendar and task)
      onRemove(sessionInfo.taskId, sessionInfo.sessionId);
    } else if (onDelete) {
      // Otherwise, delete the event directly from Google Calendar
      onDelete(event.id);
    }
  }

  return (
    <div className={`p-3 rounded-lg border-l-4 ${colorClass} group relative`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">
            {event.summary}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {startTime}{endTime && ` - ${endTime}`}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
          title={sessionInfo ? "Remove session from calendar" : "Delete event"}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
