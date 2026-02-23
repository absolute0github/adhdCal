import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file - use override so .env values take precedence over PM2 hardcoded env
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath, override: true });

export const config = {
  port: process.env.PORT || 3001,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serviceToken: process.env.SERVICE_TOKEN,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback',
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ]
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },
  adminEmail: process.env.ADMIN_EMAIL,
  dataPath: join(__dirname, '../../data')
};

// Log config summary on startup (redact secrets)
console.log('[Config] Loaded configuration:');
console.log(`  DB_HOST=${config.db.host}, DB_PORT=${config.db.port}, DB_USER=${config.db.user ? '***set***' : 'MISSING'}, DB_NAME=${config.db.name || 'MISSING'}`);
console.log(`  ADMIN_EMAIL=${config.adminEmail || 'MISSING'}`);
console.log(`  SUPABASE_URL=${config.supabase.url ? '***set***' : 'MISSING'}`);
console.log(`  SUPABASE_SERVICE_KEY=${config.supabase.serviceKey ? '***set***' : 'MISSING'}`);
console.log(`  CLIENT_URL=${config.clientUrl}`);
