import { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Zap, Shuffle, Clock, Target, AlertCircle, Check } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { parseDuration, formatDuration } from '../../utils/timeUtils';
import { generateRandomTasks } from '../../utils/taskGenerator';
import { createTasksBatch } from '../../services/taskService';
import BrainDumpForm from './BrainDumpForm';
import ProFeatureBadge from '../ui/ProFeatureBadge';
import UpgradeModal from '../ui/UpgradeModal';

const importanceLabels = { 1: 'Low', 2: 'Low-Med', 3: 'Medium', 4: 'High', 5: 'Critical' };
const complexityLabels = { 1: 'Very Easy', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Very Hard' };

const importanceColors = {
  1: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700',
  2: 'bg-adhd-calm-100 text-adhd-calm-600 border-adhd-calm-200 hover:bg-adhd-calm-200 dark:bg-adhd-calm-900/30 dark:text-adhd-calm-400 dark:border-adhd-calm-800 dark:hover:bg-adhd-calm-900/50',
  3: 'bg-adhd-warn-100 text-adhd-warn-700 border-adhd-warn-200 hover:bg-adhd-warn-200 dark:bg-adhd-warn-900/30 dark:text-adhd-warn-400 dark:border-adhd-warn-800 dark:hover:bg-adhd-warn-900/50',
  4: 'bg-adhd-warn-200 text-adhd-warn-800 border-adhd-warn-300 hover:bg-adhd-warn-300 dark:bg-adhd-warn-800/40 dark:text-adhd-warn-300 dark:border-adhd-warn-700 dark:hover:bg-adhd-warn-800/60',
  5: 'bg-adhd-danger-100 text-adhd-danger-700 border-adhd-danger-200 hover:bg-adhd-danger-200 dark:bg-adhd-danger-900/30 dark:text-adhd-danger-400 dark:border-adhd-danger-800 dark:hover:bg-adhd-danger-900/50',
};

const importanceActiveColors = {
  1: 'bg-gray-500 text-white border-gray-500',
  2: 'bg-adhd-calm-500 text-white border-adhd-calm-500',
  3: 'bg-adhd-warn-500 text-white border-adhd-warn-500',
  4: 'bg-adhd-warn-600 text-white border-adhd-warn-600',
  5: 'bg-adhd-danger-500 text-white border-adhd-danger-500',
};

const complexityColors = {
  1: 'bg-adhd-focus-100 text-adhd-focus-600 border-adhd-focus-200 hover:bg-adhd-focus-200 dark:bg-adhd-focus-900/30 dark:text-adhd-focus-400 dark:border-adhd-focus-800 dark:hover:bg-adhd-focus-900/50',
  2: 'bg-adhd-focus-100 text-adhd-focus-600 border-adhd-focus-200 hover:bg-adhd-focus-200 dark:bg-adhd-focus-900/30 dark:text-adhd-focus-400 dark:border-adhd-focus-800 dark:hover:bg-adhd-focus-900/50',
  3: 'bg-adhd-warn-100 text-adhd-warn-700 border-adhd-warn-200 hover:bg-adhd-warn-200 dark:bg-adhd-warn-900/30 dark:text-adhd-warn-400 dark:border-adhd-warn-800 dark:hover:bg-adhd-warn-900/50',
  4: 'bg-adhd-danger-100 text-adhd-danger-700 border-adhd-danger-200 hover:bg-adhd-danger-200 dark:bg-adhd-danger-900/30 dark:text-adhd-danger-400 dark:border-adhd-danger-800 dark:hover:bg-adhd-danger-900/50',
  5: 'bg-adhd-danger-100 text-adhd-danger-700 border-adhd-danger-200 hover:bg-adhd-danger-200 dark:bg-adhd-danger-900/30 dark:text-adhd-danger-400 dark:border-adhd-danger-800 dark:hover:bg-adhd-danger-900/50',
};

const complexityActiveColors = {
  1: 'bg-adhd-focus-500 text-white border-adhd-focus-500',
  2: 'bg-adhd-focus-500 text-white border-adhd-focus-500',
  3: 'bg-adhd-warn-500 text-white border-adhd-warn-500',
  4: 'bg-adhd-danger-500 text-white border-adhd-danger-500',
  5: 'bg-adhd-danger-600 text-white border-adhd-danger-600',
};

export default function TaskFormImproved({ onScheduleNew }) {
  const { addTask, autoScheduleTask, refreshTasks } = useTasks();
  const { isAuthenticated, hasFeatureAccess } = useAuth();
  const [mode, setMode] = useState('single');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [complexity, setComplexity] = useState(3);
  const [importance, setImportance] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [genCount, setGenCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quickMode, setQuickMode] = useState(false);

  const nameInputRef = useRef(null);
  const canUseBrainDump = hasFeatureAccess('brain_dump');

  // Focus name input on mount for better UX
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  // Quick add with Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit(e, false);
    } else if (e.key === 'Enter' && e.shiftKey && isAuthenticated) {
      e.preventDefault();
      handleAutoSchedule(e);
    }
  };

  async function handleSubmit(e, shouldSchedule = false) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a task name');
      nameInputRef.current?.focus();
      return;
    }

    const durationMinutes = parseDuration(duration || '1h');
    if (!durationMinutes || durationMinutes <= 0) {
      setError('Please enter a valid duration (e.g., "2h", "90m", "1h 30m")');
      return;
    }

    if (shouldSchedule && onScheduleNew) {
      onScheduleNew({
        name: name.trim(),
        estimatedDuration: durationMinutes,
        complexity,
        importance,
        isNew: true
      });
      resetForm();
      return;
    }

    setIsSubmitting(true);
    try {
      await addTask({
        name: name.trim(),
        estimatedDuration: durationMinutes,
        complexity,
        importance
      });

      setSuccessMessage(`Added "${name.trim()}" to backlog`);
      resetForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAutoSchedule(e) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError('Please enter a task name');
      nameInputRef.current?.focus();
      return;
    }

    const durationMinutes = parseDuration(duration || '1h');
    if (!durationMinutes || durationMinutes <= 0) {
      setError('Please enter a valid duration (e.g., "2h", "90m", "1h 30m")');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTask = await addTask({
        name: name.trim(),
        estimatedDuration: durationMinutes,
        complexity,
        importance
      });
      const result = await autoScheduleTask(newTask.id);
      setSuccessMessage(`✨ Scheduled ${result.sessionsCreated} session(s) for "${name.trim()}"`);
      resetForm();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerateTestTasks() {
    setIsGenerating(true);
    setError(null);
    try {
      const tasks = generateRandomTasks(genCount);
      await createTasksBatch(tasks);
      await refreshTasks();
      setSuccessMessage(`Generated ${tasks.length} test tasks`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  const resetForm = () => {
    setName('');
    setDuration('');
    setComplexity(3);
    setImportance(3);
    nameInputRef.current?.focus();
  };

  const parsedDuration = parseDuration(duration || '1h');
  const durationPreview = parsedDuration ? formatDuration(parsedDuration) : 'auto: 1 hour';

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-adhd-soft border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-adhd-calm-500 to-adhd-calm-600 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Add New Task
          </h2>

          <button
            onClick={() => setQuickMode(!quickMode)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-150 ${
              quickMode 
                ? 'bg-adhd-calm-100 text-adhd-calm-700 border border-adhd-calm-200 dark:bg-adhd-calm-900/30 dark:text-adhd-calm-300 dark:border-adhd-calm-800'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {quickMode ? 'Full Mode' : 'Quick Mode'}
          </button>
        </div>

        {/* Mode Toggle */}
        {!quickMode && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-150 ${
                mode === 'single'
                  ? 'bg-adhd-calm-600 text-white shadow-adhd-glow'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Plus className="w-4 h-4" />
              Single Task
            </button>

            <button
              type="button"
              onClick={() => {
                if (canUseBrainDump) {
                  setMode('brainDump');
                } else {
                  setShowUpgradeModal(true);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-150 ${
                mode === 'brainDump'
                  ? 'bg-adhd-calm-600 text-white shadow-adhd-glow'
                  : canUseBrainDump
                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4" />
              Brain Dump
              {!canUseBrainDump && <ProFeatureBadge className="ml-1" />}
            </button>
          </div>
        )}

        {mode === 'brainDump' ? (
          <BrainDumpForm
            onBack={() => setMode('single')}
            onScheduleNew={onScheduleNew}
          />
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            {/* Task Name - Always visible and prominent */}
            <div>
              <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What needs to be done?
              </label>
              <input
                ref={nameInputRef}
                id="taskName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your task and press Ctrl+Enter to add..."
                className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-adhd-calm-500 focus:border-adhd-calm-500 outline-none transition-all duration-150"
                autoComplete="off"
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                💡 Tip: Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Ctrl+Enter</kbd> to add quickly
                {isAuthenticated && (
                  <> or <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Shift+Enter</kbd> to auto-schedule</>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How long will it take?
              </label>
              <div className="relative">
                <input
                  id="duration"
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="e.g., 2h, 90m, 1h 30m (leave blank for 1 hour)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-adhd-calm-500 focus:border-adhd-calm-500 outline-none transition-all duration-150 pr-32"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                  = {durationPreview}
                </span>
              </div>
            </div>

            {!quickMode && (
              <>
                {/* Importance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    How important is this?
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setImportance(level)}
                        className={`p-3 rounded-lg text-sm font-medium border transition-all duration-150 hover:scale-105 ${
                          importance === level
                            ? importanceActiveColors[level]
                            : importanceColors[level]
                        }`}
                      >
                        <div className="text-lg mb-1">P{level}</div>
                        <div className="text-xs opacity-75">{importanceLabels[level]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complexity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    How complex is this?
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setComplexity(level)}
                        className={`p-3 rounded-lg text-sm font-medium border transition-all duration-150 hover:scale-105 ${
                          complexity === level
                            ? complexityActiveColors[level]
                            : complexityColors[level]
                        }`}
                      >
                        <div className="text-lg mb-1">C{level}</div>
                        <div className="text-xs opacity-75">{complexityLabels[level]}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Error and Success Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-adhd-danger-50 dark:bg-adhd-danger-900/20 border border-adhd-danger-200 dark:border-adhd-danger-800 rounded-lg text-adhd-danger-700 dark:text-adhd-danger-300 animate-slide-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-adhd-focus-50 dark:bg-adhd-focus-900/20 border border-adhd-focus-200 dark:border-adhd-focus-800 rounded-lg text-adhd-focus-700 dark:text-adhd-focus-300 animate-slide-in">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{successMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Plus className="w-4 h-4" />
                {isSubmitting ? 'Adding...' : 'Add to Backlog'}
              </button>

              {isAuthenticated && (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={isSubmitting || !name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-adhd-calm-600 text-white rounded-lg hover:bg-adhd-calm-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-adhd-glow"
                  >
                    <Calendar className="w-4 h-4" />
                    Add & Schedule
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleAutoSchedule}
                    disabled={isSubmitting || !name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-adhd-focus-600 text-white rounded-lg hover:bg-adhd-focus-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Zap className="w-4 h-4" />
                    Add & Auto-Schedule
                  </button>
                </>
              )}
            </div>
          </form>
        )}

        {/* Generate Test Tasks */}
        {isAuthenticated && !quickMode && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>Testing:</span>
              <input
                type="number"
                min={1}
                max={30}
                value={genCount}
                onChange={(e) => setGenCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 px-2 py-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:ring-1 focus:ring-adhd-calm-500 focus:border-adhd-calm-500 outline-none"
              />
              <button
                type="button"
                onClick={handleGenerateTestTasks}
                disabled={isGenerating}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-150 disabled:opacity-50"
              >
                <Shuffle className="w-3.5 h-3.5" />
                {isGenerating ? 'Generating...' : 'Generate Test Tasks'}
              </button>
            </div>
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Brain Dump Mode"
      />
    </>
  );
}