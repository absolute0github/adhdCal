import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import TaskForm from '../components/tasks/TaskForm';
import TaskList from '../components/tasks/TaskList';
import ScheduleWizard from '../components/scheduling/ScheduleWizard';

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const [schedulingTask, setSchedulingTask] = useState(null);

  function handleSchedule(task) {
    setSchedulingTask(task);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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

      {/* Task List */}
      <TaskList onSchedule={handleSchedule} />

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
