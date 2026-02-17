import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  saveTasks
} from '../services/storageService.js';
import { findAvailableSlots, splitTaskIntoSessions, scheduleTask, unscheduleSession } from '../services/schedulingService.js';
import { getAuthenticatedClient, getFreeBusy } from '../services/googleCalendarService.js';
import { getPreferences } from '../services/storageService.js';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { hasFeatureAccess, FREE_TIER_LIMITS } from '../services/supabaseAuth.js';

const router = Router();

// Get all tasks (with optional status filter)
router.get('/', async (req, res, next) => {
  try {
    let tasks = await getTasks();

    // Filter by status if provided
    if (req.query.status) {
      tasks = tasks.filter(t => t.status === req.query.status);
    }

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Get single task
router.get('/:id', async (req, res, next) => {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Create new task (add to backlog)
router.post('/', async (req, res, next) => {
  try {
    const { name, estimatedDuration, sessionPreference, complexity } = req.body;

    if (!name || !estimatedDuration) {
      return res.status(400).json({ error: 'Name and estimatedDuration are required' });
    }

    const task = {
      id: uuidv4(),
      name,
      estimatedDuration: parseInt(estimatedDuration),
      sessionPreference: sessionPreference ? parseInt(sessionPreference) : null,
      complexity: complexity ? Math.min(5, Math.max(1, parseInt(complexity))) : 3,
      status: 'backlog',
      scheduledSessions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await createTask(task);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Batch create tasks (Brain Dump feature)
router.post('/batch', authMiddleware, async (req, res, next) => {
  try {
    const { tasks: taskList } = req.body;
    const user = req.user;

    // Check if user has brain_dump feature access
    if (!hasFeatureAccess(user, 'brain_dump')) {
      return res.status(403).json({
        error: 'Brain Dump is a Pro feature. Please upgrade to access this feature.'
      });
    }

    // Validate input
    if (!taskList || !Array.isArray(taskList) || taskList.length === 0) {
      return res.status(400).json({ error: 'Tasks array is required and must not be empty' });
    }

    // Validate each task
    for (let i = 0; i < taskList.length; i++) {
      const task = taskList[i];
      if (!task.name || typeof task.name !== 'string' || !task.name.trim()) {
        return res.status(400).json({ error: `Task at index ${i} is missing a valid name` });
      }
      if (!task.estimatedDuration || typeof task.estimatedDuration !== 'number' || task.estimatedDuration <= 0) {
        return res.status(400).json({ error: `Task at index ${i} is missing a valid estimatedDuration` });
      }
    }

    // Check task limit for free users
    const currentTasks = await getTasks();
    const currentCount = currentTasks.length;

    if (!hasFeatureAccess(user, 'unlimited_tasks')) {
      const newTotal = currentCount + taskList.length;
      if (newTotal > FREE_TIER_LIMITS.maxTasks) {
        return res.status(403).json({
          error: `Adding ${taskList.length} tasks would exceed your free tier limit of ${FREE_TIER_LIMITS.maxTasks} tasks. You currently have ${currentCount} tasks.`,
          currentCount,
          limit: FREE_TIER_LIMITS.maxTasks,
          requestedCount: taskList.length
        });
      }
    }

    // Create all tasks
    const createdTasks = [];
    const now = new Date().toISOString();

    for (const taskData of taskList) {
      const task = {
        id: uuidv4(),
        name: taskData.name.trim(),
        estimatedDuration: parseInt(taskData.estimatedDuration),
        sessionPreference: taskData.sessionPreference ? parseInt(taskData.sessionPreference) : null,
        complexity: taskData.complexity ? Math.min(5, Math.max(1, parseInt(taskData.complexity))) : 3,
        status: 'backlog',
        scheduledSessions: [],
        createdAt: now,
        updatedAt: now
      };
      createdTasks.push(task);
    }

    // Save all tasks at once
    const allTasks = [...currentTasks, ...createdTasks];
    await saveTasks(allTasks);

    res.status(201).json({
      success: true,
      count: createdTasks.length,
      tasks: createdTasks
    });
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', async (req, res, next) => {
  try {
    const { name, estimatedDuration, sessionPreference, status, complexity } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (estimatedDuration !== undefined) updates.estimatedDuration = parseInt(estimatedDuration);
    if (sessionPreference !== undefined) updates.sessionPreference = sessionPreference ? parseInt(sessionPreference) : null;
    if (status !== undefined) updates.status = status;
    if (complexity !== undefined) updates.complexity = Math.min(5, Math.max(1, parseInt(complexity)));

    const task = await updateTask(req.params.id, updates);
    res.json(task);
  } catch (error) {
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    next(error);
  }
});

// Batch delete tasks
router.delete('/batch', async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required and must not be empty' });
    }

    const allTasks = await getTasks();
    const idsSet = new Set(ids);
    const remaining = allTasks.filter(t => !idsSet.has(t.id));
    const deletedCount = allTasks.length - remaining.length;

    await saveTasks(remaining);
    res.json({ success: true, deletedCount });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteTask(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
    next(error);
  }
});

// Schedule a task
router.post('/:id/schedule', async (req, res, next) => {
  try {
    const { slots, sessionPreference } = req.body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'At least one slot is required' });
    }

    const task = await getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = await scheduleTask(req.params.id, slots, sessionPreference);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Batch auto-schedule tasks (with optional easier-first sorting)
router.post('/auto-schedule-batch', async (req, res, next) => {
  try {
    const { ids, easierFirst } = req.body;

    const allTasks = await getTasks();
    let tasksToSchedule;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const idsSet = new Set(ids);
      tasksToSchedule = allTasks.filter(t => idsSet.has(t.id) && (t.status === 'backlog' || t.status === 'partial'));
    } else {
      tasksToSchedule = allTasks.filter(t => t.status === 'backlog');
    }

    if (easierFirst) {
      tasksToSchedule.sort((a, b) => (a.complexity || 3) - (b.complexity || 3));
    }

    if (tasksToSchedule.length === 0) {
      return res.status(400).json({ error: 'No eligible tasks to schedule' });
    }

    const preferences = await getPreferences();
    const client = await getAuthenticatedClient();
    if (!client) {
      return res.status(401).json({ error: 'Google Calendar not connected. Please connect your calendar first.' });
    }

    const results = [];
    for (const task of tasksToSchedule) {
      try {
        const timeMin = startOfDay(new Date());
        const timeMax = endOfDay(addDays(new Date(), 14));
        const busyPeriods = await getFreeBusy(client, timeMin, timeMax);
        const availableSlots = findAvailableSlots(busyPeriods, preferences, { start: timeMin, end: timeMax });

        if (availableSlots.length === 0) {
          results.push({ id: task.id, name: task.name, success: false, error: 'No available slots' });
          continue;
        }

        const sessionLength = task.sessionPreference || preferences.defaultSessionLength;
        const { sessions } = splitTaskIntoSessions(task, availableSlots, sessionLength);

        if (sessions.length === 0) {
          results.push({ id: task.id, name: task.name, success: false, error: 'No suitable slots' });
          continue;
        }

        const result = await scheduleTask(task.id, sessions, sessionLength);
        results.push({ id: task.id, name: task.name, success: true, sessionsCreated: result.sessionsCreated });
      } catch (err) {
        results.push({ id: task.id, name: task.name, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    res.json({ success: true, scheduled: successCount, total: results.length, results });
  } catch (error) {
    next(error);
  }
});

// Auto-schedule a task (find slots and schedule in one step)
router.post('/:id/auto-schedule', async (req, res, next) => {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const preferences = await getPreferences();
    const client = await getAuthenticatedClient();
    if (!client) {
      return res.status(401).json({ error: 'Google Calendar not connected. Please connect your calendar first.' });
    }

    // Get free/busy data for the next 14 days
    const timeMin = startOfDay(new Date());
    const timeMax = endOfDay(addDays(new Date(), 14));
    const busyPeriods = await getFreeBusy(client, timeMin, timeMax);

    // Find available slots
    const availableSlots = findAvailableSlots(
      busyPeriods,
      preferences,
      { start: timeMin, end: timeMax }
    );

    if (availableSlots.length === 0) {
      return res.status(409).json({ error: 'No available time slots found in the next 14 days.' });
    }

    // Split task into sessions that fit available slots
    const sessionLength = task.sessionPreference || preferences.defaultSessionLength;
    const { sessions, fullyScheduled } = splitTaskIntoSessions(task, availableSlots, sessionLength);

    if (sessions.length === 0) {
      return res.status(409).json({ error: 'Could not find suitable slots for this task.' });
    }

    // Schedule the sessions (creates calendar events)
    const result = await scheduleTask(req.params.id, sessions, sessionLength);

    res.json({
      ...result,
      fullyScheduled
    });
  } catch (error) {
    next(error);
  }
});

// Unschedule a session
router.delete('/:id/sessions/:sessionId', async (req, res, next) => {
  try {
    const result = await unscheduleSession(req.params.id, req.params.sessionId);
    res.json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
