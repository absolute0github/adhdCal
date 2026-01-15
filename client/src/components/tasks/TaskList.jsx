import { useEffect, useState } from 'react';
import { ListTodo, AlertCircle } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import TaskCard from './TaskCard';
import EditTaskModal from './EditTaskModal';

export default function TaskList({ onSchedule }) {
  const { tasks, isLoading, error, fetchTasks, removeTask, updateTask, unscheduleSession } = useTasks();
  const { isAuthenticated } = useAuth();
  const [editingTask, setEditingTask] = useState(null);

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

  // Separate backlog and scheduled/partial tasks
  const backlogTasks = tasks.filter(t => t.status === 'backlog');
  const scheduledTasks = tasks.filter(t => t.status === 'scheduled' || t.status === 'partial');

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
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-gray-400" />
            Task Backlog
          </h2>

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
                  onDelete={handleDelete}
                  onEdit={setEditingTask}
                  onUnscheduleSession={handleUnscheduleSession}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Tasks Section */}
        {scheduledTasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-green-500" />
              Scheduled Tasks
            </h2>

            <div className="space-y-3">
              {scheduledTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSchedule={onSchedule}
                  onDelete={handleDelete}
                  onEdit={setEditingTask}
                  onUnscheduleSession={handleUnscheduleSession}
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
