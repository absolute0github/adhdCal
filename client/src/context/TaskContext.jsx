import { createContext, useContext, useState, useCallback } from 'react';
import * as taskService from '../services/taskService';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async (status = null) => {
    try {
      setIsLoading(true);
      const data = await taskService.getTasks(status);
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTask = useCallback(async (task) => {
    try {
      const newTask = await taskService.createTask(task);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    try {
      const updatedTask = await taskService.updateTask(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeTask = useCallback(async (id) => {
    try {
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const scheduleTask = useCallback(async (id, slots, sessionPreference) => {
    try {
      const result = await taskService.scheduleTask(id, slots, sessionPreference);
      setTasks(prev => prev.map(t => t.id === id ? result.task : t));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const unscheduleSession = useCallback(async (taskId, sessionId) => {
    try {
      const result = await taskService.unscheduleSession(taskId, sessionId);
      setTasks(prev => prev.map(t => t.id === taskId ? result.task : t));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Get tasks by status
  const backlogTasks = tasks.filter(t => t.status === 'backlog');
  const scheduledTasks = tasks.filter(t => t.status === 'scheduled' || t.status === 'partial');

  const value = {
    tasks,
    backlogTasks,
    scheduledTasks,
    isLoading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    removeTask,
    scheduleTask,
    unscheduleSession,
    clearError: () => setError(null)
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
