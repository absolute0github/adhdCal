import app from './src/app.js';
import { config } from './src/config/index.js';
import { testConnection } from './src/services/database.js';

// Global error handlers to catch crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(config.port, '0.0.0.0', async () => {
  console.log(`Server running on http://0.0.0.0:${config.port}`);
  console.log(`Client URL: ${config.clientUrl}`);
  console.log(`Admin email: ${config.adminEmail || 'NOT SET'}`);

  // Test DB connection on startup
  const dbResult = await testConnection(3);
  if (dbResult.connected) {
    console.log('[Startup] Database connected successfully');
  } else {
    console.error('[Startup] Database connection FAILED:', dbResult.error);
    if (dbResult.host) {
      console.error(`[Startup] DB config: host=${dbResult.host}, port=${dbResult.port}, user=${dbResult.user}, database=${dbResult.database}`);
    }
    console.warn('[Startup] Server will continue with fallback user mode (DB features degraded)');
  }
});
