# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Timekit** is an ADHD-friendly calendar auto-scheduler that helps users manage tasks by automatically scheduling them into their calendar based on work preferences and availability. It integrates with Google Calendar and uses intelligent scheduling algorithms to break down tasks into manageable sessions.

## Development Commands

### Setup
```bash
npm install                    # Install all workspace dependencies (root, client, server)
npm run dev                    # Start both client (port 5173) and server (port 3001) concurrently
npm run dev:client            # Run only client dev server (Vite on port 5173)
npm run dev:server            # Run only server dev server (Express on port 3001)
npm run build                 # Build optimized client bundle
```

### Deployment
```bash
npm run start                 # Run production server (serves built client + API)
npm run pm2:start             # Start server with PM2 process manager
npm run pm2:stop              # Stop PM2 processes
npm run pm2:restart           # Restart PM2 processes
npm run pm2:logs              # View PM2 logs
npm run pm2:status            # Check PM2 status
```

### Environment Setup
1. Copy `.env.example` to `.env` in the root directory
2. Fill in required variables:
   - Google OAuth credentials (from Google Cloud Console)
   - Database credentials (MariaDB/MySQL)
   - Supabase credentials (for authentication)
   - Session secret (random string for server)
   - Admin email (grants full access)

## Architecture

### Monorepo Structure
This is an npm workspace monorepo with two independent applications:
- **`client/`** - React frontend (Vite + TailwindCSS)
- **`server/`** - Node.js/Express backend (API server)

Each workspace has its own `package.json`, dependencies, and scripts.

### Frontend Architecture (React)

**State Management:**
- `AuthContext` - Manages user authentication state and login/logout
- `TaskContext` - Manages tasks, scheduling, and calendar integration
- Custom hooks (`useAuth()`, `useTasks()`) wrap context consumption

**Service Layer:**
- `services/api.js` - Axios instance with automatic token injection and interceptors
- `services/authService.js` - Authentication operations (login, logout, token refresh)
- `services/taskService.js` - Task CRUD and scheduling operations
- `services/calendarService.js` - Google Calendar integration
- `utils/timeUtils.js` - Time manipulation and formatting utilities

**Key Pages:**
- `Login.jsx` - OAuth login with Google
- `Dashboard.jsx` - Main app interface with task management and calendar view

**Components:**
- Organized by feature area (tasks, scheduling, layout)
- Use TailwindCSS for styling
- Lucide React for icons

**Development:**
- Hot module reloading via Vite
- Frontend dev server proxies API calls to backend on :3001

### Backend Architecture (Express)

**Authentication Flow:**
1. Supabase handles user authentication via OAuth
2. Frontend receives JWT token
3. Backend middleware verifies token and syncs user to local database
4. Google OAuth separate flow for calendar integration

**Route Organization:**
- `/api/auth` - Authentication endpoints (login, callback, logout, refresh)
- `/api/tasks` - Task CRUD and scheduling
- `/api/calendar` - Calendar integration endpoints
- `/api/preferences` - User preferences (work hours, session duration, timezone)
- `/api/health` - Server and database health check

**Key Services:**
- `database.js` - MySQL connection pool and query helpers
- `supabaseAuth.js` - Supabase token verification and user sync
- `googleCalendarService.js` - Google Calendar OAuth and event management
- `schedulingService.js` - Core intelligent scheduling algorithm
- `storageService.js` - Data persistence layer

**Middleware Stack:**
- CORS (configured for client URL)
- Authentication verification
- Feature access control (premium tier checks)
- Error handling (centralized error middleware)
- Static file serving (production only)

**Database:**
- MariaDB/MySQL relational database
- Key tables: `users`, `tasks`, `user_preferences`
- Connection pooling via mysql2

**Deployment:**
- PM2 for process management and auto-restart
- Can serve static frontend bundle in production
- Single-page app support with index.html fallback

## Database

The application uses MariaDB/MySQL. Key tables:
- **users** - Supabase ID, email, display name, subscription tier, admin flag
- **tasks** - Task data with estimated time, priority, status, Google Calendar event ID
- **user_preferences** - Work hours, session duration, timezone, working days

Database must be running and connection variables set in `.env` for server to start.

## Key Implementation Patterns

### Free vs Premium Features
- Free tier: 25 task limit, 7-day scheduling window
- Premium tier: unlimited tasks, extended scheduling window
- Implemented via middleware checks: `featureAccess.js`
- Admin users (set via `ADMIN_EMAIL` env var) get full access

### Intelligent Scheduling
The `schedulingService.js` implements the core scheduling algorithm:
- Breaks tasks into manageable sessions based on user preferences
- Respects work hours and available time slots
- Schedules tasks into Google Calendar
- Handles session rescheduling and task completion

### Error Handling
- Frontend: Services wrap API calls and handle errors gracefully
- Backend: Centralized error middleware with proper HTTP status codes
- API calls include token in Authorization header automatically via axios interceptors

### API Communication
All frontend-to-backend communication uses axios with:
- Automatic JWT token injection in Authorization header
- Token refresh on 401 responses
- Proper error handling and user feedback

## Common Development Tasks

### Running Specific Components During Development
- **Frontend only:** `npm run dev:client` (useful when backend is on separate machine)
- **Backend only:** `npm run dev:server` (useful when testing API in isolation)
- **Full stack:** `npm run dev` (normal development)

### Debugging
- Frontend: Browser DevTools (React DevTools extension recommended)
- Backend: Console logs output to terminal; nodemon automatically restarts on file changes
- Database: Direct queries or database client

### Testing the API
- Use curl, Postman, or similar to test endpoints
- Frontend must be running or manually provide valid JWT tokens
- Check `.env` port configuration (default 3001)

### Google Calendar Integration
- Requires valid Google OAuth credentials in `.env`
- User must authorize calendar access during login
- Calendar events created via `googleCalendarService.js`

## Important Implementation Details

### Authentication State
The `AuthContext` initializes by checking the backend `/api/auth/status` endpoint on app load. This determines if user is authenticated without requiring additional login on page refresh.

### Task Scheduling
Tasks are not scheduled immediately—users schedule them through the dashboard. The scheduling service:
1. Validates task details and user preferences
2. Calculates optimal time slots
3. Creates Google Calendar events
4. Stores session records in database

### Timezone Handling
- User timezone stored in `user_preferences`
- date-fns-tz used for timezone-aware date operations (server-side)
- All dates should be converted using user's timezone when displaying

## Build and Deployment Notes

- **Client build:** Outputs to `client/dist/` directory
- **Production:** Express serves `client/dist/` as static files + API routes
- **Environment:** Production environment via PM2 uses `.env` variables
- **Port:** Default 3001 (configurable via PORT env var)

Ensure `.env` is properly configured before deploying. The server will fail to start if critical variables (DB credentials, Supabase keys) are missing.
