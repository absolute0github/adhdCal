import { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';

const SESSION_OPTIONS = [
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours', recommended: true },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours (maximum)' }
];

export default function SessionPreferenceModal({ task, onConfirm, onClose }) {
  const [sessionLength, setSessionLength] = useState(120);

  const numSessions = Math.ceil(task.estimatedDuration / sessionLength);
  const lastSessionLength = task.estimatedDuration % sessionLength || sessionLength;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Session Preference</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <Clock className="w-5 h-5" />
            <span>
              <strong>{task.name}</strong> will take {formatDuration(task.estimatedDuration)}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            How long should each work session be?
          </p>

          <div className="space-y-2">
            {SESSION_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  sessionLength === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="sessionLength"
                  value={option.value}
                  checked={sessionLength === option.value}
                  onChange={(e) => setSessionLength(parseInt(e.target.value))}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="flex-1">
                  {option.label}
                  {option.recommended && (
                    <span className="ml-2 text-xs text-blue-600 font-medium">
                      (recommended)
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              This will create <strong>{numSessions} session{numSessions > 1 ? 's' : ''}</strong>
              {numSessions > 1 && lastSessionLength !== sessionLength && (
                <span className="text-gray-500">
                  {' '}({numSessions - 1} × {formatDuration(sessionLength)}, 1 × {formatDuration(lastSessionLength)})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(sessionLength)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
