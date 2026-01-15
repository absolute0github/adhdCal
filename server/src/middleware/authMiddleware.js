import { getAuthenticatedClient } from '../services/googleCalendarService.js';

export async function authMiddleware(req, res, next) {
  try {
    const client = await getAuthenticatedClient();

    if (!client) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Please sign in with Google Calendar'
      });
    }

    req.googleClient = client;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
}
