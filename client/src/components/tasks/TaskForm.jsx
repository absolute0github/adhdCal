import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { parseDuration, formatDuration } from '../../utils/timeUtils';

export default function TaskForm({ onScheduleNew }) {
  const { addTask } = useTasks();
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e, shouldSchedule = false) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a task name');
      return;
    }

    const durationMinutes = parseDuration(duration);
    if (!durationMinutes || durationMinutes <= 0) {
      setError('Please enter a valid duration (e.g., "2h", "90m", "1h 30m")');
      return;
    }

    // For "Add & Schedule", pass unsaved task data to wizard (don't create yet)
    if (shouldSchedule && onScheduleNew) {
      onScheduleNew({
        name: name.trim(),
        estimatedDuration: durationMinutes,
        isNew: true  // Flag to indicate this task needs to be created
      });
      setName('');
      setDuration('');
      return;
    }

    // For "Add to Backlog", create the task immediately
    setIsSubmitting(true);
    try {
      await addTask({
        name: name.trim(),
        estimatedDuration: durationMinutes
      });

      setName('');
      setDuration('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const parsedDuration = parseDuration(duration);
  const durationPreview = parsedDuration ? formatDuration(parsedDuration) : null;

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 mb-1">
            Task Name
          </label>
          <input
            id="taskName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What do you want to accomplish?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Duration
          </label>
          <div className="relative">
            <input
              id="duration"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 2h, 90m, 1h 30m"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
            {durationPreview && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                = {durationPreview}
              </span>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add to Backlog
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Calendar className="w-4 h-4" />
              Add & Schedule
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
