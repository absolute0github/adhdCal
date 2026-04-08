import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, Clock, Calendar, Bell, User, Shield,
  CheckCircle, Save, Zap, ChevronRight, LogOut,
  Monitor, Moon, Sun, AlertCircle, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

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
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Australia/Sydney',
  'Asia/Tokyo',
];

const SESSION_LENGTHS = [
  { value: 25, label: '25 min', description: 'Pomodoro classic' },
  { value: 30, label: '30 min', description: 'Half hour blocks' },
  { value: 45, label: '45 min', description: 'Deep focus' },
  { value: 60, label: '60 min', description: 'Full hour' },
  { value: 90, label: '90 min', description: 'Ultradian rhythm' },
];

const SCHEDULE_MODES = [
  { value: 'easier-first', label: 'Easier First', description: 'Build momentum with quick wins — great for ADHD' },
  { value: 'urgent-first', label: 'Urgent First', description: 'Tackle deadlines and high-priority tasks first' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of urgent and easier tasks throughout the day' },
];

function SectionCard({ icon: Icon, title, description, children, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-50 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SaveButton({ saving, saved, onSave }) {
  return (
    <button
      onClick={onSave}
      disabled={saving || saved}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        saved
          ? 'bg-green-500 text-white'
          : saving
          ? 'bg-indigo-400 text-white cursor-not-allowed'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
      }`}
    >
      {saved ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Saved!
        </>
      ) : saving ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          Save Changes
        </>
      )}
    </button>
  );
}

export default function SettingsPage() {
  const { user, userProfile, isPremium, googleCalendarConnected, connectGoogleCalendar, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/preferences');
      // Provide defaults if missing
      if (!data.workingDays) {
        data.workingDays = {
          monday: true, tuesday: true, wednesday: true,
          thursday: true, friday: true, saturday: false, sunday: false,
        };
      }
      if (!data.workingHours) {
        data.workingHours = { start: '09:00', end: '17:00' };
      }
      if (!data.sessionLength) data.sessionLength = 45;
      if (!data.timezone) data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!data.scheduleMode) data.scheduleMode = 'easier-first';
      if (!data.defaultComplexity) data.defaultComplexity = 3;
      setPrefs(data);
    } catch (err) {
      setError('Failed to load preferences. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/preferences', prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updatePref = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const toggleDay = (dayKey) => {
    setPrefs(prev => ({
      ...prev,
      workingDays: { ...prev.workingDays, [dayKey]: !prev.workingDays[dayKey] },
    }));
  };

  const updateWorkingHours = (field, value) => {
    setPrefs(prev => ({
      ...prev,
      workingHours: { ...prev.workingHours, [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Customize ADHDCal to match how your brain works best
          </p>
        </div>
        <SaveButton saving={saving} saved={saved} onSave={handleSave} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Account */}
      <SectionCard icon={User} title="Account" description="Your profile and plan" color="purple">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-14 h-14 rounded-full border-2 border-gray-100 dark:border-gray-700"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <User className="w-7 h-7 text-indigo-500" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isPremium
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {isPremium ? (
                  <><Zap className="w-3 h-3" /> Premium</>
                ) : (
                  'Free Plan'
                )}
              </span>
            </div>
          </div>

          {!isPremium && (
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4">
              <div>
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Upgrade to Premium</p>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
                  Unlimited tasks, 90-day scheduling, AI reports & more
                </p>
              </div>
              <Link
                to="/pricing"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors ml-4 whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5" />
                Upgrade →
              </Link>
            </div>
          )}

          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </SectionCard>

      {/* Work Schedule */}
      {prefs && (
        <SectionCard
          icon={Clock}
          title="Work Schedule"
          description="When you're available — ADHDCal only schedules within these windows"
          color="indigo"
        >
          <div className="space-y-6">
            {/* Working Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Working Days
              </label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleDay(key)}
                    className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all ${
                      prefs.workingDays?.[key]
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Working Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={prefs.workingHours?.start || '09:00'}
                  onChange={(e) => updateWorkingHours('start', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  value={prefs.workingHours?.end || '17:00'}
                  onChange={(e) => updateWorkingHours('end', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Session Length */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Session Length
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                How long each work block should be when scheduling tasks
              </p>
              <div className="grid grid-cols-5 gap-2">
                {SESSION_LENGTHS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    onClick={() => updatePref('sessionLength', value)}
                    title={description}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 text-sm transition-all ${
                      prefs.sessionLength === value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Timezone
              </label>
              <select
                value={prefs.timezone || 'America/New_York'}
                onChange={(e) => updatePref('timezone', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Task Defaults */}
      {prefs && (
        <SectionCard
          icon={Settings}
          title="Task Defaults"
          description="How ADHDCal handles scheduling decisions"
          color="blue"
        >
          <div className="space-y-6">
            {/* Scheduling Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scheduling Mode
              </label>
              <div className="space-y-2">
                {SCHEDULE_MODES.map(({ value, label, description }) => (
                  <button
                    key={value}
                    onClick={() => updatePref('scheduleMode', value)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      prefs.scheduleMode === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      prefs.scheduleMode === value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {prefs.scheduleMode === value && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        prefs.scheduleMode === value
                          ? 'text-blue-900 dark:text-blue-300'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Default Complexity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Default Task Complexity
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Starting complexity when adding new tasks (1 = hardest, 5 = easiest)
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => updatePref('defaultComplexity', level)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                      prefs.defaultComplexity === level
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1 px-1">
                <span className="text-xs text-gray-400">Hardest</span>
                <span className="text-xs text-gray-400">Easiest</span>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Calendar Integration */}
      <SectionCard
        icon={Calendar}
        title="Calendar Integration"
        description="Connect your calendar to schedule tasks automatically"
        color="green"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${googleCalendarConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Google Calendar</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {googleCalendarConnected ? 'Connected — tasks sync automatically' : 'Not connected'}
                </p>
              </div>
            </div>
            {googleCalendarConnected ? (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                <CheckCircle className="w-4 h-4" /> Connected
              </span>
            ) : (
              <button
                onClick={connectGoogleCalendar}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Connect
              </button>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              ADHDCal only reads your existing events to find free time — it doesn't modify events you didn't create in ADHDCal.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Appearance */}
      <SectionCard
        icon={Monitor}
        title="Appearance"
        description="Customize how ADHDCal looks"
        color="gray"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex w-12 h-6 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                isDarkMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
            <span className="mx-1">→</span>
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </div>
        </div>
      </SectionCard>

      {/* Notifications (Coming Soon) */}
      <SectionCard
        icon={Bell}
        title="Notifications"
        description="Reminders and alerts — coming soon"
        color="orange"
      >
        <div className="space-y-3 opacity-60 pointer-events-none">
          {[
            { label: 'Daily schedule summary', sub: 'Get a morning briefing of your day' },
            { label: 'Task reminders', sub: '15 min before scheduled sessions' },
            { label: 'Overdue task alerts', sub: 'When scheduled tasks are missed' },
          ].map(({ label, sub }) => (
            <div key={label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
              </div>
              <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-2">
          <Bell className="w-3.5 h-3.5" />
          Notification settings are coming in a future update!
        </div>
      </SectionCard>

      {/* Save Footer */}
      <div className="flex justify-end pt-2 pb-6">
        <SaveButton saving={saving} saved={saved} onSave={handleSave} />
      </div>
    </div>
  );
}
