import { ListTodo, Calendar } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 z-50">
      <div className="flex items-center justify-around">
        <button
          onClick={() => onTabChange('tasks')}
          className={`flex flex-col items-center gap-1 py-2 px-6 rounded-lg transition-colors ${
            activeTab === 'tasks'
              ? 'text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListTodo className="w-6 h-6" />
          <span className="text-xs font-medium">Tasks</span>
        </button>

        <button
          onClick={() => onTabChange('calendar')}
          className={`flex flex-col items-center gap-1 py-2 px-6 rounded-lg transition-colors ${
            activeTab === 'calendar'
              ? 'text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-xs font-medium">Calendar</span>
        </button>
      </div>
    </nav>
  );
}
