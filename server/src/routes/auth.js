import { Router } from 'express';
import { config } from '../config/index.js';
import {
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  getAuthenticatedClient
} from '../services/googleCalendarService.js';
import { saveUserTokens, clearUserTokens, getUserTokens } from '../services/storageService.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Redirect to Google OAuth consent screen (alias for /login)
router.get('/google/connect', optionalAuth, (req, res) => {
  const oauth2Client = createOAuth2Client();
  // Store user ID in state for callback
  const state = req.user ? req.user.id.toString() : 'anonymous';
  const authUrl = getAuthUrl(oauth2Client, state);
  res.redirect(authUrl);
});

// Redirect to Google OAuth consent screen
router.get('/login', optionalAuth, (req, res) => {
  const oauth2Client = createOAuth2Client();
  const state = req.user ? req.user.id.toString() : 'anonymous';
  const authUrl = getAuthUrl(oauth2Client, state);
  res.redirect(authUrl);
});

// Handle OAuth callback
router.get('/callback', async (req, res, next) => {
  try {
    const { code, error, state } = req.query;

    if (error) {
      return res.redirect(`${config.clientUrl}?auth=error&message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${config.clientUrl}?auth=error&message=No+authorization+code`);
    }

    const oauth2Client = createOAuth2Client();
    const tokens = await getTokensFromCode(oauth2Client, code);

    // Save tokens for the user (state contains user ID)
    const userId = state && state !== 'anonymous' ? state : null;
    await saveUserTokens(userId, tokens);

    res.redirect(`${config.clientUrl}?auth=success&calendar=connected`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${config.clientUrl}?auth=error&message=${encodeURIComponent(error.message)}`);
  }
});

// Check authentication status (for Google Calendar connection)
router.get('/status', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const client = await getAuthenticatedClient(userId);
    res.json({
      authenticated: !!client,
      googleConnected: !!client,
      message: client ? 'Google Calendar connected' : 'Google Calendar not connected'
    });
  } catch (error) {
    next(error);
  }
});

// Logout - clear Google Calendar tokens
router.post('/logout', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    await clearUserTokens(userId);
    res.json({ success: true, message: 'Google Calendar disconnected' });
  } catch (error) {
    next(error);
  }
});

// Refresh token manually
router.post('/refresh', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const client = await getAuthenticatedClient(userId);
    if (!client) {
      return res.status(401).json({ error: 'Google Calendar not connected' });
    }
    res.json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    next(error);
  }
});

export default router;
