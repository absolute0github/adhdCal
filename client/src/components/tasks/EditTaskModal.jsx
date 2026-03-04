import { useState } from 'react';
import { X } from 'lucide-react';
import { parseDuration, formatDuration } from '../../utils/timeUtils';

const importanceLabels = { 1: 'Low', 2: 'Low-Med', 3: 'Medium', 4: 'High', 5: 'Critical' };
const importanceActiveColors = {
  1: 'bg-gray-500 text-white',
  2: 'bg-blue-500 text-white',
  3: 'bg-yellow-500 text-white',
  4: 'bg-orange-500 text-white',
  5: 'bg-red-500 text-white',
};
const importanceColors = {
  1: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  2: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
  3: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  4: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  5: 'bg-red-100 text-red-700 hover:bg-red-200',
};

export default function EditTaskModal({ task, onSave, onClose }) {
  const [name, setName] = useState(task.name);
  const [duration, setDuration] = useState(formatDuration(task.estimatedDuration));
  const [complexity, setComplexity] = useState(task.complexity || 3);
  const [importance, setImportance] = useState(task.importance || 3);
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
      estimatedDuration: durationMinutes,
      complexity,
      importance
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

          {/* Importance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Importance
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setImportance(level)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    importance === level
                      ? importanceActiveColors[level]
                      : importanceColors[level]
                  }`}
                >
                  {level}
                </button>
              ))}
              <span className="ml-2 text-xs text-gray-400 self-center">
                {importanceLabels[importance]}
              </span>
            </div>
          </div>

          {/* Complexity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complexity
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setComplexity(level)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    complexity === level
                      ? level <= 2 ? 'bg-green-500 text-white'
                        : level === 3 ? 'bg-yellow-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
              <span className="ml-2 text-xs text-gray-400 self-center">
                {complexity <= 2 ? 'Easy' : complexity === 3 ? 'Medium' : 'Hard'}
              </span>
            </div>
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
