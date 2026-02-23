import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { userQueries, preferencesQueries } from './database.js';

// Create Supabase client with service key for admin operations
let supabaseAdmin = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin && config.supabase.url && config.supabase.serviceKey) {
    supabaseAdmin = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabaseAdmin;
}

/**
 * Verify a Supabase JWT token and return the user
 */
export async function verifyToken(token) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error(error?.message || 'Invalid token');
  }

  return user;
}

/**
 * Check if an email is the admin email (case-insensitive).
 */
export function isAdminEmail(email) {
  return !!(email && config.adminEmail && email.toLowerCase() === config.adminEmail.toLowerCase());
}

/**
 * Get or create a user in our database based on Supabase user.
 * Always ensures admin email gets admin role.
 */
export async function syncUser(supabaseUser) {
  // Check if user already exists
  let dbUser = await userQueries.findBySupabaseId(supabaseUser.id);

  if (!dbUser) {
    // Determine role - admin if email matches admin email
    const role = isAdminEmail(supabaseUser.email) ? 'admin' : 'user';

    // Create new user
    dbUser = await userQueries.create({
      supabaseId: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
      avatarUrl: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
      role
    });

    // Create default preferences for new user
    try {
      await preferencesQueries.upsert(dbUser.id, {});
    } catch (prefError) {
      console.warn('[Auth] Failed to create default preferences:', prefError.message);
    }

    console.log(`[Auth] Created new user: ${dbUser.email} (${dbUser.role})`);
  } else if (dbUser.role !== 'admin' && isAdminEmail(dbUser.email)) {
    // Upgrade to admin if email matches
    try {
      await userQueries.updateRole(dbUser.id, 'admin');
      dbUser.role = 'admin';
      console.log(`[Auth] Upgraded user ${dbUser.email} to admin`);
    } catch (roleError) {
      // DB write failed but user was read OK — force admin in-memory
      console.warn('[Auth] Failed to persist admin role upgrade, applying in-memory:', roleError.message);
      dbUser.role = 'admin';
    }
  }

  // Final safety net: if email matches admin, always ensure admin role in returned object
  if (isAdminEmail(dbUser.email) && dbUser.role !== 'admin') {
    console.warn('[Auth] Admin email detected but role was not admin — forcing admin role in-memory');
    dbUser.role = 'admin';
  }

  return dbUser;
}

/**
 * Create a fallback user object from Supabase user when database is unavailable.
 * Uses the Supabase ID as a stable identifier so downstream code has a non-null user id.
 */
export function createFallbackUser(supabaseUser) {
  const admin = isAdminEmail(supabaseUser.email);
  return {
    id: `fallback-${supabaseUser.id}`,
    supabase_id: supabaseUser.id,
    email: supabaseUser.email,
    display_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
    avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
    role: admin ? 'admin' : 'user',
    subscription_tier: admin ? 'premium' : 'free',
    subscription_expires_at: null,
    isFallback: true
  };
}

/**
 * Check if user has access to a premium feature
 */
export function hasFeatureAccess(user, feature) {
  // Admins always have access (check role AND email as safety net)
  if (user.role === 'admin' || user.is_admin === true || isAdminEmail(user.email)) {
    return true;
  }

  // Define premium features
  const premiumFeatures = [
    'brain_dump',
    'unlimited_tasks',
    'extended_scheduling',
    'multiple_calendars',
    'sms_reminders',
    'analytics',
    'custom_themes'
  ];

  // Check if this is a premium feature
  if (premiumFeatures.includes(feature)) {
    // Check subscription
    if (user.subscription_tier !== 'premium') {
      return false;
    }

    // Check expiration
    if (user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()) {
      return false;
    }
  }

  return true;
}

/**
 * Get free tier limits
 */
export const FREE_TIER_LIMITS = {
  maxTasks: 25,
  schedulingWindowDays: 7
};

/**
 * Check if user is within free tier task limit
 */
export async function checkTaskLimit(user, currentTaskCount) {
  if (user.role === 'admin' || user.is_admin === true || isAdminEmail(user.email) || user.subscription_tier === 'premium') {
    return { allowed: true };
  }

  if (currentTaskCount >= FREE_TIER_LIMITS.maxTasks) {
    return {
      allowed: false,
      reason: `Free tier limited to ${FREE_TIER_LIMITS.maxTasks} tasks. Upgrade to premium for unlimited tasks.`
    };
  }

  return { allowed: true };
}
