import app from './src/app.js';
import { config } from './src/config/index.js';

// Global error handlers to catch crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Client URL: ${config.clientUrl}`);
});
