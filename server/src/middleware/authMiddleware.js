import { verifyToken, syncUser, hasFeatureAccess, checkTaskLimit, createFallbackUser } from '../services/supabaseAuth.js';
import { getAuthenticatedClient } from '../services/googleCalendarService.js';
import { taskQueries } from '../services/database.js';
import { config } from '../config/index.js';

/**
 * Middleware to require authentication
 * Supports both Supabase Bearer tokens AND service tokens (X-Service-Token header)
 */
export async function requireAuth(req, res, next) {
  try {
    // Check for service token first (for external integrations like Bodie)
    const serviceToken = req.headers['x-service-token'];
    if (serviceToken && config.serviceToken && serviceToken === config.serviceToken) {
      // Service token auth - create a service user context
      req.user = {
        id: 'service-account',
        email: 'bodie@service.local',
        subscription_tier: 'premium',
        is_admin: true
      };
      req.isServiceAuth = true;
      return next();
    }

    // Standard Supabase auth
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const supabaseUser = await verifyToken(token);

    // Try to sync with database, fallback to Supabase user if DB unavailable
    let dbUser;
    try {
      dbUser = await syncUser(supabaseUser);
    } catch (dbError) {
      console.warn('Database sync failed, using fallback user:', dbError.message);
      dbUser = createFallbackUser(supabaseUser);
    }

    // Block suspended users
    if (dbUser.suspended_at) {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

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
    // Check for service token first
    const serviceToken = req.headers['x-service-token'];
    if (serviceToken && config.serviceToken && serviceToken === config.serviceToken) {
      req.user = {
        id: 'service-account',
        email: 'bodie@service.local',
        subscription_tier: 'premium',
        is_admin: true
      };
      req.isServiceAuth = true;
      return next();
    }

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabaseUser = await verifyToken(token);

      // Try to sync with database, fallback to Supabase user if DB unavailable
      let dbUser;
      try {
        dbUser = await syncUser(supabaseUser);
      } catch (dbError) {
        console.warn('Database sync failed, using fallback user:', dbError.message);
        dbUser = createFallbackUser(supabaseUser);
      }

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

/**
 * Middleware to require admin role
 * Must be used after requireAuth
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  const isAdmin = req.user.role === 'admin' ||
    (config.adminEmail && req.user.email?.toLowerCase() === config.adminEmail.toLowerCase());

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }

  next();
}

// Legacy middleware for backward compatibility
export async function authMiddleware(req, res, next) {
  return requireAuth(req, res, next);
}
