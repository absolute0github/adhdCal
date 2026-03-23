import { useEffect, useState } from 'react';
import { ListTodo, AlertCircle, CheckSquare, Trash2, Zap, CheckCircle, Clock, Calendar } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import TaskCardImproved from './TaskCardImproved';
import EditTaskModal from './EditTaskModal';

export default function TaskListImproved({ onSchedule }) {
  const { tasks, isLoading, error, fetchTasks, removeTask, removeTasksBatch, updateTask, autoScheduleTask, autoScheduleBatch, unscheduleSession, completeTask } = useTasks();
  const { isAuthenticated } = useAuth();
  const [editingTask, setEditingTask] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [scheduledSelectionMode, setScheduledSelectionMode] = useState(false);
  const [scheduledSelectedIds, setScheduledSelectedIds] = useState(new Set());
  const [easierFirst, setEasierFirst] = useState(true);
  const [batchScheduling, setBatchScheduling] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleDelete(taskId) {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await removeTask(taskId);
      } catch (err) {
        alert('Failed to delete task: ' + err.message);
      }
    }
  }

  async function handleSaveEdit(id, updates) {
    try {
      await updateTask(id, updates);
      setEditingTask(null);
    } catch (err) {
      alert('Failed to update task: ' + err.message);
    }
  }

  async function handleUnscheduleSession(taskId, sessionId) {
    if (window.confirm('Remove this scheduled session?')) {
      try {
        await unscheduleSession(taskId, sessionId);
      } catch (err) {
        alert('Failed to unschedule: ' + err.message);
      }
    }
  }

  function toggleSelectionMode() {
    setSelectionMode(prev => !prev);
    setSelectedIds(new Set());
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(backlogTasks) {
    if (selectedIds.size === backlogTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(backlogTasks.map(t => t.id)));
    }
  }

  async function handleBulkDelete() {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!window.confirm(`Delete ${count} selected task${count > 1 ? 's' : ''}?`)) return;

    try {
      await removeTasksBatch([...selectedIds]);
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (err) {
      alert('Failed to delete tasks: ' + err.message);
    }
  }

  async function handleBatchAutoSchedule() {
    setBatchScheduling(true);
    setBatchResult(null);
    try {
      const result = await autoScheduleBatch(null, easierFirst);
      setBatchResult(result);
      setTimeout(() => setBatchResult(null), 5000);
    } catch (err) {
      alert('Failed to auto-schedule: ' + (err.response?.data?.error || err.message));
    } finally {
      setBatchScheduling(false);
    }
  }

  function toggleScheduledSelectionMode() {
    setScheduledSelectionMode(prev => !prev);
    setScheduledSelectedIds(new Set());
  }

  function toggleScheduledSelect(id) {
    setScheduledSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleScheduledSelectAll(scheduledList) {
    if (scheduledSelectedIds.size === scheduledList.length) {
      setScheduledSelectedIds(new Set());
    } else {
      setScheduledSelectedIds(new Set(scheduledList.map(t => t.id)));
    }
  }

  async function handleScheduledBulkDelete() {
    const count = scheduledSelectedIds.size;
    if (count === 0) return;
    if (!window.confirm(`Delete ${count} selected task${count > 1 ? 's' : ''}?`)) return;

    try {
      await removeTasksBatch([...scheduledSelectedIds]);
      setScheduledSelectedIds(new Set());
      setScheduledSelectionMode(false);
    } catch (err) {
      alert('Failed to delete tasks: ' + err.message);
    }
  }

  // Separate and sort tasks
  const backlogTasks = tasks.filter(t => t.status === 'backlog')
    .sort((a, b) => {
      // Overdue tasks first
      const aOverdue = a.dueDate && new Date(a.dueDate) < new Date();
      const bOverdue = b.dueDate && new Date(b.dueDate) < new Date();
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      
      // Then by importance (higher first)
      if (a.importance !== b.importance) return (b.importance || 0) - (a.importance || 0);
      
      // Then by complexity (easier first for ADHD)
      return (a.complexity || 0) - (b.complexity || 0);
    });
    
  const scheduledTasks = tasks.filter(t => t.status === 'scheduled' || t.status === 'partial')
    .sort((a, b) => {
      // Partial tasks first (need more work)
      if (a.status !== b.status) return a.status === 'partial' ? -1 : 1;
      
      // Then by next scheduled session
      const aNext = a.scheduledSessions?.[0]?.startTime;
      const bNext = b.scheduledSessions?.[0]?.startTime;
      if (aNext && bNext) return new Date(aNext) - new Date(bNext);
      
      return 0;
    });
    
  const completedTasks = tasks.filter(t => t.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));

  if (isLoading && tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-adhd-soft border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-adhd-calm-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Backlog Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-adhd-soft border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                <ListTodo className="w-4 h-4 text-white" />
              </div>
              Task Backlog
              {backlogTasks.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({backlogTasks.length})
                </span>
              )}
            </h2>

            {backlogTasks.length > 0 && (
              <div className="flex items-center gap-2">
                {selectionMode && selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-adhd-danger-50 text-adhd-danger-700 border border-adhd-danger-200 dark:bg-adhd-danger-900/20 dark:text-adhd-danger-300 dark:border-adhd-danger-800 rounded-lg hover:bg-adhd-danger-100 dark:hover:bg-adhd-danger-900/30 transition-all duration-150"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedIds.size})
                  </button>
                )}
                
                <button
                  onClick={toggleSelectionMode}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-150 ${
                    selectionMode
                      ? 'bg-adhd-calm-100 text-adhd-calm-700 border border-adhd-calm-200 dark:bg-adhd-calm-900/30 dark:text-adhd-calm-300 dark:border-adhd-calm-800'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectionMode ? 'Cancel' : 'Select'}
                </button>

                {isAuthenticated && !selectionMode && (
                  <>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={easierFirst}
                        onChange={(e) => setEasierFirst(e.target.checked)}
                        className="w-4 h-4 text-adhd-focus-600 rounded border-gray-300 dark:border-gray-600 focus:ring-adhd-focus-500"
                      />
                      Easier first
                    </label>
                    <button
                      onClick={handleBatchAutoSchedule}
                      disabled={batchScheduling}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-adhd-focus-50 text-adhd-focus-700 border border-adhd-focus-200 dark:bg-adhd-focus-900/20 dark:text-adhd-focus-300 dark:border-adhd-focus-800 rounded-lg hover:bg-adhd-focus-100 dark:hover:bg-adhd-focus-900/30 transition-all duration-150 disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      {batchScheduling ? 'Scheduling...' : 'Auto-Schedule All'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {selectionMode && backlogTasks.length > 0 && (
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedIds.size === backlogTasks.length}
                  onChange={() => toggleSelectAll(backlogTasks)}
                  className="w-4 h-4 text-adhd-calm-600 rounded border-gray-300 dark:border-gray-600 focus:ring-adhd-calm-500"
                />
                Select All ({backlogTasks.length})
              </label>
            </div>
          )}

          {batchResult && (
            <div className="flex items-center gap-2 text-adhd-focus-700 dark:text-adhd-focus-300 mb-4 bg-adhd-focus-50 dark:bg-adhd-focus-900/20 border border-adhd-focus-200 dark:border-adhd-focus-800 px-4 py-3 rounded-lg">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">
                Scheduled {batchResult.scheduled} of {batchResult.total} task{batchResult.total > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-adhd-danger-700 dark:text-adhd-danger-300 mb-4 bg-adhd-danger-50 dark:bg-adhd-danger-900/20 border border-adhd-danger-200 dark:border-adhd-danger-800 px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {backlogTasks.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-2">No tasks in backlog</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Add a task above to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backlogTasks.map((task) => (
                <TaskCardImproved
                  key={task.id}
                  task={task}
                  onSchedule={onSchedule}
                  onAutoSchedule={autoScheduleTask}
                  onDelete={handleDelete}
                  onEdit={setEditingTask}
                  onComplete={completeTask}
                  onUnscheduleSession={handleUnscheduleSession}
                  isAuthenticated={isAuthenticated}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(task.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Tasks Section */}
        {scheduledTasks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-adhd-soft border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-adhd-focus-500 to-adhd-focus-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Scheduled Tasks
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({scheduledTasks.length})
                </span>
              </h2>

              <div className="flex items-center gap-2">
                {scheduledSelectionMode && scheduledSelectedIds.size > 0 && (
                  <button
                    onClick={handleScheduledBulkDelete}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-adhd-danger-50 text-adhd-danger-700 border border-adhd-danger-200 dark:bg-adhd-danger-900/20 dark:text-adhd-danger-300 dark:border-adhd-danger-800 rounded-lg hover:bg-adhd-danger-100 dark:hover:bg-adhd-danger-900/30 transition-all duration-150"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({scheduledSelectedIds.size})
                  </button>
                )}
                <button
                  onClick={toggleScheduledSelectionMode}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-150 ${
                    scheduledSelectionMode
                      ? 'bg-adhd-calm-100 text-adhd-calm-700 border border-adhd-calm-200 dark:bg-adhd-calm-900/30 dark:text-adhd-calm-300 dark:border-adhd-calm-800'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  {scheduledSelectionMode ? 'Cancel' : 'Select'}
                </button>
              </div>
            </div>

            {scheduledSelectionMode && (
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={scheduledSelectedIds.size === scheduledTasks.length}
                    onChange={() => toggleScheduledSelectAll(scheduledTasks)}
                    className="w-4 h-4 text-adhd-calm-600 rounded border-gray-300 dark:border-gray-600 focus:ring-adhd-calm-500"
                  />
                  Select All ({scheduledTasks.length})
                </label>
              </div>
            )}

            <div className="space-y-4">
              {scheduledTasks.map((task) => (
                <TaskCardImproved
                  key={task.id}
                  task={task}
                  onSchedule={onSchedule}
                  onAutoSchedule={autoScheduleTask}
                  onDelete={handleDelete}
                  onEdit={setEditingTask}
                  onComplete={completeTask}
                  onUnscheduleSession={handleUnscheduleSession}
                  isAuthenticated={isAuthenticated}
                  selectionMode={scheduledSelectionMode}
                  isSelected={scheduledSelectedIds.has(task.id)}
                  onToggleSelect={toggleScheduledSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-adhd-soft border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              Completed
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({completedTasks.length})</span>
            </h2>

            <div className="space-y-4">
              {completedTasks.map((task) => (
                <TaskCardImproved
                  key={task.id}
                  task={task}
                  onSchedule={onSchedule}
                  onDelete={handleDelete}
                  onEdit={setEditingTask}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleSaveEdit}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  );
}