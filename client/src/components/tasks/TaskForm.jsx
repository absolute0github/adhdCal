import { useState } from 'react';
import { Plus, Calendar, Zap, Shuffle } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { parseDuration, formatDuration } from '../../utils/timeUtils';
import { generateRandomTasks } from '../../utils/taskGenerator';
import { createTasksBatch } from '../../services/taskService';
import BrainDumpForm from './BrainDumpForm';
import ProFeatureBadge from '../ui/ProFeatureBadge';
import UpgradeModal from '../ui/UpgradeModal';

const importanceLabels = { 1: 'Low', 2: 'Low-Med', 3: 'Medium', 4: 'High', 5: 'Critical' };
const importanceColors = {
  1: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  2: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
  3: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  4: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  5: 'bg-red-100 text-red-700 hover:bg-red-200',
};
const importanceActiveColors = {
  1: 'bg-gray-500 text-white',
  2: 'bg-blue-500 text-white',
  3: 'bg-yellow-500 text-white',
  4: 'bg-orange-500 text-white',
  5: 'bg-red-500 text-white',
};

export default function TaskForm({ onScheduleNew }) {
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

  const canUseBrainDump = hasFeatureAccess('brain_dump');

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

    if (shouldSchedule && onScheduleNew) {
      onScheduleNew({
        name: name.trim(),
        estimatedDuration: durationMinutes,
        complexity,
        importance,
        isNew: true
      });
      setName('');
      setDuration('');
      setComplexity(3);
      setImportance(3);
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

      setName('');
      setDuration('');
      setComplexity(3);
      setImportance(3);
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
      return;
    }

    const durationMinutes = parseDuration(duration);
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
      setSuccessMessage(`Scheduled ${result.sessionsCreated} session(s) for "${name.trim()}"`);
      setName('');
      setDuration('');
      setComplexity(3);
      setImportance(3);
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

  const parsedDuration = parseDuration(duration);
  const durationPreview = parsedDuration ? formatDuration(parsedDuration) : null;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h2>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'brainDump'
                ? 'bg-blue-600 text-white'
                : canUseBrainDump
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4" />
            Brain Dump
            {!canUseBrainDump && <ProFeatureBadge className="ml-1" />}
          </button>
        </div>

        {mode === 'brainDump' ? (
          <BrainDumpForm
            onBack={() => setMode('single')}
            onScheduleNew={onScheduleNew}
          />
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)}>
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
              {successMessage && (
                <p className="text-sm text-green-600">{successMessage}</p>
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
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, true)}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Calendar className="w-4 h-4" />
                      Add & Schedule
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoSchedule}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      Add & Auto-Schedule
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Generate Test Tasks */}
        {isAuthenticated && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Test:</span>
              <input
                type="number"
                min={1}
                max={30}
                value={genCount}
                onChange={(e) => setGenCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-14 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
              <button
                type="button"
                onClick={handleGenerateTestTasks}
                disabled={isGenerating}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
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
