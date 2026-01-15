import { verifyToken, syncUser, hasFeatureAccess, checkTaskLimit } from '../services/supabaseAuth.js';
import { getAuthenticatedClient } from '../services/googleCalendarService.js';
import { taskQueries } from '../services/database.js';

/**
 * Middleware to require Supabase authentication
 * Attaches user to req.user
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const supabaseUser = await verifyToken(token);
    const dbUser = await syncUser(supabaseUser);

    req.user = dbUser;
    req.supabaseUser = supabaseUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Invalid or expired token'
    });
  }
}

/**
 * Middleware to optionally attach user if authenticated
 * Does not fail if no auth - just sets req.user to null
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabaseUser = await verifyToken(token);
      const dbUser = await syncUser(supabaseUser);
      req.user = dbUser;
      req.supabaseUser = supabaseUser;
    } else {
      req.user = null;
      req.supabaseUser = null;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    req.supabaseUser = null;
    next();
  }
}

/**
 * Middleware to check if user has Google Calendar connected
 */
export async function requireGoogleCalendar(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Try to get authenticated Google client for this user
    const client = await getAuthenticatedClient(req.user.id);

    if (!client) {
      return res.status(403).json({
        error: 'Google Calendar not connected',
        message: 'Please connect your Google Calendar to use this feature',
        code: 'GOOGLE_NOT_CONNECTED'
      });
    }

    req.googleClient = client;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Google Calendar error',
      message: error.message
    });
  }
}

/**
 * Middleware factory to check premium feature access
 */
export function requireFeature(feature) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!hasFeatureAccess(req.user, feature)) {
      return res.status(403).json({
        error: 'Premium feature',
        message: 'This feature requires a premium subscription',
        feature,
        code: 'PREMIUM_REQUIRED'
      });
    }

    next();
  };
}

/**
 * Middleware to check task creation limit
 */
export async function checkTaskCreationLimit(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const taskCount = await taskQueries.countByUserId(req.user.id);
    const limitCheck = await checkTaskLimit(req.user, taskCount);

    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: 'Task limit reached',
        message: limitCheck.reason,
        code: 'TASK_LIMIT_REACHED'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

// Legacy middleware for backward compatibility
export async function authMiddleware(req, res, next) {
  return requireAuth(req, res, next);
}
