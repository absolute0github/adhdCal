import { Router } from 'express';
import { getPreferences, savePreferences } from '../services/storageService.js';

const router = Router();

// Get user preferences
router.get('/', async (req, res, next) => {
  try {
    const preferences = await getPreferences();
    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

// Update user preferences
router.put('/', async (req, res, next) => {
  try {
    const currentPreferences = await getPreferences();
    const {
      dailyWorkDuration,
      maxSessionLength,
      defaultSessionLength,
      workingHours,
      workingDays,
      timezone
    } = req.body;

    const updated = {
      ...currentPreferences,
      ...(dailyWorkDuration !== undefined && { dailyWorkDuration }),
      ...(maxSessionLength !== undefined && { maxSessionLength }),
      ...(defaultSessionLength !== undefined && { defaultSessionLength }),
      ...(workingHours !== undefined && { workingHours }),
      ...(workingDays !== undefined && { workingDays }),
      ...(timezone !== undefined && { timezone })
    };

    // Validate maxSessionLength (max 4 hours = 240 minutes)
    if (updated.maxSessionLength > 240) {
      return res.status(400).json({ error: 'Maximum session length cannot exceed 4 hours (240 minutes)' });
    }

    // Validate at least one working day is selected
    if (updated.workingDays) {
      const hasActiveDay = Object.values(updated.workingDays).some(v => v === true);
      if (!hasActiveDay) {
        return res.status(400).json({ error: 'At least one working day must be selected' });
      }
    }

    // Validate working hours
    if (updated.workingHours) {
      const { start, end } = updated.workingHours;
      if (start && end && start >= end) {
        return res.status(400).json({ error: 'Working hours start must be before end' });
      }
    }

    await savePreferences(updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
