import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTasks } from '../../context/TaskContext';
import KanbanCard from './KanbanCard';
import EditTaskModal from './EditTaskModal';
import { formatDuration } from '../../utils/timeUtils';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'border-gray-300', headerBg: 'bg-gray-50', headerText: 'text-gray-700' },
  { id: 'partial', title: 'In Progress', color: 'border-yellow-300', headerBg: 'bg-yellow-50', headerText: 'text-yellow-700' },
  { id: 'scheduled', title: 'Scheduled', color: 'border-blue-300', headerBg: 'bg-blue-50', headerText: 'text-blue-700' },
  { id: 'completed', title: 'Done', color: 'border-purple-300', headerBg: 'bg-purple-50', headerText: 'text-purple-700' },
];

function KanbanColumn({ column, tasks, onEdit, onDelete, onComplete }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const totalDuration = tasks.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);

  return (
    <div className={`flex flex-col min-w-[250px] w-[250px] flex-shrink-0 lg:flex-1 lg:w-auto lg:min-w-0`}>
      <div className={`rounded-t-lg px-3 py-2 border-t-2 ${column.color} ${column.headerBg}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${column.headerText}`}>{column.title}</h3>
          <span className={`text-xs font-medium ${column.headerText} opacity-70`}>{tasks.length}</span>
        </div>
        {totalDuration > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">{formatDuration(totalDuration)} total</p>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] p-2 space-y-2 rounded-b-lg border border-t-0 transition-colors ${
          isOver ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50/50 border-gray-200'
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { tasks, fetchTasks, isLoading, updateTask, removeTask, completeTask } = useTasks();
  const [editingTask, setEditingTask] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const tasksByColumn = useMemo(() => {
    const grouped = { backlog: [], partial: [], scheduled: [], completed: [] };
    for (const task of tasks) {
      const col = grouped[task.status];
      if (col) col.push(task);
      else grouped.backlog.push(task);
    }
    return grouped;
  }, [tasks]);

  function handleDragStart(event) {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragEnd(event) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine target column — over.id could be a column id or another task id
    let targetColumn = COLUMNS.find(c => c.id === over.id)?.id;
    if (!targetColumn) {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) targetColumn = overTask.status;
    }

    if (!targetColumn || targetColumn === task.status) return;

    updateTask(taskId, { status: targetColumn });
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  async function handleDelete(taskId) {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await removeTask(taskId);
      } catch (err) {
        alert('Failed to delete task: ' + err.message);
      }
    }
  }

  async function handleSaveEdit(id, updates) {
    try {
      await updateTask(id, updates);
      setEditingTask(null);
    } catch (err) {
      alert('Failed to update task: ' + err.message);
    }
  }

  if (isLoading && tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile swipe hint */}
      <p className="text-xs text-gray-400 text-center mb-2 lg:hidden">
        Swipe to see all columns
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id]}
              onEdit={setEditingTask}
              onDelete={handleDelete}
              onComplete={completeTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanCard task={activeTask} overlay onEdit={() => {}} onDelete={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleSaveEdit}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  );
}
