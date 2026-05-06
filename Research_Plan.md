# Eskom Expo for Young Scientists — Research Plan
**Project Type:** Computer Science / Social Sciences

---

**NAME:** ____________________________________________________

**PROVISIONAL PROJECT TOPIC:** Anti-WA: An Automated WhatsApp Platform for Detecting and Preventing Cyberbullying Among South African Youth

**PROVISIONAL EXPO CATEGORY:** Computer Science / Social Sciences

---

## Introduction

### Literature Review

Cyberbullying is defined as the use of digital technology — including social media, messaging platforms, and online communities — to harass, threaten, humiliate, or exclude individuals (Smith et al., 2008). In South Africa, WhatsApp is the dominant messaging platform, with over 90% of smartphone users actively using the application (Statista, 2024). This ubiquity makes WhatsApp a primary environment in which cyberbullying occurs among young people, particularly within group chats shared among school peers.

Research by the Centre for Justice and Crime Prevention (CJCP, 2021) found that approximately 1 in 4 South African learners has experienced some form of online harassment, with messaging platforms being the most common medium. Despite this prevalence, automated tools for detecting and responding to abusive content within WhatsApp groups are virtually non-existent at the time of this research.

Existing anti-cyberbullying research has focused predominantly on machine learning-based text classifiers for social media platforms such as Twitter and Facebook (Hinduja & Patchin, 2014). Sticker-based harassment — a growing trend where offensive or dehumanising images are shared as WhatsApp stickers — has received minimal academic attention and no automated detection framework exists for this medium.

The Anti-WA platform addresses this gap by combining a React-based mobile application with a WhatsApp bot built on the Baileys library. The system enables real-time sticker collection, community-driven flagging, and automated enforcement (warnings and removal of offenders) within WhatsApp groups.

### Significance and Benefits

- **Learners** are protected from abusive sticker-based harassment in shared WhatsApp group chats.
- **Parents and teachers** gain a tool to enforce safe communication in youth group chats without needing to monitor every message manually.
- **Group administrators** can enforce community standards automatically, reducing the emotional labour of managing online conflict.
- **Researchers** and the broader academic community benefit from a working prototype and dataset of flagged abusive stickers from a South African context.

---

## Problem Statement

WhatsApp group chats among South African youth are increasingly used as environments for cyberbullying through the sharing of abusive, dehumanising, or explicit sticker images. No automated system currently exists to detect such content in real time and take protective action within WhatsApp. Group administrators are left to manage these situations manually, often missing incidents or acting too late to prevent psychological harm.

### Research Questions

1. To what extent can a WhatsApp bot, integrated with a community-driven reporting application, automatically detect and respond to the sharing of flagged abusive stickers in WhatsApp group chats?
2. How effective is a three-strike automated warning and removal system in deterring repeat cyberbullying behaviour within WhatsApp groups?
3. How does community participation in flagging offensive sticker content compare to administrator-only moderation in terms of coverage and response time?

---

## Aim

The aim of this research is to design, develop, and test an automated cyberbullying prevention system — called Anti-WA — that monitors WhatsApp group chats, allows community members to flag abusive sticker content through a mobile application, and automatically enforces a warning and removal policy against offenders in real time.

---

## Hypothesis

The implementation of an automated, community-driven sticker flagging and enforcement system on WhatsApp will significantly reduce the frequency of abusive sticker sharing in monitored group chats compared to groups relying on manual administrator moderation alone.

---

## Variables

| Variable Type | Variable | How Measured |
|---|---|---|
| Independent | Presence of the Anti-WA bot in a WhatsApp group | Bot active vs. not active |
| Dependent | Frequency of flagged sticker sharing incidents | Count of flagged sticker detections per day/week |
| Dependent | Response time to abusive content | Time between sticker send and bot action (warn/kick) |
| Controlled | Group size | Groups of similar size selected for comparison |
| Controlled | Age of participants | Focus on youth aged 13–18 |
| Controlled | WhatsApp version | All participants on the same platform (WhatsApp Android) |

---

## Method

### Research Design

This research will follow a mixed-methods design incorporating:
1. **System development** — building and iterating on the Anti-WA platform (engineering design cycle)
2. **Quantitative data collection** — measuring detection rates, warning counts, and kick counts
3. **Survey data** — collecting participant perception data on safety and comfort in monitored vs. unmonitored groups

### System Architecture

The Anti-WA platform consists of three interconnected components:

**1. WhatsApp Bot (`index.js`, `message.js`)**
- Built with Node.js using the `@whiskeysockets/baileys` library, which provides an unofficial WhatsApp Web API
- Connects to WhatsApp using a pairing code system (no QR scan required)
- Monitors all group messages in real time
- On detecting a sticker: downloads it, computes a SHA-256 hash, queries the API for a match against the flagged sticker database
- If matched: issues an automated warning to the sender using `.warn`; after 3 warnings, automatically removes the sender from the group using `.kick`
- Tracks bot admin status per group (required for enforcement actions)

**2. REST API (`api/server.js`)**
- Built with Node.js and Express, running on port 3001
- Persists data in a JSON file database (`api/data/db.json`)
- Key endpoints:
  - `POST /api/generate-code` — generates a 6-digit linking code for session pairing
  - `POST /api/verify-code` — called by the bot to link a WhatsApp number to the session
  - `POST /api/group-stickers` — bot uploads collected stickers as base64 with group metadata
  - `GET /api/group-stickers?group=<jid>` — returns sticker gallery with flagged status
  - `POST /api/flag-sticker-hash` — flags a sticker hash as abusive
  - `GET /api/flagged-hashes` — used by bot to check against live detections
  - `GET /api/stats` — returns live statistics (groups monitored, warnings, kicks, pairing code)

**3. React Mobile Application (`frontend/`)**
- Built with React 18, Vite, and Tailwind CSS
- Wrapped as an Android APK using Capacitor 6 (`com.antiwa.stopbullying`)
- Pages:
  - **Home** — landing page explaining the platform
  - **Connect** — generates a 6-digit code; user sends it to the bot on WhatsApp to pair the session; the app polls the API until pairing is confirmed
  - **Dashboard** — displays live stats: groups monitored, total warnings issued, total kicks, bot number, admin status per group
  - **Stickers** — auto-synced gallery of all stickers collected by the bot from monitored groups; filterable by group; any sticker can be flagged or unflagged with one tap
- Communication between app and API uses Axios with the Replit-hosted API URL

### How the Linking Flow Works

```
User opens Anti-WA App
        ↓
Taps "Get Started" → App calls POST /api/generate-code → Receives 6-digit code
        ↓
User sends the 6-digit code to the bot's WhatsApp number in a private chat
        ↓
Bot receives the code → calls POST /api/verify-code with the sender's WhatsApp number
        ↓
App polls GET /api/session/:sessionId every 3 seconds
        ↓
Once linked, app navigates to Dashboard — session stored locally
```

### Procedure

1. Obtain informed consent from WhatsApp group administrators and participants
2. Deploy the Anti-WA bot to a set of volunteer WhatsApp groups
3. Groups will be divided into two conditions:
   - **Experimental groups** — Anti-WA bot active, sticker flagging enabled
   - **Control groups** — manual admin moderation only
4. Run the study over a 4-week period, logging all incidents
5. After 4 weeks, administer a short survey (Google Forms) to group members assessing:
   - Perceived safety in the group
   - Awareness of cyberbullying incidents
   - Satisfaction with moderation response time
6. Collect quantitative data from the API stats endpoint
7. Analyse and compare experimental vs. control group outcomes

### Sample

- **Target group:** South African youth aged 13–18 in WhatsApp group chats
- **Sample size:** Minimum of 4 WhatsApp groups (2 experimental, 2 control), each with 20–50 members
- **Selection method:** Deliberate/purposive sampling — groups where the researcher can obtain administrator permission
- **Demographics:** Mixed gender, urban and peri-urban settings, Grades 8–12

### Data Analysis

- **Quantitative:** Incident count, warning count, kick count, response time — presented as bar charts, time-series graphs, and comparative tables
- **Qualitative/Survey:** Likert-scale responses analysed for mean scores; open-ended responses thematically coded
- **Statistical comparison:** Incident rates in experimental vs. control groups compared using descriptive statistics

---

## Ethics

All research will be conducted in accordance with the Eskom Expo Ethics Guidelines and South African research ethics principles.

- Written informed consent will be obtained from all group administrators; parental/guardian consent will be obtained for participants under 18
- Participant privacy will be protected — no WhatsApp phone numbers, names, or personal messages will be stored or published; only anonymised sticker hashes and aggregate statistics will be recorded
- Participation is entirely voluntary; any group may withdraw at any time without consequence
- The bot will not read or store the text content of messages — it only processes sticker media types
- No data will be shared with third parties
- The study has no deception component — all participants will be informed of the bot's presence and purpose
- The researcher will submit the Learner Ethics Checklist to the Eskom Expo ethics clearance panel

*See Ethics.md for the completed Learner Ethics Checklist.*

---

## Safety

- The system operates entirely on digital infrastructure; there are no physical safety hazards
- The API server is hosted on Replit's cloud infrastructure using HTTPS, ensuring encrypted data transmission
- No harmful chemicals, biological agents, or dangerous machinery are involved
- Potential digital safety risk: unauthorised access to the API. Mitigation: the API URL is hosted on Replit's secured infrastructure; no sensitive personal data is stored
- Potential psychological risk: researchers or reviewers may encounter offensive sticker content when reviewing flagged items. Mitigation: the researcher will limit exposure and seek support if needed

---

## Time Frames

| Phase | Activity | Target Date |
|---|---|---|
| Phase 1 | Background reading, literature review, finalise research questions | Week 1–2 |
| Phase 2 | Complete system development (bot, API, app, APK build) | Week 3–4 |
| Phase 3 | Obtain ethics clearance; obtain consent from group admins and participants | Week 5 |
| Phase 4 | Deploy bot to experimental groups; begin 4-week monitoring period | Week 6 |
| Phase 5 | Administer participant survey (mid-point check) | Week 8 |
| Phase 6 | End of monitoring period; collect all data | Week 10 |
| Phase 7 | Data analysis, graphs, statistics | Week 11 |
| Phase 8 | Write Project Report | Week 12–13 |
| Phase 9 | Design and print Expo Poster | Week 14 |
| Phase 10 | Submit and present at Eskom Expo | Week 15 |

*Progress will be reported to the teacher/mentor at the end of each phase.*

---

## References

Hinduja, S. & Patchin, J.W., 2014. *Cyberbullying: Identification, Prevention and Response*. Cyberbullying Research Center. Available at: https://cyberbullying.org [Accessed: May 2026].

Smith, P.K., Mahdavi, J., Carvalho, M., Fisher, S., Russell, S. & Tippett, N., 2008. Cyberbullying: its nature and impact in secondary school pupils. *Journal of Child Psychology and Psychiatry*, 49(4), pp. 376–385.

Statista, 2024. *Most used messaging apps in South Africa 2024*. Available at: https://www.statista.com/statistics/1136119/whatsapp-users-south-africa/ [Accessed: May 2026].

Centre for Justice and Crime Prevention (CJCP), 2021. *Online Safety and Cyberbullying Among South African Youth*. Cape Town: CJCP.

WhiskeySockets, 2024. *Baileys — Lightweight full-featured WhatsApp Web + Multi-Device API*. GitHub. Available at: https://github.com/WhiskeySockets/Baileys [Accessed: May 2026].

---

## Teacher's / Mentor's Comments and Suggestions

_________________________________________________________________________________________________
_________________________________________________________________________________________________
_________________________________________________________________________________________________

**Teacher's/Mentor's Name:** ___________________________________

**Signature:** ___________________________________  **Date:** ___________________________________
