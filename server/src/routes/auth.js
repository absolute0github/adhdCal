import { Router } from 'express';
import { config } from '../config/index.js';
import {
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  getAuthenticatedClient
} from '../services/googleCalendarService.js';
import { saveTokens, clearTokens, getTokens } from '../services/storageService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { hasFeatureAccess, FREE_TIER_LIMITS } from '../services/supabaseAuth.js';

const router = Router();

// Redirect to Google OAuth consent screen
router.get('/login', (req, res) => {
  const oauth2Client = createOAuth2Client();
  const authUrl = getAuthUrl(oauth2Client);
  res.redirect(authUrl);
});

// Handle OAuth callback
router.get('/callback', async (req, res, next) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${config.clientUrl}?auth=error&message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${config.clientUrl}?auth=error&message=No+authorization+code`);
    }

    const oauth2Client = createOAuth2Client();
    const tokens = await getTokensFromCode(oauth2Client, code);
    await saveTokens(tokens);

    res.redirect(`${config.clientUrl}?auth=success`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${config.clientUrl}?auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

// Check authentication status
router.get('/status', async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    res.json({
      authenticated: !!client,
      googleConnected: !!client,
      message: client ? 'Authenticated' : 'Not authenticated'
    });
  } catch (error) {
    next(error);
  }
});

// Logout - clear tokens
router.post('/logout', async (req, res, next) => {
  try {
    await clearTokens();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Refresh token manually
router.post('/refresh', async (req, res, next) => {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    next(error);
  }
});

// Connect Google Calendar - redirect to Google OAuth consent screen
router.get('/google/connect', (req, res) => {
  const oauth2Client = createOAuth2Client();
  const authUrl = getAuthUrl(oauth2Client);
  res.redirect(authUrl);
});

// Get user profile with subscription info and feature access
router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = req.user;

    // Build feature access map
    const premiumFeatureList = [
      'brain_dump',
      'unlimited_tasks',
      'extended_scheduling',
      'multiple_calendars',
      'sms_reminders',
      'analytics',
      'custom_themes'
    ];

    const featureAccess = {};
    for (const feature of premiumFeatureList) {
      featureAccess[feature] = hasFeatureAccess(user, feature);
    }

    const isAdmin = user.role === 'admin' ||
      (config.adminEmail && user.email?.toLowerCase() === config.adminEmail.toLowerCase());
    const isPremium = isAdmin ||
      (user.subscription_tier === 'premium' &&
        (!user.subscription_expires_at || new Date(user.subscription_expires_at) >= new Date()));

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: isAdmin ? 'admin' : user.role,
      subscriptionTier: user.subscription_tier || 'free',
      subscriptionExpiresAt: user.subscription_expires_at,
      isPremium,
      featureAccess,
      limits: isPremium ? null : FREE_TIER_LIMITS
    });
  } catch (error) {
    next(error);
  }
});

// Temporary debug endpoint - remove after fixing brain dump issue
router.get('/debug-access', authMiddleware, (req, res) => {
  const user = req.user;
  const adminEmailSet = !!config.adminEmail;
  const adminEmailValue = config.adminEmail
    ? config.adminEmail.substring(0, 3) + '***' + config.adminEmail.substring(config.adminEmail.indexOf('@'))
    : '(not set)';
  const emailMatch = config.adminEmail
    ? user.email?.toLowerCase() === config.adminEmail.toLowerCase()
    : false;

  res.json({
    userEmail: user.email,
    userRole: user.role,
    userSubscriptionTier: user.subscription_tier,
    isFallback: user.isFallback || false,
    adminEmailConfigured: adminEmailSet,
    adminEmailMasked: adminEmailValue,
    emailMatchesAdmin: emailMatch,
    hasFeatureAccessResult: hasFeatureAccess(user, 'brain_dump'),
    rawUserKeys: Object.keys(user)
  });
});

export default router;
