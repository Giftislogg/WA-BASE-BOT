# Anti-WA — Stop Cyber Bullying on WhatsApp

## Project Overview

A full-stack cyberbullying prevention platform combining a React web app (mobile-first, Capacitor-wrapped Android) with a WhatsApp bot. Users report abusive stickers from the app; the bot automatically warns then kicks senders from WhatsApp groups.

## Architecture

```
anti-wa/
├── index.js              # WhatsApp bot (Baileys) — group tracking, pairing code
├── message.js            # Bot message handler — auto-warn/kick on flagged media
├── api/
│   ├── server.js         # Express REST API (port 3001)
│   ├── data/db.json      # JSON database (codes, users, flagged stickers, stats)
│   └── uploads/          # Uploaded sticker screenshots
├── frontend/             # React + Vite mobile-first web app (port 5000)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Landing page
│   │   │   ├── Connect.jsx    # Code generation & WA linking
│   │   │   ├── Dashboard.jsx  # Live stats (groups, kicks, warnings, pairing code)
│   │   │   ├── Report.jsx     # Upload sticker screenshot to flag
│   │   │   └── Flagged.jsx    # View all flagged stickers
│   │   └── components/
│   │       └── NavBar.jsx     # Bottom navigation
│   └── android/              # Capacitor Android project (com.antiwa.stopbullying)
│       ├── app/build.gradle   # Kotlin stdlib fix applied
│       └── local.properties   # sdk.dir=~/android-sdk
├── plugins/
│   ├── antiwa.js         # .antiwa help/link/flag/unflag/status
│   ├── kick.js           # .kick @user (admin)
│   ├── warn.js           # .warn @user (admin, auto-kicks at 3 warnings)
│   ├── warnings.js       # .warnings @user — check warning count
│   └── resetwarn.js      # .resetwarn @user (admin)
└── settings/config.js    # Bot configuration
```

## Workflows

| Workflow | Command | Port | Type |
|---|---|---|---|
| Start application | `cd frontend && npm run dev` | 5000 | webview |
| Anti-WA API | `node api/server.js` | 3001 | console |
| WhatsApp Bot | `node index.js` | — | console |

## Netlify Web Version
- **URL**: https://antiwa.netlify.app
- **Config**: `netlify.toml` (root) — sets build base to `frontend/`, proxies `/api/*` and `/uploads/*` to Replit API, SPA redirect for React Router
- **API URL hiding**: Web build uses relative `/api/...` (Netlify proxies to Replit); Replit URL never appears in JS bundle
- **Offline screen**: `OfflineScreen.jsx` shown when `navigator.onLine === false`
- **To deploy**: Push to GitHub → connect repo in Netlify → auto-deploys from `netlify.toml`

## APK Build

- **Output**: `AntiWA-debug.apk` (4 MB) / `AntiWA-debug.zip` (for download)
- **App ID**: `com.antiwa.stopbullying`
- **Built with**: Capacitor 6, Gradle 8.11.1, Android SDK 35, JDK 21 (Temurin)
- **JDK path**: `~/jdk21` (Temurin 21.0.1)
- **Gradle path**: `~/gradle-home/gradle-8.11.1/bin/gradle`
- **Android SDK**: `~/android-sdk` (platforms;android-35, build-tools;35.0.0)

### To rebuild APK:
```bash
export JAVA_HOME=~/jdk21 ANDROID_HOME=~/android-sdk PATH=~/jdk21/bin:$PATH
cd frontend && npx cap sync android
cd android && ~/gradle-home/gradle-8.11.1/bin/gradle assembleDebug --no-daemon
```

## How It Works

### User Flow
1. User opens Anti-WA app → taps **Get Started**
2. App generates a unique **6-digit code**
3. User sends code to the bot's WhatsApp number
4. Bot links the WhatsApp number to the session via API
5. User taps **"I Linked It"** → goes to Dashboard
6. Dashboard shows live stats: groups monitored, kicks, warnings, flagged count, bot number
7. User uploads screenshots of abusive stickers to report them
8. Bot monitors all groups and **auto-warns** senders, then **auto-kicks** at 3 warnings

### API Endpoints (port 3001)
- `POST /api/generate-code` — Generate 6-digit linking code
- `POST /api/verify-code` — Link WA number to session (called by bot)
- `GET /api/session/:sessionId` — Check if session is linked
- `POST /api/flag-sticker` — Upload sticker screenshot (multipart)
- `GET /api/flagged-stickers` — List all reported stickers
- `DELETE /api/flagged-sticker/:id` — Remove a sticker report
- `POST /api/flag-sticker-hash` — Flag by SHA-256 hash (bot command)
- `GET /api/flagged-hashes` — Get all hashes for bot matching
- `DELETE /api/flag-sticker-hash/:hash` — Unflag a hash
- `GET /api/stats` — Groups, kicks, warnings, pairing code, bot number
- `POST /api/stats/pairing-code` — Store pairing code from bot
- `GET /api/health` — Health check

### Bot Commands
- Send a **6-digit code** in private chat → auto-links your account
- `.antiwa help` — Show all Anti-WA commands
- `.antiwa flag` — Reply to a sticker to flag it (admins only)
- `.antiwa unflag` — Remove a sticker from flagged list (admins only)
- `.kick @user` — Kick a user from the group (admins only)
- `.warn @user` — Warn a user; auto-kicks at 3 warnings (admins only)
- `.warnings @user` — View warning count for a user
- `.resetwarn @user` — Reset warnings for a user (admins only)

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
- **API**: Node.js, Express, Multer (file uploads), CORS
- **Bot**: Node.js, @whiskeysockets/baileys, Pino
- **Storage**: JSON file (api/data/db.json), local file uploads
- **Android**: Capacitor 6 (com.antiwa.stopbullying), minSdk 23, targetSdk 35
