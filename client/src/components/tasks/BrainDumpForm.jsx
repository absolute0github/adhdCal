import { useState } from 'react';
import { ArrowLeft, Plus, Calendar, Zap, Trash2, AlertCircle, CheckCircle, Shuffle } from 'lucide-react';
import { parseDuration, formatDuration } from '../../utils/timeUtils';
import { generateRandomTaskNames } from '../../utils/taskGenerator';
import { createTasksBatch } from '../../services/taskService';
import { useTasks } from '../../context/TaskContext';

const complexityColors = {
  1: 'bg-green-500 text-white',
  2: 'bg-green-500 text-white',
  3: 'bg-yellow-500 text-white',
  4: 'bg-red-500 text-white',
  5: 'bg-red-500 text-white',
};

export default function BrainDumpForm({ onBack, onScheduleNew }) {
  const { refreshTasks, autoScheduleTask } = useTasks();
  const [step, setStep] = useState('input'); // 'input', 'review', or 'auto-scheduling'
  const [rawText, setRawText] = useState('');
  const [parsedTasks, setParsedTasks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [autoScheduleProgress, setAutoScheduleProgress] = useState({ current: 0, total: 0, results: [] });

  // Parse the raw text into task objects
  function handleParse() {
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      setError('Please enter at least one task');
      return;
    }

    const tasks = lines.map((name, index) => ({
      id: `temp-${index}`,
      name,
      duration: '',
      durationMinutes: null,
      complexity: 3
    }));

    setParsedTasks(tasks);
    setError(null);
    setStep('review');
  }

  // Update duration for a specific task
  function updateTaskDuration(id, duration) {
    setParsedTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          const minutes = parseDuration(duration);
          return {
            ...task,
            duration,
            durationMinutes: minutes
          };
        }
        return task;
      })
    );
  }

  // Update complexity for a specific task
  function updateTaskComplexity(id, complexity) {
    setParsedTasks(prev =>
      prev.map(task => task.id === id ? { ...task, complexity } : task)
    );
  }

  // Fill textarea with random task names
  function fillWithRandomTasks() {
    const names = generateRandomTaskNames(8);
    setRawText(names.join('\n'));
  }

  // Remove a task from the list
  function removeTask(id) {
    setParsedTasks(prev => prev.filter(task => task.id !== id));
  }

  // Check if all tasks have valid durations
  function allTasksValid() {
    return parsedTasks.length > 0 && parsedTasks.every(task => task.durationMinutes > 0);
  }

  // Submit tasks to backlog
  async function handleAddToBacklog() {
    if (!allTasksValid()) {
      setError('Please enter a valid duration for all tasks');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tasksToCreate = parsedTasks.map(task => ({
        name: task.name,
        estimatedDuration: task.durationMinutes,
        complexity: task.complexity || 3
      }));

      await createTasksBatch(tasksToCreate);
      await refreshTasks();

      // Reset form
      setRawText('');
      setParsedTasks([]);
      setStep('input');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create tasks');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit tasks and schedule them
  async function handleAddAndSchedule() {
    if (!allTasksValid()) {
      setError('Please enter a valid duration for all tasks');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tasksToCreate = parsedTasks.map(task => ({
        name: task.name,
        estimatedDuration: task.durationMinutes,
        complexity: task.complexity || 3
      }));

      const result = await createTasksBatch(tasksToCreate);

      // Refresh tasks to get the new ones
      await refreshTasks();

      // Pass created tasks to scheduling wizard
      if (onScheduleNew && result.tasks?.length > 0) {
        onScheduleNew({
          tasks: result.tasks,
          isBatch: true
        });
      }

      // Reset form
      setRawText('');
      setParsedTasks([]);
      setStep('input');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create tasks');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit tasks and auto-schedule them all
  async function handleAddAndAutoSchedule() {
    if (!allTasksValid()) {
      setError('Please enter a valid duration for all tasks');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tasksToCreate = parsedTasks.map(task => ({
        name: task.name,
        estimatedDuration: task.durationMinutes,
        complexity: task.complexity || 3
      }));

      const result = await createTasksBatch(tasksToCreate);
      await refreshTasks();

      if (!result.tasks || result.tasks.length === 0) {
        setError('No tasks were created');
        return;
      }

      // Auto-schedule each task sequentially
      setStep('auto-scheduling');
      const total = result.tasks.length;
      const results = [];

      for (let i = 0; i < total; i++) {
        const task = result.tasks[i];
        setAutoScheduleProgress({ current: i + 1, total, results });

        try {
          const scheduleResult = await autoScheduleTask(task.id);
          results.push({ name: task.name, success: true, sessions: scheduleResult.sessionsCreated });
        } catch (err) {
          results.push({ name: task.name, success: false, error: err.response?.data?.error || err.message });
        }
      }

      setAutoScheduleProgress({ current: total, total, results });

      // Auto-dismiss after showing results briefly
      setTimeout(() => {
        setRawText('');
        setParsedTasks([]);
        setStep('input');
        setAutoScheduleProgress({ current: 0, total: 0, results: [] });
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create tasks');
      setStep('review');
    } finally {
      setIsSubmitting(false);
    }
  }

  const taskCount = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0).length;

  if (step === 'auto-scheduling') {
    const { current, total, results } = autoScheduleProgress;
    const done = current === total && results.length === total;
    const successCount = results.filter(r => r.success).length;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {done ? 'Auto-Scheduling Complete' : 'Auto-Scheduling Tasks...'}
        </h3>

        {!done && (
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
            <p className="text-sm text-gray-600">
              Scheduling task {current} of {total}...
            </p>
          </div>
        )}

        {done && (
          <p className="text-sm text-gray-600">
            {successCount} of {total} task{total > 1 ? 's' : ''} scheduled successfully.
          </p>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
              r.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {r.success
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              <span className="truncate">
                {r.name} {r.success ? `— ${r.sessions} session(s)` : `— ${r.error}`}
              </span>
            </div>
          ))}
        </div>

        {done && (
          <button
            onClick={() => {
              setRawText('');
              setParsedTasks([]);
              setStep('input');
              setAutoScheduleProgress({ current: 0, total: 0, results: [] });
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        )}
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Review Tasks ({parsedTasks.length})
          </h3>
          <button
            onClick={() => setStep('input')}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {parsedTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {task.name}
                </p>
              </div>

              <div className="relative flex-shrink-0 w-32">
                <input
                  type="text"
                  value={task.duration}
                  onChange={(e) => updateTaskDuration(task.id, e.target.value)}
                  placeholder="e.g., 1h 30m"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {task.durationMinutes && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {formatDuration(task.durationMinutes)}
                  </span>
                )}
              </div>

              <div className="flex gap-0.5 flex-shrink-0">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateTaskComplexity(task.id, level)}
                    className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                      task.complexity === level
                        ? complexityColors[level]
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={`Complexity ${level}`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <button
                onClick={() => removeTask(task.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {parsedTasks.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No tasks to review. Go back and add some tasks.
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleAddToBacklog}
            disabled={isSubmitting || !allTasksValid()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add All to Backlog
          </button>

          <button
            onClick={handleAddAndSchedule}
            disabled={isSubmitting || !allTasksValid()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-4 h-4" />
            Add & Schedule All
          </button>

          <button
            onClick={handleAddAndAutoSchedule}
            disabled={isSubmitting || !allTasksValid()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Add & Auto-Schedule All
          </button>
        </div>
      </div>
    );
  }

  // Input step
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Brain Dump</h3>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Write all your tasks below, one per line. Don't worry about details yet - just get everything out of your head.
      </p>

      <div>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Write quarterly report&#10;Call dentist&#10;Fix login bug&#10;Research project tools"
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500">
            One task per line
          </p>
          <button
            type="button"
            onClick={fillWithRandomTasks}
            className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 transition-colors"
          >
            <Shuffle className="w-3 h-3" />
            Fill with random tasks
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleParse}
        disabled={taskCount === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Parse Tasks {taskCount > 0 && `(${taskCount})`}
      </button>
    </div>
  );
}
