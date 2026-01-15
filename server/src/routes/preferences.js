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
      timezone
    } = req.body;

    const updated = {
      ...currentPreferences,
      ...(dailyWorkDuration !== undefined && { dailyWorkDuration }),
      ...(maxSessionLength !== undefined && { maxSessionLength }),
      ...(defaultSessionLength !== undefined && { defaultSessionLength }),
      ...(workingHours !== undefined && { workingHours }),
      ...(timezone !== undefined && { timezone })
    };

    // Validate maxSessionLength (max 4 hours = 240 minutes)
    if (updated.maxSessionLength > 240) {
      return res.status(400).json({ error: 'Maximum session length cannot exceed 4 hours (240 minutes)' });
    }

    await savePreferences(updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
