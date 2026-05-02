# Anti-WA — Stop Cyber Bullying on WhatsApp

## Project Overview

A full-stack cyberbullying prevention platform combining a React web app (mobile-first, hybrid-ready) with a WhatsApp bot. Students and users can report abusive stickers from the app; the bot automatically detects and removes them from WhatsApp groups.

## Architecture

```
anti-wa/
├── index.js              # WhatsApp bot (Baileys)
├── message.js            # Bot message handler (Anti-WA hooks added)
├── api/
│   ├── server.js         # Express REST API (port 3001)
│   ├── data/db.json      # JSON database (codes, users, flagged stickers)
│   └── uploads/          # Uploaded sticker screenshots
├── frontend/             # React + Vite mobile-first web app (port 5000)
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx       # Landing page
│       │   ├── Connect.jsx    # Code generation & WA linking
│       │   ├── Dashboard.jsx  # Overview & stats
│       │   ├── Report.jsx     # Upload sticker screenshot to flag
│       │   └── Flagged.jsx    # View all flagged stickers
│       └── components/
│           └── NavBar.jsx     # Bottom navigation
├── plugins/
│   └── antiwa.js         # Bot plugin: .antiwa help/link/flag/unflag
└── settings/config.js    # Bot configuration
```

## Workflows

| Workflow | Command | Port | Type |
|---|---|---|---|
| Start application | `cd frontend && npm run dev` | 5000 | webview |
| Anti-WA API | `node api/server.js` | 3001 | console |
| WhatsApp Bot | `node index.js` | — | console |

## How It Works

### User Flow
1. User opens the Anti-WA app and taps **Get Started**
2. App generates a unique **6-digit code**
3. User sends that code to the bot's WhatsApp number
4. Bot calls the API to link the WhatsApp number to the session
5. User taps **"I Linked It"** in the app → goes to dashboard
6. User can upload screenshots of abusive stickers to report them
7. Bot admins can also use `.antiwa flag` (reply to a sticker) to flag by hash
8. Bot monitors all groups it's in and **auto-deletes** any flagged sticker

### API Endpoints (port 3001)
- `POST /api/generate-code` — Generate a 6-digit linking code
- `POST /api/verify-code` — Link WA number to session (called by bot)
- `GET /api/session/:sessionId` — Check if session is linked
- `POST /api/flag-sticker` — Upload sticker screenshot (multipart)
- `GET /api/flagged-stickers` — List all reported stickers
- `DELETE /api/flagged-sticker/:id` — Remove a sticker report
- `POST /api/flag-sticker-hash` — Flag by SHA-256 hash (bot command)
- `GET /api/flagged-hashes` — Get all hashes for bot matching
- `DELETE /api/flag-sticker-hash/:hash` — Unflag a hash
- `GET /api/health` — Health check

### Bot Commands
- Send a **6-digit code** in private chat → auto-links your account
- `.antiwa help` — Show all Anti-WA commands
- `.antiwa link <code>` — Alternative way to link
- `.antiwa status` — Check API status
- `.antiwa flag` — Reply to a sticker to flag it for auto-removal (admins only)
- `.antiwa unflag` — Remove a sticker from flagged list (admins only)

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
- **API**: Node.js, Express, Multer (file uploads), CORS
- **Bot**: Node.js, @whiskeysockets/baileys, Pino
- **Storage**: JSON file (api/data/db.json), local file uploads
- **Android**: Mobile-first PWA design, can be wrapped with Capacitor for APK
