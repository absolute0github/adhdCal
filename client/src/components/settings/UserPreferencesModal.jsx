import { useState, useEffect } from 'react';
import { X, Settings, Clock, Calendar, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
];

export default function UserPreferencesModal({ isOpen, onClose }) {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/preferences');
      if (!data.workingDays) {
        data.workingDays = {
          monday: true, tuesday: true, wednesday: true,
          thursday: true, friday: true, saturday: false, sunday: false,
        };
      }
      setPreferences(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/preferences', preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayKey) => {
    setPreferences(prev => ({
      ...prev,
      workingDays: { ...prev.workingDays, [dayKey]: !prev.workingDays[dayKey] },
    }));
  };

  const updateWorkingHours = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      workingHours: { ...prev.workingHours, [field]: value },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
              <p className="text-sm text-gray-500">Customize your scheduling</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading preferences...</div>
        ) : preferences ? (
          <div className="p-5 space-y-6">
            {/* Working Days */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Calendar className="w-4 h-4" />
                Schedulable Days
              </label>
              <p className="text-xs text-gray-500 mb-3">Select which days tasks can be auto-scheduled</p>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleDay(key)}
                    className={`flex-1 py-2.5 px-1 text-sm font-medium rounded-lg transition-all ${
                      preferences.workingDays?.[key]
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Clock className="w-4 h-4" />
                Working Hours
              </label>
              <p className="text-xs text-gray-500 mb-3">Auto-scheduling will only place tasks within this window</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Start</label>
                  <input
                    type="time"
                    value={preferences.workingHours?.start || '09:00'}
                    onChange={(e) => updateWorkingHours('start', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <span className="text-gray-400 mt-5">to</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">End</label>
                  <input
                    type="time"
                    value={preferences.workingHours?.end || '17:00'}
                    onChange={(e) => updateWorkingHours('end', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Session Length */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Default Session Length</label>
              <p className="text-xs text-gray-500 mb-3">How long each work session should be when auto-scheduling</p>
              <div className="flex gap-2">
                {[30, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setPreferences(prev => ({ ...prev, defaultSessionLength: mins }))}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      preferences.defaultSessionLength === mins
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Timezone</label>
              <select
                value={preferences.timezone || 'America/New_York'}
                onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Override Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Schedule Override</p>
                  <p className="text-xs text-amber-700 mt-1">
                    When scheduling a task, you can toggle &quot;Allow outside normal hours&quot; to
                    schedule beyond your set days and time windows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              saved ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
            } disabled:opacity-50`}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
