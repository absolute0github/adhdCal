# Google Cloud Setup Guide

Follow these steps to set up Google Calendar API access for the Task Scheduler app.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter a project name (e.g., `google-task-scheduler`)
5. Click **"Create"**
6. Wait for the project to be created, then select it

## Step 2: Enable Google Calendar API

1. In the Cloud Console, go to **APIs & Services** > **Library**
2. Search for **"Google Calendar API"**
3. Click on **Google Calendar API**
4. Click **"Enable"**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **"External"** user type (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: `Google Task Scheduler`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**

### Add Scopes - click "Data Access" in the Sidebar

1. Click **"Add or Remove Scopes"**
2. Find and select these scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
3. Click **"Update"**
4. Click **"Save and Continue"**

### Add Test Users - click "Audience"

1. Click **"Add Users"**
2. Enter your Google account email address
3. Click **"Add"**
4. Click **"Save and Continue"**
5. Review the summary and click **"Back to Dashboard"**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. Select **"Web application"** as the application type
4. Enter a name (e.g., `Task Scheduler Web Client`)
5. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:5173
   http://localhost:3001
   ```
6. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3001/api/auth/callback
   ```
7. Click **"Create"**
8. A dialog will show your **Client ID** and **Client Secret**
9. **Copy both values** - you'll need them for the next step

## Step 5: Configure Environment Variables

1. Navigate to the `server` directory in your project
2. Copy `.env.example` to create a new `.env` file:
   ```bash
   cp ../.env.example .env
   ```
3. Edit the `.env` file and fill in your credentials:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback
   PORT=3001
   CLIENT_URL=http://localhost:5173
   SESSION_SECRET=any_random_string_here
   ```

## Step 6: Run the Application

1. Install dependencies (from the root directory):
   ```bash
   npm install
   ```

2. Start the development servers:
   ```bash
   npm run dev
   ```

3. Open your browser to http://localhost:5173

4. Click **"Sign in with Google"** to authenticate

## Troubleshooting

### "Access blocked: This app's request is invalid"

- Make sure the redirect URI in Google Cloud Console exactly matches:
  `http://localhost:3001/api/auth/callback`

### "Error 403: access_denied"

- You haven't added your email as a test user
- Go to **OAuth consent screen** > **Test users** and add your email

### "Invalid grant" error

- Your tokens may have expired
- Delete `server/data/tokens.json` and sign in again

### Calendar events not showing

- Make sure you've enabled the Google Calendar API
- Check that both calendar scopes are added to the OAuth consent screen

## Security Notes

- Never commit your `.env` file or `credentials.json` to version control
- The `.gitignore` file is already configured to exclude these files
- For production, use more secure token storage (encrypted, or a database)
- Consider publishing the OAuth app once you're ready for wider use
