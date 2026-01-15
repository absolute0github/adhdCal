# Authentication & User System Implementation Plan

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Supabase Auth  │     │  Google OAuth   │
│   (React)       │     │  (Login/Signup) │     │  (Calendar API) │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │              ┌────────▼────────┐              │
         └─────────────▶│  Express API    │◀─────────────┘
                        │  (Backend)      │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   MariaDB       │
                        │   (User data,   │
                        │   tasks, subs)  │
                        └─────────────────┘
```

## Database Schema

### users
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supabase_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  role ENUM('user', 'admin') DEFAULT 'user',
  subscription_tier ENUM('free', 'premium') DEFAULT 'free',
  subscription_expires_at DATETIME NULL,
  google_refresh_token TEXT NULL,
  google_token_expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### tasks (updated)
```sql
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_minutes INT,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM('pending', 'scheduled', 'completed') DEFAULT 'pending',
  due_date DATE NULL,
  calendar_event_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### user_preferences
```sql
CREATE TABLE user_preferences (
  user_id INT PRIMARY KEY,
  work_start_time TIME DEFAULT '09:00',
  work_end_time TIME DEFAULT '17:00',
  preferred_session_minutes INT DEFAULT 60,
  buffer_minutes INT DEFAULT 15,
  working_days JSON DEFAULT '["mon","tue","wed","thu","fri"]',
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Implementation Steps

### Phase 1: Setup Infrastructure
- [ ] Create Supabase project (free tier)
- [ ] Configure Supabase auth providers (Google, Facebook, Email)
- [ ] Set up MariaDB tables on Cloudways
- [ ] Add database connection to Express server

### Phase 2: Backend Auth Integration
- [ ] Install dependencies: `@supabase/supabase-js`, `mysql2`
- [ ] Create database connection pool
- [ ] Create auth middleware to verify Supabase JWT
- [ ] Create user sync endpoint (creates DB user on first login)
- [ ] Update all API routes to be user-scoped

### Phase 3: Frontend Auth Integration
- [ ] Install `@supabase/auth-ui-react` for login UI
- [ ] Create AuthProvider using Supabase client
- [ ] Add login page with Google/Facebook/Email options
- [ ] Handle auth state and token refresh
- [ ] Update API calls to include auth header

### Phase 4: Google Calendar Reconnection
- [ ] Separate Google OAuth flow (just for Calendar API)
- [ ] Store Google refresh token per user in DB
- [ ] Update calendar service to use per-user tokens

### Phase 5: Premium Features & Limits
- [ ] Create subscription checking middleware
- [ ] Implement free tier limits (25 tasks, 7-day window)
- [ ] Add admin bypass for developer account
- [ ] Create subscription management endpoints

## Environment Variables Needed

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# MariaDB (Cloudways)
DB_HOST=localhost
DB_USER=xxxxx
DB_PASSWORD=xxxxx
DB_NAME=xxxxx

# Admin email (gets full access)
ADMIN_EMAIL=your@email.com

# Existing
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Supabase Setup Steps

1. Go to https://supabase.com and create a project
2. Go to Authentication → Providers
3. Enable:
   - Email (enabled by default)
   - Google (add Client ID and Secret from Google Cloud)
   - Facebook (create Facebook App, add App ID and Secret)
4. Go to Settings → API to get your keys
5. Set Site URL to `https://adhdcal.top`
6. Add `https://adhdcal.top` to Redirect URLs

## Admin Access Logic

```javascript
// In auth middleware
function checkFeatureAccess(user, feature) {
  // Admins always have access
  if (user.role === 'admin') return true;

  // Check subscription for premium features
  if (PREMIUM_FEATURES.includes(feature)) {
    return user.subscription_tier === 'premium' &&
           new Date(user.subscription_expires_at) > new Date();
  }

  return true; // Free feature
}
```

## Migration Path

1. Current users: None (no user system yet)
2. Current tasks: Stored in JSON file → migrate to DB
3. Current tokens: Stored in JSON file → associate with user accounts
