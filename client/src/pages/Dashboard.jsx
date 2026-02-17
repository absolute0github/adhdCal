import { useState } from 'react';
import { List, Columns } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TaskForm from '../components/tasks/TaskForm';
import TaskList from '../components/tasks/TaskList';
import KanbanBoard from '../components/tasks/KanbanBoard';
import ScheduleWizard from '../components/scheduling/ScheduleWizard';

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const [schedulingTask, setSchedulingTask] = useState(null);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('adhdcal-view-mode') || 'list'
  );

  function handleSchedule(task) {
    setSchedulingTask(task);
  }

  function handleViewChange(mode) {
    setViewMode(mode);
    localStorage.setItem('adhdcal-view-mode', mode);
  }

  return (
    <div className={`mx-auto space-y-6 ${viewMode === 'board' ? 'max-w-full px-4' : 'max-w-3xl'}`}>
      {/* Auth Notice */}
      {!isLoading && !isAuthenticated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Sign in with Google</strong> to access your calendar and schedule tasks.
            You can still add tasks to your backlog without signing in.
          </p>
        </div>
      )}

      {/* Task Form */}
      <TaskForm onScheduleNew={handleSchedule} />

      {/* View Toggle */}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => handleViewChange('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            viewMode === 'list'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <List className="w-4 h-4" />
          List
        </button>
        <button
          onClick={() => handleViewChange('board')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            viewMode === 'board'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Columns className="w-4 h-4" />
          Board
        </button>
      </div>

      {/* Task View */}
      {viewMode === 'list' ? (
        <TaskList onSchedule={handleSchedule} />
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
