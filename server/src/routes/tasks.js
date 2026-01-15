import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
} from '../services/storageService.js';
import { scheduleTask, unscheduleSession } from '../services/schedulingService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

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
    const { name, estimatedDuration, sessionPreference } = req.body;

    if (!name || !estimatedDuration) {
      return res.status(400).json({ error: 'Name and estimatedDuration are required' });
    }

    const task = {
      id: uuidv4(),
      name,
      estimatedDuration: parseInt(estimatedDuration),
      sessionPreference: sessionPreference ? parseInt(sessionPreference) : null,
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

// Update task
router.put('/:id', async (req, res, next) => {
  try {
    const { name, estimatedDuration, sessionPreference, status } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (estimatedDuration !== undefined) updates.estimatedDuration = parseInt(estimatedDuration);
    if (sessionPreference !== undefined) updates.sessionPreference = sessionPreference ? parseInt(sessionPreference) : null;
    if (status !== undefined) updates.status = status;

    const task = await updateTask(req.params.id, updates);
    res.json(task);
  } catch (error) {
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found' });
    }
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
router.post('/:id/schedule', authMiddleware, async (req, res, next) => {
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

// Unschedule a session
router.delete('/:id/sessions/:sessionId', authMiddleware, async (req, res, next) => {
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
