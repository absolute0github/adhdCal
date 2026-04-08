/**
 * OnboardingWizard — shown once to new users after first login.
 * Guides them through: working days → work hours → session length → first task.
 * State is tracked in localStorage ('adhdcal-onboarded').
 */

import { useState, useEffect } from 'react';
import { Brain, Clock, Calendar, CheckCircle, ChevronRight, ChevronLeft, Zap, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const SESSION_LENGTHS = [
  { value: 25, label: '25 min', emoji: '⚡', description: 'Classic Pomodoro' },
  { value: 45, label: '45 min', emoji: '🧠', description: 'Deep focus (recommended)' },
  { value: 60, label: '60 min', emoji: '⏰', description: 'Full hour blocks' },
];

const STEPS = [
  { id: 'welcome', title: 'Welcome to ADHDCal', icon: Brain },
  { id: 'schedule', title: 'When do you work?', icon: Calendar },
  { id: 'sessions', title: 'How long can you focus?', icon: Clock },
  { id: 'done', title: "You're all set!", icon: CheckCircle },
];

const ONBOARDING_KEY = 'adhdcal-onboarded';

export default function OnboardingWizard() {
  const { isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [workingDays, setWorkingDays] = useState({
    monday: true, tuesday: true, wednesday: true,
    thursday: true, friday: true, saturday: false, sunday: false,
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [sessionLength, setSessionLength] = useState(45);

  // Show wizard for authenticated users who haven't onboarded
  useEffect(() => {
    if (!isAuthenticated) return;
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      // Small delay so the main UI renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated]);

  const toggleDay = (key) => {
    setWorkingDays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.put('/preferences', {
        workingDays,
        workingHours: { start: startTime, end: endTime },
        sessionLength,
        scheduleMode: 'easier-first',
      });
    } catch (e) {
      console.error('OnboardingWizard: failed to save prefs', e);
      // Don't block completion — preferences can be set in Settings later
    } finally {
      setSaving(false);
      localStorage.setItem(ONBOARDING_KEY, '1');
      setVisible(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'skipped');
    setVisible(false);
  };

  if (!visible) return null;

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? 'bg-indigo-500 w-4' : i < step ? 'bg-indigo-300' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Skip setup
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Step Icon + Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <StepIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {step === 0 ? `Hey ${firstName} 👋` : currentStep.title}
            </h2>
          </div>

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="space-y-4 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                ADHDCal automatically schedules your tasks into your calendar — based on <strong>when you're actually available</strong> and <strong>how your brain works best</strong>.
              </p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { emoji: '🧠', label: 'Brain dump tasks' },
                  { emoji: '📅', label: 'Auto-schedules them' },
                  { emoji: '✅', label: 'You just show up' },
                ].map(({ emoji, label }) => (
                  <div key={label} className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{emoji}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Takes about 60 seconds to set up. Let's go!
              </p>
            </div>
          )}

          {/* ── Step 1: Schedule ── */}
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                ADHDCal only schedules tasks during your work window. Pick your days and hours.
              </p>

              {/* Working Days */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Working Days
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_OF_WEEK.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleDay(key)}
                      className={`flex-1 min-w-[38px] py-2.5 rounded-xl text-xs font-bold transition-all ${
                        workingDays[key]
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    Start
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    End
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Session Length ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                This is how long each work block will be when scheduling tasks. You can change it anytime.
              </p>
              <div className="space-y-2">
                {SESSION_LENGTHS.map(({ value, label, emoji, description }) => (
                  <button
                    key={value}
                    onClick={() => setSessionLength(value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      sessionLength === value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${
                        sessionLength === value ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                    </div>
                    {sessionLength === value && (
                      <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center text-gray-400">
                Tip: ADHD brains often do well with 45-min blocks — long enough to get into flow, short enough to not burn out.
              </p>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Perfect. ADHDCal knows when you work and how long your sessions should be.
              </p>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                  Your setup
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.filter(d => workingDays[d.key]).map(d => (
                    <span key={d.key} className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded-md font-medium">
                      {d.label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  🕘 {startTime} – {endTime} · ⏱ {sessionLength}-minute sessions
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Now add your first task and let ADHDCal schedule it! 👇
              </p>
            </div>
          )}
        </div>

        {/* Footer / Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {step === 0 ? "Let's go" : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
              ) : (
                <>Start scheduling! 🚀</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
