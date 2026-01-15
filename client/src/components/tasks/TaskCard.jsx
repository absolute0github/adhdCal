import { Calendar, Trash2, Edit2, Clock, X } from 'lucide-react';
import { formatDuration, formatDateTime } from '../../utils/timeUtils';

export default function TaskCard({
  task,
  onSchedule,
  onDelete,
  onEdit,
  onUnscheduleSession,
  isAuthenticated
}) {
  const totalScheduled = task.scheduledSessions?.reduce((sum, s) => sum + s.duration, 0) || 0;
  const remaining = task.estimatedDuration - totalScheduled;

  const statusColors = {
    backlog: 'bg-gray-100 text-gray-600',
    partial: 'bg-yellow-100 text-yellow-700',
    scheduled: 'bg-green-100 text-green-700'
  };

  const statusLabels = {
    backlog: 'Backlog',
    partial: 'Partially Scheduled',
    scheduled: 'Fully Scheduled'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{task.name}</h3>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {formatDuration(task.estimatedDuration)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.status]}`}>
              {statusLabels[task.status]}
            </span>
          </div>

          {/* Show scheduled sessions */}
          {task.scheduledSessions && task.scheduledSessions.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium">Scheduled Sessions:</p>
              {task.scheduledSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between text-xs bg-blue-50 rounded px-2 py-1"
                >
                  <span className="text-blue-700">
                    {formatDateTime(session.startTime)} ({formatDuration(session.duration)})
                  </span>
                  {onUnscheduleSession && (
                    <button
                      onClick={() => onUnscheduleSession(task.id, session.sessionId)}
                      className="text-blue-400 hover:text-red-500 transition-colors"
                      title="Remove session"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {remaining > 0 && (
                <p className="text-xs text-orange-600">
                  {formatDuration(remaining)} remaining to schedule
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isAuthenticated && (task.status === 'backlog' || task.status === 'partial') && (
            <button
              onClick={() => onSchedule(task)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Schedule task"
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
