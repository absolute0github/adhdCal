import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { config } from './config/index.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import calendarRoutes from './routes/calendar.js';
import preferencesRoutes from './routes/preferences.js';
import { errorHandler } from './middleware/errorHandler.js';
import { testConnection } from './services/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/preferences', preferencesRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Serve static frontend in production
const clientDistPath = join(__dirname, '../../client/dist');
if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // Handle client-side routing - serve index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(join(clientDistPath, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

export default app;
