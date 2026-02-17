import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Edit2, Trash2, CheckCircle, Calendar } from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';

const complexityColors = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-green-100 text-green-600',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
};

export default function KanbanCard({ task, onEdit, onDelete, onComplete, overlay }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCompleted = task.status === 'completed';
  const sessionCount = task.scheduledSessions?.length || 0;

  if (overlay) {
    return (
      <div className="bg-white rounded-lg border-2 border-blue-400 p-3 shadow-lg rotate-2 opacity-90 w-64">
        <p className="font-medium text-gray-900 text-sm truncate">{task.name}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {formatDuration(task.estimatedDuration)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-30 border-blue-300' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <p className={`font-medium text-sm truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
        {task.name}
      </p>

      <div className="flex items-center gap-2 mt-1.5">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {formatDuration(task.estimatedDuration)}
        </span>
        {task.complexity && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium leading-none ${complexityColors[task.complexity] || complexityColors[3]}`}>
            C{task.complexity}
          </span>
        )}
        {sessionCount > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-blue-500">
            <Calendar className="w-3 h-3" />
            {sessionCount}
          </span>
        )}
      </div>

      {/* Hover actions */}
      <div className="hidden group-hover:flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
        {onComplete && !isCompleted && (
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 text-purple-500 hover:bg-purple-50 rounded transition-colors"
            title="Mark complete"
          >
            <CheckCircle className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
          title="Edit task"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
