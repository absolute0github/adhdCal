import { useEffect, useState } from 'react';
import { ListTodo, AlertCircle, CheckSquare, Trash2, Zap, CheckCircle } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import TaskCard from './TaskCard';
import EditTaskModal from './EditTaskModal';

export default function TaskList({ onSchedule }) {
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

  // Separate backlog, scheduled/partial, and completed tasks
  const backlogTasks = tasks.filter(t => t.status === 'backlog');
  const scheduledTasks = tasks.filter(t => t.status === 'scheduled' || t.status === 'partial');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (isLoading && tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Backlog Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-gray-400" />
              Task Backlog
            </h2>

            {backlogTasks.length > 0 && (
              <div className="flex items-center gap-2">
                {selectionMode && selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete ({selectedIds.size})
                  </button>
                )}
                <button
                  onClick={toggleSelectionMode}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectionMode
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {selectionMode ? 'Cancel' : 'Select'}
                </button>

                {isAuthenticated && !selectionMode && (
                  <>
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={easierFirst}
                        onChange={(e) => setEasierFirst(e.target.checked)}
                        className="w-3.5 h-3.5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                      Easier first
                    </label>
                    <button
                      onClick={handleBatchAutoSchedule}
                      disabled={batchScheduling}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {batchScheduling ? 'Scheduling...' : 'Auto-Schedule All'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {selectionMode && backlogTasks.length > 0 && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedIds.size === backlogTasks.length}
                  onChange={() => toggleSelectAll(backlogTasks)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                Select All ({backlogTasks.length})
              </label>
            </div>
          )}

          {batchResult && (
            <div className="flex items-center gap-2 text-green-600 mb-4 bg-green-50 px-3 py-2 rounded-lg">
              <Zap className="w-4 h-4" />
              <span className="text-sm">
                Scheduled {batchResult.scheduled} of {batchResult.total} task{batchResult.total > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {backlogTasks.length === 0 ? (
            <div className="text-center py-8">
              <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No tasks in backlog</p>
              <p className="text-xs text-gray-400 mt-1">Add a task above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backlogTasks.map((task) => (
                <TaskCard
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-green-500" />
                Scheduled Tasks
              </h2>

              <div className="flex items-center gap-2">
                {scheduledSelectionMode && scheduledSelectedIds.size > 0 && (
                  <button
                    onClick={handleScheduledBulkDelete}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete ({scheduledSelectedIds.size})
                  </button>
                )}
                <button
                  onClick={toggleScheduledSelectionMode}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    scheduledSelectionMode
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {scheduledSelectionMode ? 'Cancel' : 'Select'}
                </button>
              </div>
            </div>

            {scheduledSelectionMode && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={scheduledSelectedIds.size === scheduledTasks.length}
                    onChange={() => toggleScheduledSelectAll(scheduledTasks)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  Select All ({scheduledTasks.length})
                </label>
              </div>
            )}

            <div className="space-y-3">
              {scheduledTasks.map((task) => (
                <TaskCard
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              Completed
              <span className="text-sm font-normal text-gray-400">({completedTasks.length})</span>
            </h2>

            <div className="space-y-3">
              {completedTasks.map((task) => (
                <TaskCard
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
