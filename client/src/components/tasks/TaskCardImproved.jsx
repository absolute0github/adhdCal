import { useState } from 'react';
import { Calendar, Trash2, Edit2, Clock, X, Zap, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDuration, formatDateTime } from '../../utils/timeUtils';

// ADHD-friendly color schemes
const complexityColors = {
  1: 'bg-adhd-focus-100 text-adhd-focus-700 border-adhd-focus-200 dark:bg-adhd-focus-900/30 dark:text-adhd-focus-300 dark:border-adhd-focus-800',
  2: 'bg-adhd-focus-100 text-adhd-focus-700 border-adhd-focus-200 dark:bg-adhd-focus-900/30 dark:text-adhd-focus-300 dark:border-adhd-focus-800',
  3: 'bg-adhd-warn-100 text-adhd-warn-700 border-adhd-warn-200 dark:bg-adhd-warn-900/30 dark:text-adhd-warn-300 dark:border-adhd-warn-800',
  4: 'bg-adhd-warn-100 text-adhd-warn-700 border-adhd-warn-200 dark:bg-adhd-warn-900/30 dark:text-adhd-warn-300 dark:border-adhd-warn-800',
  5: 'bg-adhd-danger-100 text-adhd-danger-700 border-adhd-danger-200 dark:bg-adhd-danger-900/30 dark:text-adhd-danger-300 dark:border-adhd-danger-800',
};

const importanceBadgeColors = {
  1: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  2: 'bg-adhd-calm-100 text-adhd-calm-700 border-adhd-calm-200 dark:bg-adhd-calm-900/30 dark:text-adhd-calm-300 dark:border-adhd-calm-800',
  3: 'bg-adhd-warn-100 text-adhd-warn-700 border-adhd-warn-200 dark:bg-adhd-warn-900/30 dark:text-adhd-warn-300 dark:border-adhd-warn-800',
  4: 'bg-adhd-warn-200 text-adhd-warn-800 border-adhd-warn-300 dark:bg-adhd-warn-800/40 dark:text-adhd-warn-200 dark:border-adhd-warn-700',
  5: 'bg-adhd-danger-100 text-adhd-danger-700 border-adhd-danger-200 dark:bg-adhd-danger-900/30 dark:text-adhd-danger-300 dark:border-adhd-danger-800',
};

const priorityLabels = {
  1: 'Low',
  2: 'Medium',
  3: 'Normal',
  4: 'High',
  5: 'Critical'
};

export default function TaskCardImproved({
  task,
  onSchedule,
  onAutoSchedule,
  onDelete,
  onEdit,
  onComplete,
  onUnscheduleSession,
  isAuthenticated,
  selectionMode,
  isSelected,
  onToggleSelect
}) {
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  async function handleAutoSchedule() {
    setAutoScheduling(true);
    setStatusMsg(null);
    try {
      const result = await onAutoSchedule(task.id);
      setStatusMsg({ type: 'success', text: `Scheduled ${result.sessionsCreated} session(s)` });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.error || err.message });
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setAutoScheduling(false);
    }
  }

  const totalScheduled = task.scheduledSessions?.reduce((sum, s) => sum + s.duration, 0) || 0;
  const remaining = task.estimatedDuration - totalScheduled;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const statusColors = {
    backlog: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    partial: 'bg-adhd-warn-100 text-adhd-warn-800 border-adhd-warn-200 dark:bg-adhd-warn-900/30 dark:text-adhd-warn-300 dark:border-adhd-warn-800',
    scheduled: 'bg-adhd-focus-100 text-adhd-focus-800 border-adhd-focus-200 dark:bg-adhd-focus-900/30 dark:text-adhd-focus-300 dark:border-adhd-focus-800',
    completed: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
  };

  const statusLabels = {
    backlog: 'Backlog',
    partial: 'Partially Scheduled',
    scheduled: 'Fully Scheduled',
    completed: 'Completed'
  };

  const isCompleted = task.status === 'completed';
  const hasScheduledSessions = task.scheduledSessions && task.scheduledSessions.length > 0;

  return (
    <div 
      className={`
        group relative bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 hover:shadow-adhd-soft
        ${isSelected ? 'border-adhd-calm-400 bg-adhd-calm-50/50 dark:bg-adhd-calm-900/20 shadow-adhd-focus' : 'border-gray-200 dark:border-gray-700'}
        ${isOverdue ? 'ring-2 ring-adhd-danger-200 dark:ring-adhd-danger-800' : ''}
        animate-fade-in
      `}
    >
      {/* Overdue indicator */}
      {isOverdue && (
        <div className="absolute -top-2 -right-2 bg-adhd-danger-500 text-white rounded-full p-1 animate-bounce-soft">
          <AlertTriangle className="w-3 h-3" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 flex items-start gap-3">
            {selectionMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(task.id)}
                className="mt-1 w-4 h-4 text-adhd-calm-600 rounded border-gray-300 dark:border-gray-600 focus:ring-adhd-calm-500 cursor-pointer transition-colors"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`
                font-medium text-lg leading-tight mb-2 transition-all duration-200
                ${isCompleted ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
                ${isOverdue ? 'text-adhd-danger-700 dark:text-adhd-danger-300' : ''}
              `}>
                {task.name}
              </h3>
              
              {/* Tags and status row */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  {formatDuration(task.estimatedDuration)}
                </span>
                
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[task.status]}`}>
                  {statusLabels[task.status]}
                </span>
                
                {task.importance && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${importanceBadgeColors[task.importance] || importanceBadgeColors[3]}`}>
                    P{task.importance} · {priorityLabels[task.importance]}
                  </span>
                )}
                
                {task.complexity && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${complexityColors[task.complexity] || complexityColors[3]}`}>
                    C{task.complexity} · {task.complexity <= 2 ? 'Easy' : task.complexity === 3 ? 'Medium' : 'Hard'}
                  </span>
                )}

                {isOverdue && (
                  <span className="text-xs px-2.5 py-1 rounded-full border bg-adhd-danger-100 text-adhd-danger-700 border-adhd-danger-200 dark:bg-adhd-danger-900/30 dark:text-adhd-danger-300 dark:border-adhd-danger-800 font-medium animate-pulse">
                    OVERDUE
                  </span>
                )}
              </div>

              {/* Progress bar for partial tasks */}
              {task.status === 'partial' && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round((totalScheduled / task.estimatedDuration) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-adhd-focus-500 transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${(totalScheduled / task.estimatedDuration) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Scheduled sessions (collapsible) */}
              {hasScheduledSessions && (
                <div className="mt-3">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-xs font-medium text-adhd-calm-600 dark:text-adhd-calm-400 hover:text-adhd-calm-700 dark:hover:text-adhd-calm-300 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {task.scheduledSessions.length} Scheduled Session{task.scheduledSessions.length > 1 ? 's' : ''}
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-2 space-y-1 animate-slide-in">
                      {task.scheduledSessions.map((session) => (
                        <div
                          key={session.sessionId}
                          className="flex items-center justify-between text-xs bg-adhd-calm-50 dark:bg-adhd-calm-900/20 border border-adhd-calm-200 dark:border-adhd-calm-800 rounded-lg px-3 py-2 transition-all duration-150 hover:bg-adhd-calm-100 dark:hover:bg-adhd-calm-900/30"
                        >
                          <span className="text-adhd-calm-700 dark:text-adhd-calm-300 font-medium">
                            {formatDateTime(session.startTime)} ({formatDuration(session.duration)})
                          </span>
                          {onUnscheduleSession && (
                            <button
                              onClick={() => onUnscheduleSession(task.id, session.sessionId)}
                              className="text-adhd-calm-400 hover:text-adhd-danger-500 transition-colors p-1 rounded"
                              title="Remove session"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {remaining > 0 && (
                        <p className="text-xs text-adhd-warn-600 dark:text-adhd-warn-400 font-medium pt-1">
                          {formatDuration(remaining)} remaining to schedule
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {onComplete && !isCompleted && (
              <button
                onClick={() => onComplete(task.id)}
                className="p-2 text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-150 hover:scale-105"
                title="Mark complete"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            
            {isAuthenticated && (task.status === 'backlog' || task.status === 'partial') && (
              <>
                <button
                  onClick={() => onSchedule(task)}
                  className="p-2 text-adhd-calm-600 hover:text-adhd-calm-700 hover:bg-adhd-calm-50 dark:hover:bg-adhd-calm-900/20 rounded-lg transition-all duration-150 hover:scale-105"
                  title="Schedule task"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                {onAutoSchedule && (
                  <button
                    onClick={handleAutoSchedule}
                    disabled={autoScheduling}
                    className="p-2 text-adhd-focus-600 hover:text-adhd-focus-700 hover:bg-adhd-focus-50 dark:hover:bg-adhd-focus-900/20 rounded-lg transition-all duration-150 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Auto-schedule task"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-150 hover:scale-105"
              title="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-400 hover:text-adhd-danger-600 hover:bg-adhd-danger-50 dark:hover:bg-adhd-danger-900/20 rounded-lg transition-all duration-150 hover:scale-105"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Status message */}
        {statusMsg && (
          <div className={`
            mt-3 p-2 rounded-lg text-xs font-medium animate-slide-in
            ${statusMsg.type === 'success' 
              ? 'bg-adhd-focus-50 text-adhd-focus-700 border border-adhd-focus-200 dark:bg-adhd-focus-900/20 dark:text-adhd-focus-300 dark:border-adhd-focus-800'
              : 'bg-adhd-danger-50 text-adhd-danger-700 border border-adhd-danger-200 dark:bg-adhd-danger-900/20 dark:text-adhd-danger-300 dark:border-adhd-danger-800'
            }
          `}>
            {statusMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}