# adhdCal Deployment Documentation

**Date:** January 28, 2026  
**Project:** ADHDCal  
**Live URL:** https://adhdcal.top

---

## Overview

This document covers the complete setup of syncing and deploying the adhdCal project across three environments:

- **Local:** `/var/www/projects/adhdCal`
- **GitHub:** `absolute0github/adhdCal`
- **Production:** Cloudways server at `adhdcal.top`

---

## Part 1: Syncing Local Repository with GitHub

### Initial State
- Local repo had uncommitted changes and untracked files
- Remote origin: `https://github.com/absolute0github/adhdCal.git`

### Steps Taken

1. **Cleaned up duplicate folder**
   - Found duplicate `server/src/src/` directory
   - Verified files were identical with `diff`
   - Removed duplicate: `rm -rf server/src/src/`

2. **Protected sensitive files**
   - Discovered `server/src/data/tokens.json` contained OAuth tokens
   - Added to `.gitignore`: `echo "server/src/data/tokens.json" >> .gitignore`
   - Unstaged the file: `git restore --staged server/src/data/tokens.json`

3. **Committed changes**
   ```bash
   git add .
   git commit -m "Add server src files and update gitignore to protect tokens"
   ```

4. **Set up SSH authentication for GitHub**
   - Generated new SSH key: `ssh-keygen -t ed25519 -C "github" -f ~/.ssh/github_key`
   - Added public key to GitHub (Settings → SSH and GPG keys)
   - Added to SSH config:
     ```
     Host github.com
         HostName github.com
         User git
         IdentityFile ~/.ssh/github_key
     ```
   - Changed remote to SSH: `git remote set-url origin git@github.com:absolute0github/adhdCal.git`

5. **Pushed to GitHub**
   ```bash
   git push origin main
   ```

---

## Part 2: Setting Up Cloudways Server

### Server Details
- **Host:** 161.35.191.109
- **SSH User:** master_ezmunfgubz
- **App Path:** `/home/master/applications/kcpnvspcqx/public_html`

### Steps Taken

1. **Cloned repository**
   - Backed up existing files: `mv * ~/public_html_backup/`
   - Cloned repo: `git clone git@github.com:absolute0github/adhdCal.git .`
   - SSH key was already configured for GitHub on Cloudways

2. **Installed dependencies**
   ```bash
   npm install
   cd client && npm install
   ```

3. **Created server environment file**
   - Location: `/home/master/applications/kcpnvspcqx/public_html/server/.env`
   - Contents:
     ```
     # Google OAuth Credentials
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     GOOGLE_REDIRECT_URI=https://adhdcal.top/api/auth/callback

     # Server Config
     PORT=3001
     CLIENT_URL=https://adhdcal.top
     SESSION_SECRET=your_secret

     # Database (MariaDB)
     DB_HOST=your_db_host
     DB_USER=your_db_user
     DB_PASSWORD=your_db_password
     DB_NAME=your_db_name

     # Supabase Auth
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_KEY=your_service_key

     # Admin email
     ADMIN_EMAIL=support@absolute0.net
     ```

4. **Created client environment file**
   - Location: `/home/master/applications/kcpnvspcqx/public_html/client/.env`
   - Contents:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

5. **Built the client**
   ```bash
   cd client
   npm run build
   ```

---

## Part 3: Running the Node.js Server

### Process Manager: PM2 (installed locally)

1. **Installed PM2**
   ```bash
   npm install pm2
   ```

2. **Started the server**
   ```bash
   npx pm2 start ecosystem.config.cjs
   ```

3. **PM2 Configuration** (`ecosystem.config.cjs`):
   ```javascript
   module.exports = {
     apps: [{
       name: 'adhdcal',
       script: 'server/index.js',
       cwd: __dirname,
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '500M',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       }
     }]
   };
   ```

### Useful PM2 Commands
```bash
npx pm2 status          # Check if running
npx pm2 logs            # View logs
npx pm2 restart adhdcal # Restart the app
npx pm2 stop adhdcal    # Stop the app
```

---

## Part 4: Reverse Proxy Setup

Cloudways runs Apache/Nginx in front, but the Node app runs on port 3001. We used a PHP reverse proxy to route traffic.

### Files Created

**`/home/master/applications/kcpnvspcqx/public_html/index.php`:**
```php
<?php
$url = 'http://127.0.0.1:3001' . $_SERVER['REQUEST_URI'];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

curl_close($ch);

foreach (explode("\r\n", $headers) as $header) {
    if (!empty($header) && strpos($header, 'HTTP/') !== 0 && strpos($header, 'Transfer-Encoding') === false) {
        header($header);
    }
}

echo $body;
```

**`/home/master/applications/kcpnvspcqx/public_html/.htaccess`:**
```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [L]
```

---

## Part 5: Automated Deployments with GitHub Actions

### GitHub Secrets Required
- `CLOUDWAYS_SSH_KEY` - Private SSH key for Cloudways
- `CLOUDWAYS_HOST` - `161.35.191.109`
- `CLOUDWAYS_USER` - `master_ezmunfgubz`

### Deploy Script on Cloudways

**Location:** `/home/master/deploy.sh`
```bash
#!/bin/bash
cd ~/applications/kcpnvspcqx/public_html
git pull origin main
npm install
cd client && npm install && npm run build
cd ..
npx pm2 restart adhdcal
echo "Deployed successfully!"
```

Make executable: `chmod +x ~/deploy.sh`

### GitHub Actions Workflow

**Location:** `.github/workflows/deploy.yml`
```yaml
name: Deploy to Cloudways

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.CLOUDWAYS_HOST }}
          username: ${{ secrets.CLOUDWAYS_USER }}
          key: ${{ secrets.CLOUDWAYS_SSH_KEY }}
          script: ~/deploy.sh
```

---

## Deployment Workflow

### To deploy changes:

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
3. GitHub Actions automatically runs the deploy script
4. Check status at: https://github.com/absolute0github/adhdCal/actions

### Manual deployment (if needed):

SSH into Cloudways and run:
```bash
~/deploy.sh
```

---

## Important Notes

1. **Environment files are NOT in git** - They must be created manually on each environment
2. **Varnish caching** - Purge from Cloudways dashboard if you see stale content
3. **Google OAuth** - The redirect URI `https://adhdcal.top/api/auth/callback` must be added in Google Cloud Console
4. **Client rebuilds** - Any frontend changes require `npm run build` in the client folder

---

## File Structure on Cloudways

```
/home/master/
├── deploy.sh                    # Deployment script
└── applications/kcpnvspcqx/
    └── public_html/
        ├── .env.example
        ├── .git/
        ├── .gitignore
        ├── .github/workflows/deploy.yml
        ├── .htaccess              # Routes to PHP proxy
        ├── index.php              # PHP reverse proxy
        ├── ecosystem.config.cjs   # PM2 config
        ├── package.json
        ├── client/
        │   ├── .env               # Supabase credentials
        │   ├── dist/              # Built frontend
        │   └── src/
        └── server/
            ├── .env               # Server credentials
            ├── index.js
            └── src/
                ├── app.js
                ├── config/
                ├── routes/
                └── services/
```

---

## Troubleshooting

### App not loading
1. Check PM2: `npx pm2 status`
2. Check logs: `npx pm2 logs --lines 50`
3. Test locally: `curl http://localhost:3001`

### Blank page
1. Check browser console for errors
2. Verify client `.env` has Supabase credentials
3. Rebuild client: `cd client && npm run build`
4. Purge Varnish cache in Cloudways

### GitHub Actions failing
1. Check Actions tab for error details
2. Verify secrets are set correctly
3. Test SSH manually: `ssh master_ezmunfgubz@161.35.191.109`

### Database connection issues
1. Verify DB credentials in `server/.env`
2. Check health endpoint: `curl http://localhost:3001/api/health`
