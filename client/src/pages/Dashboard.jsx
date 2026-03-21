import { useState, useCallback } from 'react';
import { List, Columns, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import TaskFormImproved from '../components/tasks/TaskFormImproved';
import TaskListImproved from '../components/tasks/TaskListImproved';
import KanbanBoard from '../components/tasks/KanbanBoard';
import ScheduleWizard from '../components/scheduling/ScheduleWizard';

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { refreshTasks } = useTasks();
  const [schedulingTask, setSchedulingTask] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('adhdcal-view-mode') || 'list'
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshTasks();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshTasks]);

  function handleSchedule(task) {
    setSchedulingTask(task);
  }

  function handleViewChange(mode) {
    setViewMode(mode);
    localStorage.setItem('adhdcal-view-mode', mode);
  }

  return (
    <div className={`mx-auto space-y-6 ${viewMode === 'board' ? 'max-w-full px-4' : 'max-w-4xl'}`}>
      {/* Auth Notice */}
      {!isLoading && !isAuthenticated && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 animate-fade-in">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Sign in with Google</strong> to access your calendar and schedule tasks.
            You can still add tasks to your backlog without signing in.
          </p>
        </div>
      )}

      {/* Task Form */}
      <TaskFormImproved onScheduleNew={handleSchedule} />

      {/* View Toggle & Refresh */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 mr-2"
          title="Refresh tasks"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          onClick={() => handleViewChange('list')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            viewMode === 'list'
              ? 'bg-adhd-calm-100 text-adhd-calm-700 border border-adhd-calm-200 dark:bg-adhd-calm-900/30 dark:text-adhd-calm-300 dark:border-adhd-calm-800 shadow-adhd-focus'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <List className="w-4 h-4" />
          List
        </button>
        <button
          onClick={() => handleViewChange('board')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            viewMode === 'board'
              ? 'bg-adhd-calm-100 text-adhd-calm-700 border border-adhd-calm-200 dark:bg-adhd-calm-900/30 dark:text-adhd-calm-300 dark:border-adhd-calm-800 shadow-adhd-focus'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Columns className="w-4 h-4" />
          Board
        </button>
      </div>

      {/* Task View */}
      {viewMode === 'list' ? (
        <TaskListImproved onSchedule={handleSchedule} />
      ) : (
        <KanbanBoard />
      )}

      {/* Schedule Wizard Modal */}
      {schedulingTask && (
        <ScheduleWizard
          task={schedulingTask}
          onClose={() => setSchedulingTask(null)}
        />
      )}
    </div>
  );
}
