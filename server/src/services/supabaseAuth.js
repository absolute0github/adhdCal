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
 * Get or create a user in our database based on Supabase user
 */
export async function syncUser(supabaseUser) {
  // Check if user already exists
  let dbUser = await userQueries.findBySupabaseId(supabaseUser.id);

  if (!dbUser) {
    // Determine role - admin if email matches admin email
    const role = supabaseUser.email === config.adminEmail ? 'admin' : 'user';

    // Create new user
    dbUser = await userQueries.create({
      supabaseId: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
      avatarUrl: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
      role
    });

    // Create default preferences for new user
    await preferencesQueries.upsert(dbUser.id, {});

    console.log(`Created new user: ${dbUser.email} (${dbUser.role})`);
  } else if (dbUser.role !== 'admin' && dbUser.email === config.adminEmail) {
    // Upgrade to admin if email matches
    await userQueries.updateRole(dbUser.id, 'admin');
    dbUser.role = 'admin';
  }

  return dbUser;
}

/**
 * Check if user has access to a premium feature
 */
export function hasFeatureAccess(user, feature) {
  // Admins always have access
  if (user.role === 'admin') {
    return true;
  }

  // Define premium features
  const premiumFeatures = [
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
  if (user.role === 'admin' || user.subscription_tier === 'premium') {
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
