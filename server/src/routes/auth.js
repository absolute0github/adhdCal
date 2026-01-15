import { Router } from 'express';
import { config } from '../config/index.js';
import {
  createOAuth2Client,
  getAuthUrl,
  getTokensFromCode,
  getAuthenticatedClient
} from '../services/googleCalendarService.js';
import { saveTokens, clearTokens, getTokens } from '../services/storageService.js';

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

export default router;
