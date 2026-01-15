import { useState } from 'react';
import { X } from 'lucide-react';
import { parseDuration, formatDuration } from '../../utils/timeUtils';

export default function EditTaskModal({ task, onSave, onClose }) {
  const [name, setName] = useState(task.name);
  const [duration, setDuration] = useState(formatDuration(task.estimatedDuration));
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a task name');
      return;
    }

    const durationMinutes = parseDuration(duration);
    if (!durationMinutes || durationMinutes <= 0) {
      setError('Please enter a valid duration');
      return;
    }

    onSave(task.id, {
      name: name.trim(),
      estimatedDuration: durationMinutes
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-1">
              Task Name
            </label>
            <input
              id="editName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="editDuration" className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Duration
            </label>
            <input
              id="editDuration"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 2h, 90m"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
