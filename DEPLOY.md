# Deployment Guide for Oscar Suite

Deploy to https://oscars.shucklecodes.com

## Server Structure

**Production Server:**
```
/home/lzpxczan/
├── OscarSuite/                      ← Backend (Node.js app)
│   ├── dist/                        ← Compiled JavaScript
│   ├── data/                        ← Database & static files
│   │   ├── db/                      ← JSON databases
│   │   ├── awards.json              ← Award categories
│   │   ├── nominees/                ← Nominee images
│   │   ├── guests/                  ← Guest photos (uploaded)
│   │   └── backgrounds/             ← Background images
│   ├── node_modules/                (symlink or installed)
│   ├── package.json
│   ├── app.js                       ← Passenger entry point
│   └── .env
│
└── oscars.shucklecodes.com/         ← Frontend (subdomain public_html)
    ├── .htaccess                    ← Proxy & React Router config
    ├── index.html
    └── assets/
```

---

## Initial Setup (One-Time)

### 1. Create Subdomain in cPanel

1. Go to cPanel → **Subdomains**
2. Create subdomain: `oscars`
3. Document root: `/home/lzpxczan/oscars.shucklecodes.com`

### 2. Create Node.js App in cPanel

1. Go to cPanel → **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version:** 20.x (or latest available)
   - **Application mode:** Production
   - **Application root:** `/home/lzpxczan/OscarSuite`
   - **Application URL:** `oscars.shucklecodes.com`
   - **Application startup file:** `app.js`
4. Click **Create**
5. Note the assigned port (you'll see it in the app details)

### 3. Create Backend Directory

Via FTP or SSH:
```bash
mkdir -p /home/lzpxczan/OscarSuite/data/db
mkdir -p /home/lzpxczan/OscarSuite/data/guests
```

---

## Deploy Backend

### Build locally:
```bash
cd server
npm install
npm run build
```

### Upload via FTP:
1. Upload `server/dist/*` → `/home/lzpxczan/OscarSuite/dist/`
2. Upload `server/app.js` → `/home/lzpxczan/OscarSuite/app.js`
3. Upload `server/package.json` → `/home/lzpxczan/OscarSuite/package.json`
4. Upload `server/data/awards.json` → `/home/lzpxczan/OscarSuite/data/awards.json`
5. Upload `server/data/backgrounds/*` → `/home/lzpxczan/OscarSuite/data/backgrounds/`
6. Upload `server/data/nominees/*` → `/home/lzpxczan/OscarSuite/data/nominees/`

### Install dependencies:
1. In cPanel → Setup Node.js App
2. Click on your Oscar Suite app
3. Click **Run NPM Install**

### Create .env file:
Create `/home/lzpxczan/OscarSuite/.env`:
```
NODE_ENV=production
PORT=8001
```

### Restart the app:
1. In cPanel → Setup Node.js App
2. Click **Restart**

### Verify:
- Visit: https://oscars.shucklecodes.com/api/awards
- Should return JSON array of awards

---

## Deploy Frontend

### Build locally:
```bash
cd client
npm install
npm run build
```

### Upload via FTP:
1. Upload `client/dist/*` → `/home/lzpxczan/oscars.shucklecodes.com/`
   - Upload `index.html`
   - Upload entire `assets/` folder
2. Upload `client/.htaccess` → `/home/lzpxczan/oscars.shucklecodes.com/.htaccess`

### Verify:
- Visit: https://oscars.shucklecodes.com
- Should see the Oscar Suite app
- Test all three pages: /guest, /admin, /display

---

## Quick Deploy Checklist

### Backend Changes:
- [ ] `cd server && npm run build`
- [ ] Upload `server/dist/*` to `/home/lzpxczan/OscarSuite/dist/`
- [ ] If package.json changed: Upload and Run NPM Install
- [ ] Restart Node.js app in cPanel
- [ ] Check: https://oscars.shucklecodes.com/api/awards

### Frontend Changes:
- [ ] `cd client && npm run build`
- [ ] Upload `client/dist/*` to `/home/lzpxczan/oscars.shucklecodes.com/`
- [ ] Hard refresh browser (Ctrl+Shift+R)

---

## Troubleshooting

### 503 Service Unavailable
**Cause:** Node.js app not running
**Fix:**
1. Check logs: `/home/lzpxczan/OscarSuite/stderr.log`
2. Restart app in cPanel

### API returns 404
**Cause:** .htaccess not proxying correctly
**Fix:** Verify .htaccess is in the subdomain's public_html folder

### WebSocket not connecting
**Cause:** WebSocket proxy not configured
**Fix:** Check that .htaccess includes WebSocket rules

### Images not loading
**Cause:** Data files not uploaded
**Fix:** Ensure backgrounds/ and nominees/ folders are uploaded to OscarSuite/data/

### Changes not showing
**Cause:** Browser cache
**Fix:** Hard refresh (Ctrl+Shift+R) or clear cache

---

## File Locations Quick Reference

| What | Path |
|------|------|
| Backend code | `/home/lzpxczan/OscarSuite/dist/` |
| Awards JSON | `/home/lzpxczan/OscarSuite/data/awards.json` |
| Databases | `/home/lzpxczan/OscarSuite/data/db/` |
| Nominee images | `/home/lzpxczan/OscarSuite/data/nominees/` |
| Guest photos | `/home/lzpxczan/OscarSuite/data/guests/` |
| Frontend | `/home/lzpxczan/oscars.shucklecodes.com/` |
| Error logs | `/home/lzpxczan/OscarSuite/stderr.log` |

---

## URLs

- **Guest Page:** https://oscars.shucklecodes.com/guest
- **Admin Page:** https://oscars.shucklecodes.com/admin
- **Display Page:** https://oscars.shucklecodes.com/display
- **API Health:** https://oscars.shucklecodes.com/api/awards
