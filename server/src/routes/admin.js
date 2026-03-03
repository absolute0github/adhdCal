import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { userQueries } from '../services/database.js';
import { config } from '../config/index.js';

const router = Router();

// All admin routes require auth + admin
router.use(requireAuth, requireAdmin);

// List all users with task counts
router.get('/users', async (req, res, next) => {
  try {
    const users = await userQueries.findAll();

    const result = users.map(u => ({
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      role: u.role,
      subscriptionTier: u.subscription_tier,
      subscriptionExpiresAt: u.subscription_expires_at,
      suspendedAt: u.suspended_at,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      activeTaskCount: u.active_task_count,
      totalTaskCount: u.total_task_count
    }));

    res.json({ users: result, total: result.length });
  } catch (error) {
    next(error);
  }
});

// Suspend a user
router.put('/users/:id/suspend', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await userQueries.getById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent suspending yourself
    if (user.email?.toLowerCase() === req.user.email?.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot suspend your own account' });
    }

    // Prevent suspending other admins
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot suspend an admin account' });
    }

    await userQueries.suspend(userId);
    res.json({ success: true, message: `User ${user.email} has been suspended` });
  } catch (error) {
    next(error);
  }
});

// Unsuspend a user
router.put('/users/:id/unsuspend', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await userQueries.getById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userQueries.unsuspend(userId);
    res.json({ success: true, message: `User ${user.email} has been unsuspended` });
  } catch (error) {
    next(error);
  }
});

// Send password reset email via Supabase
router.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await userQueries.getById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const supabaseUrl = config.supabase.url;
    const supabaseServiceKey = config.supabase.serviceKey;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase service key not configured for admin operations' });
    }

    // Use Supabase Admin API to generate a password recovery link
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'recovery',
        email: user.email,
        redirect_to: `${config.clientUrl}/reset-password`
      })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.error('Supabase password reset failed:', body);
      return res.status(500).json({
        error: 'Failed to send password reset',
        message: body.msg || body.message || 'Unknown error'
      });
    }

    res.json({
      success: true,
      message: `Password reset email sent to ${user.email}`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
