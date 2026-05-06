# Anti-WA — Project Diary
### Eskom Expo for Young Scientists

*This diary documents the development journey, challenges, decisions, and progress made during the Anti-WA project. Entries are recorded in chronological order.*

---

## Entry 1 — Project Conception
**Date:** Early April 2026

The idea for this project came from observing how WhatsApp group chats among peers are increasingly used to share offensive stickers targeting individuals. While platforms like Instagram and Twitter have content moderation tools, WhatsApp — the most widely used messaging app in South Africa — has no automated way for group administrators to detect and respond to abusive sticker content.

The initial question was: *Can a bot be built that automatically monitors WhatsApp groups and takes action when someone sends a flagged abusive sticker?*

After researching available WhatsApp automation libraries, the `@whiskeysockets/baileys` Node.js library was identified as the most capable open-source option. It provides a full WhatsApp Web API, supporting message events, group management (kick, promote, demote), and media downloads.

**Decision made:** Build a full-stack platform — a WhatsApp bot for detection and enforcement, a REST API for data persistence, and a mobile app for community reporting.

---

## Entry 2 — Setting Up the Development Environment
**Date:** April 2026 (Week 1)

The project was initialised on Replit, a cloud-based development environment. This was chosen because:
- It provides always-on hosting without needing a physical server
- It generates a stable public HTTPS URL, which the bot needs to communicate with the API
- It supports multiple concurrent processes (the bot, the API server, and the frontend dev server run simultaneously)

Three workflows were configured in Replit:
1. `node index.js` — WhatsApp bot (runs continuously)
2. `node api/server.js` — REST API on port 3001
3. `cd frontend && npm run dev` — React frontend on port 5000

**First challenge encountered:** The WhatsApp bot requires maintaining a persistent session (authentication state). Baileys stores session keys in a local folder (`auth_info_baileys/`). The bot must scan a QR code or use a pairing code on first connection. A pairing-code approach was implemented so users don't need to scan anything — they just enter their phone number, receive a code, and enter it in WhatsApp.

---

## Entry 3 — Bot Core Development
**Date:** April 2026 (Week 1–2)

**`index.js`** was written first — the main bot file. It:
- Connects to WhatsApp using Baileys
- Handles the pairing code flow
- Tracks all groups the bot is a member of
- Syncs group membership and bot admin status to the API every time a group-participants update event fires
- Routes incoming messages to `message.js` for processing

**`message.js`** handles the actual logic for every message:
- Detects if the message is a sticker in a group
- Downloads the sticker media using Baileys' `downloadContentFromMessage`
- Computes a SHA-256 hash of the sticker data
- Checks the hash against the API's flagged hashes list
- If flagged: warns the sender; if 3 warnings accumulated, kicks them from the group

**Challenge:** `downloadContentFromMessage` is an async stream — it returns a readable stream, not a buffer directly. The buffer must be assembled by collecting chunks:

```javascript
let buffer = Buffer.alloc(0);
for await (const chunk of stream) {
  buffer = Buffer.concat([buffer, chunk]);
}
```

This was a subtle bug that caused sticker processing to silently fail initially.

---

## Entry 4 — Bot Plugin System
**Date:** April 2026 (Week 2)

To keep the code organised, commands were separated into plugin files inside a `plugins/` folder:

- **`antiwa.js`** — `.antiwa help`, `.antiwa flag` (flag a sticker by replying to it), `.antiwa unflag`, `.antiwa status`
- **`kick.js`** — `.kick @user` (admin command)
- **`warn.js`** — `.warn @user` (admin command, auto-kicks at 3 warnings)
- **`warnings.js`** — `.warnings @user` (check count)
- **`resetwarn.js`** — `.resetwarn @user` (admin command)

**Bug discovered in `antiwa.js`:** The `downloadContentFromMessage` function was being imported at the top of the file using a static import. Due to how Baileys' ES Module exports interact with CommonJS `require()`, this caused a race condition where the function was sometimes undefined when first called. The fix was to import it inline, inside the function where it is used, ensuring the module is fully loaded by that point.

---

## Entry 5 — API Server Development
**Date:** April 2026 (Week 2)

`api/server.js` was built as an Express.js REST API. Data is persisted in `api/data/db.json` — a JSON file used as a lightweight database. This was chosen over a full database (like PostgreSQL) to keep the project simple and self-contained.

**Endpoints developed:**

| Endpoint | Purpose |
|---|---|
| `POST /api/generate-code` | App generates a unique 6-digit code for linking |
| `POST /api/verify-code` | Bot calls this when a user sends their code |
| `GET /api/session/:sessionId` | App polls this to check if linking is complete |
| `GET /api/stats` | Returns live stats: groups, warnings, kicks, pairing code, bot number |
| `POST /api/stats/pairing-code` | Bot stores its pairing code here so the app can display it |
| `POST /api/flag-sticker-hash` | Flag a sticker hash as abusive |
| `GET /api/flagged-hashes` | Bot queries this to check detections |
| `DELETE /api/flag-sticker-hash/:hash` | Unflag a sticker |
| `POST /api/group-stickers` | Bot uploads collected stickers (base64 + group info) |
| `GET /api/group-stickers` | App retrieves sticker gallery, filtered by group |
| `GET /api/health` | Health check endpoint |

**Challenge:** File uploads (sticker images) needed to be handled both as multipart form data (from the original report feature) and as base64 JSON (from the bot). `multer` middleware was added for form data, while `express.json({ limit: '20mb' })` was configured to accept the larger base64 payloads from the bot.

---

## Entry 6 — Frontend / Mobile App Development
**Date:** April 2026 (Week 3)

The frontend was built with React 18 and Vite, styled with Tailwind CSS. It was designed mobile-first because the target users are learners using smartphones.

**Pages built:**

**Home.jsx** — A landing page explaining what Anti-WA does and a "Get Started" button.

**Connect.jsx** — The pairing flow:
1. App calls `POST /api/generate-code` and displays the 6-digit code
2. User is instructed to send the code to the bot on WhatsApp
3. App polls `GET /api/session/:sessionId` every 3 seconds
4. When the bot calls `verify-code`, the session becomes "linked"
5. App stores the session ID in `localStorage` and navigates to the Dashboard

**Dashboard.jsx** — Displays live statistics fetched from `GET /api/stats`:
- Number of groups monitored
- Total warnings issued
- Total kicks performed
- Flagged sticker count
- Bot's WhatsApp number
- Per-group list with admin status badge

**Stickers.jsx** — A sticker gallery page:
- Fetches all collected stickers from `GET /api/group-stickers`
- Displays group filter pills at the top — user can tap a group to filter
- Each sticker shown in a grid with its group name
- Flagged stickers shown with a red "Flagged" badge
- Tap any sticker to flag or unflag it via `POST /api/flag-sticker-hash` or `DELETE /api/flag-sticker-hash/:hash`

**NavBar.jsx** — Bottom navigation bar with four tabs: Home, Connect, Dashboard, Stickers.

---

## Entry 7 — Critical Bug: Session Lost on Server Sleep
**Date:** April 2026 (Week 3)

**Problem identified:** On the free Replit plan, the API server goes to sleep after a period of inactivity. When it wakes up, it may briefly return a network error or timeout. The original `Connect.jsx` code treated *any* API error as "session not found" and deleted the stored `localStorage` session, sending the user back to the setup screen.

This meant users had to re-link their WhatsApp account every time the server went to sleep — extremely frustrating.

**Fix applied:** Modified the error handling in `Connect.jsx` to only clear the stored session when the API explicitly returns HTTP 404 (session not found). Network errors, timeouts (HTTP 0 or 5xx), or CORS issues are now silently ignored and the user stays on their current page. The session is only destroyed if the server definitively says it does not exist.

```javascript
// Before (wrong):
catch (err) {
  localStorage.removeItem('antiwa_session');  // wiped on ANY error
}

// After (correct):
catch (err) {
  if (err.response && err.response.status === 404) {
    localStorage.removeItem('antiwa_session');  // only on explicit "not found"
  }
  // network errors are ignored — server may just be waking up
}
```

---

## Entry 8 — Sticker Auto-Collection Feature
**Date:** April 2026 (Week 3–4)

**Original design:** Users had to manually screenshot an abusive sticker and upload the image through the app. This had several problems:
- It required the user to see the sticker, which means they were already exposed to the content
- Screenshot uploads are larger files (PNG) compared to the actual sticker (WebP)
- The hash matching would not work because the screenshot hash differs from the original sticker hash

**Redesigned approach:** The bot now automatically collects *every* sticker sent in any monitored group. For each sticker:
1. The bot downloads the raw sticker data (WebP format)
2. Computes a SHA-256 hash of the raw bytes
3. Checks if this hash was already collected (using a `global._antiwaCollected` Set to avoid duplicates in the current session)
4. If new: sends the sticker to the API as base64 along with the group JID and group name
5. The API saves the file to `api/uploads/` and records it in `db.json`

Users can then browse the sticker gallery in the app and flag any sticker they recognise as abusive — with a single tap. The next time that sticker is sent in any monitored group, the bot will automatically enforce the warn/kick policy.

This is a fundamentally better approach because:
- The community curates the flagged list collaboratively
- Users do not need to be exposed to content; they can flag based on thumbnail preview
- Hash matching is exact — the same sticker file always produces the same hash regardless of who sends it

---

## Entry 9 — Android APK Build
**Date:** May 2026 (Week 4–5)

To distribute the app as an Android APK (installable without the Google Play Store), Capacitor 6 was used to wrap the React/Vite web app in a native Android shell.

**Android SDK installation** was required since the Replit environment does not include Android build tools by default. The following were installed manually:
- JDK 21 (Temurin) at `~/jdk21`
- Gradle 8.11.1 at `~/gradle-home/gradle-8.11.1/`
- Android SDK command-line tools, platform-tools, `platforms;android-35`, `build-tools;35.0.0` at `~/android-sdk`
- A debug keystore generated at `~/.android/debug.keystore`

**Challenge:** `npx cap sync android` succeeded, copying the built web assets into the Android project at `android/app/src/main/assets/public/`. However, running `gradle assembleDebug` consistently timed out after 2 minutes in the Replit bash environment — the full Gradle build takes 3–6 minutes on first run.

**Solution:** Since only the web assets (JavaScript/HTML/CSS) had changed — not any native Android/Kotlin code — a direct APK patching approach was used:
1. The existing compiled APK from the previous build was opened as a ZIP archive using the `adm-zip` Node.js library
2. All `assets/public/` entries were removed from the archive
3. The new web asset files were inserted from the `cap sync` output
4. The modified APK was written to disk
5. The APK was re-signed using `jarsigner` with the debug keystore

This produced a valid, installable debug APK in under 60 seconds — compared to the 3–6 minute full Gradle build.

**Output:** `AntiWA-v2-debug.apk` (3.9 MB), packaged as `AntiWA-v2-debug.zip` for download.

**App ID:** `com.antiwa.stopbullying`
**Min Android version:** Android 6.0 (API level 23)
**Target Android version:** Android 15 (API level 35)

---

## Entry 10 — Testing and Verification
**Date:** May 2026

The following tests were conducted:

| Test | Result |
|---|---|
| Bot pairs with WhatsApp via pairing code | Pass |
| Bot joins a group and detects stickers | Pass |
| Sticker hash computed correctly (same sticker = same hash) | Pass |
| Bot calls API to store collected sticker | Pass |
| Sticker gallery loads in app with correct group filter | Pass |
| Flagging a sticker via app updates bot's detection in real time | Pass |
| Bot warns sender when flagged sticker is detected | Pass |
| Bot kicks sender after 3 warnings | Pass |
| Session persists through server sleep/wake cycle | Pass (after bug fix) |
| APK installs on Android phone | Pass |
| APK communicates with API over HTTPS | Pass |

---

## Entry 11 — Reflections and Next Steps
**Date:** May 2026

**What worked well:**
- The hash-based sticker matching system is elegant and accurate — the same sticker always produces the same hash regardless of who sends it
- Separating the system into three components (bot, API, app) made debugging easier
- The community flagging model is more scalable than administrator-only moderation

**What was harder than expected:**
- Baileys' media download API is complex and underdocumented; working out the async stream pattern took significant debugging time
- Android build tooling in a cloud environment is difficult; the custom APK patching approach was an unconventional but effective solution
- WhatsApp frequently updates its protocol; the bot connection occasionally drops and must reconnect

**Future improvements:**
- Implement machine learning text analysis to detect cyberbullying in text messages as well as stickers
- Add push notifications to the app when a new sticker is detected
- Build a web-based admin dashboard for teachers and parents
- Add multi-language support (isiZulu, Afrikaans, Sesotho) to reach more South African communities
- Migrate from JSON file database to PostgreSQL for better scalability
- Add user authentication to the app (currently session-only)

---

*Diary maintained throughout the project. All code, observations, decisions, and data are stored in the project repository on Replit.*
