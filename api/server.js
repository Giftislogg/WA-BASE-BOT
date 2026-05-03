const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = 3001;

const DATA_FILE = path.join(__dirname, 'data', 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });

function readDB() {
    if (!fs.existsSync(DATA_FILE)) {
        const init = {
            codes: {}, users: {}, flaggedStickers: [], flaggedHashes: [],
            stats: { groups: {}, kicks: [], warnings: {}, pairingCode: null, botNumber: null }
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(init, null, 2));
        return init;
    }
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!db.flaggedHashes) db.flaggedHashes = [];
    if (!db.stats) db.stats = { groups: {}, kicks: [], warnings: {}, pairingCode: null, botNumber: null };
    if (!db.stats.groups) db.stats.groups = {};
    if (!db.stats.kicks) db.stats.kicks = [];
    if (!db.stats.warnings) db.stats.warnings = {};
    return db;
}

function writeDB(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `sticker_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Code generation ──────────────────────────────
app.post('/api/generate-code', (req, res) => {
    const db = readDB();
    const code = generateCode();
    const sessionId = crypto.randomBytes(16).toString('hex');
    db.codes[code] = { sessionId, createdAt: Date.now(), used: false, whatsapp: null };
    writeDB(db);
    res.json({ success: true, code, sessionId });
});

// ── Code verification ──────────────────────────────
app.post('/api/verify-code', (req, res) => {
    const { code, whatsapp } = req.body;
    if (!code || !whatsapp) return res.status(400).json({ success: false, message: 'Missing code or whatsapp' });
    const db = readDB();
    const entry = db.codes[code];
    if (!entry) return res.status(404).json({ success: false, message: 'Invalid code' });
    if (entry.used) return res.status(409).json({ success: false, message: 'Code already used' });
    if (Date.now() - entry.createdAt > 15 * 60 * 1000) return res.status(410).json({ success: false, message: 'Code expired' });
    entry.used = true;
    entry.whatsapp = whatsapp;
    db.users[whatsapp] = { sessionId: entry.sessionId, linkedAt: Date.now(), isAdmin: false };
    writeDB(db);
    res.json({ success: true, sessionId: entry.sessionId, message: 'Linked successfully' });
});

// ── Session lookup ──────────────────────────────
app.get('/api/session/:sessionId', (req, res) => {
    const db = readDB();
    const user = Object.values(db.users).find(u => u.sessionId === req.params.sessionId);
    if (!user) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, user });
});

// ── Flag sticker via image upload ──────────────────────────────
app.post('/api/flag-sticker', upload.single('image'), (req, res) => {
    const { sessionId, description } = req.body;
    if (!sessionId || !req.file) return res.status(400).json({ success: false, message: 'Missing data' });
    const db = readDB();
    const user = Object.values(db.users).find(u => u.sessionId === sessionId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Compute SHA-256 hash of the uploaded image so the bot can detect it in groups
    const fileBuffer = fs.readFileSync(req.file.path);
    const imageHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Add hash to flaggedHashes if not already there
    if (!db.flaggedHashes.find(h => h.hash === imageHash)) {
        db.flaggedHashes.push({
            hash: imageHash,
            flaggedBy: sessionId,
            groupJid: null,
            description: description || 'Reported via app',
            flaggedAt: Date.now()
        });
    }

    const sticker = {
        id: crypto.randomBytes(8).toString('hex'),
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        hash: imageHash,
        description: description || '',
        reportedBy: user.sessionId,
        reportedAt: Date.now(),
        removed: false
    };
    db.flaggedStickers.push(sticker);
    writeDB(db);
    res.json({ success: true, sticker });
});

// ── Get all flagged stickers ──────────────────────────────
app.get('/api/flagged-stickers', (req, res) => {
    const db = readDB();
    res.json({ success: true, stickers: db.flaggedStickers });
});

// ── Remove a flagged sticker ──────────────────────────────
app.delete('/api/flagged-sticker/:id', (req, res) => {
    const db = readDB();
    const idx = db.flaggedStickers.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
    db.flaggedStickers.splice(idx, 1);
    writeDB(db);
    res.json({ success: true });
});

// ── Flag sticker by hash (bot command) ──────────────────────────────
app.post('/api/flag-sticker-hash', (req, res) => {
    const { hash, flaggedBy, groupJid, description } = req.body;
    if (!hash) return res.status(400).json({ success: false, message: 'Missing hash' });
    const db = readDB();
    if (db.flaggedHashes.find(h => h.hash === hash)) {
        return res.status(409).json({ success: false, message: 'Already flagged' });
    }
    db.flaggedHashes.push({ hash, flaggedBy, groupJid, description: description || '', flaggedAt: Date.now() });
    writeDB(db);
    res.json({ success: true });
});

// ── Get all flagged hashes ──────────────────────────────
app.get('/api/flagged-hashes', (req, res) => {
    const db = readDB();
    res.json({ success: true, hashes: db.flaggedHashes.map(h => h.hash) });
});

// ── Delete a flagged hash ──────────────────────────────
app.delete('/api/flag-sticker-hash/:hash', (req, res) => {
    const db = readDB();
    const idx = db.flaggedHashes.findIndex(h => h.hash === req.params.hash);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
    db.flaggedHashes.splice(idx, 1);
    writeDB(db);
    res.json({ success: true });
});

// ════════════════════════════════════════════════
// STATS ENDPOINTS
// ════════════════════════════════════════════════

// ── Store pairing code & bot number (called by bot) ──────────────────────────────
app.post('/api/stats/pairing', (req, res) => {
    const { pairingCode, botNumber } = req.body;
    const db = readDB();
    if (pairingCode) db.stats.pairingCode = pairingCode;
    if (botNumber) db.stats.botNumber = botNumber;
    writeDB(db);
    res.json({ success: true });
});

// ── Update group list (bot calls this on join/leave) ──────────────────────────────
app.post('/api/stats/group', (req, res) => {
    const { groupJid, groupName, action } = req.body;
    if (!groupJid) return res.status(400).json({ success: false, message: 'Missing groupJid' });
    const db = readDB();
    if (action === 'leave') {
        delete db.stats.groups[groupJid];
    } else {
        db.stats.groups[groupJid] = { name: groupName || groupJid, joinedAt: db.stats.groups[groupJid]?.joinedAt || Date.now() };
    }
    writeDB(db);
    res.json({ success: true });
});

// ── Record a kick ──────────────────────────────
app.post('/api/stats/kick', (req, res) => {
    const { groupJid, kickedNumber, kickedBy } = req.body;
    const db = readDB();
    db.stats.kicks.push({ groupJid, kickedNumber, kickedBy, at: Date.now() });
    writeDB(db);
    res.json({ success: true });
});

// ── Issue a warning ──────────────────────────────
app.post('/api/stats/warn', (req, res) => {
    const { groupJid, userNumber, reason, warnedBy } = req.body;
    if (!groupJid || !userNumber) return res.status(400).json({ success: false, message: 'Missing fields' });
    const db = readDB();
    const key = `${groupJid}::${userNumber}`;
    if (!db.stats.warnings[key]) db.stats.warnings[key] = { count: 0, history: [] };
    db.stats.warnings[key].count += 1;
    db.stats.warnings[key].history.push({ reason: reason || 'No reason', warnedBy, at: Date.now() });
    const maxWarnings = 3;
    writeDB(db);
    res.json({ success: true, warnings: db.stats.warnings[key].count, maxWarnings });
});

// ── Get warnings for a user ──────────────────────────────
app.get('/api/stats/warnings/:groupJid/:userNumber', (req, res) => {
    const db = readDB();
    const key = `${req.params.groupJid}::${req.params.userNumber}`;
    const record = db.stats.warnings[key] || { count: 0, history: [] };
    res.json({ success: true, warnings: record.count, maxWarnings: 3, history: record.history });
});

// ── Reset warnings for a user ──────────────────────────────
app.delete('/api/stats/warnings/:groupJid/:userNumber', (req, res) => {
    const db = readDB();
    const key = `${req.params.groupJid}::${req.params.userNumber}`;
    delete db.stats.warnings[key];
    writeDB(db);
    res.json({ success: true });
});

// ── Get full stats summary (for dashboard) ──────────────────────────────
app.get('/api/stats', (req, res) => {
    const db = readDB();
    const totalGroups = Object.keys(db.stats.groups).length;
    const totalKicks = db.stats.kicks.length;
    const totalWarnings = Object.values(db.stats.warnings).reduce((acc, w) => acc + w.count, 0);
    const totalUsers = Object.keys(db.users).length;
    const totalFlagged = db.flaggedStickers.length + db.flaggedHashes.length;
    res.json({
        success: true,
        totalGroups,
        totalKicks,
        totalWarnings,
        totalUsers,
        totalFlagged,
        pairingCode: db.stats.pairingCode,
        botNumber: db.stats.botNumber,
        groups: Object.entries(db.stats.groups).map(([jid, g]) => ({ jid, ...g })),
        recentKicks: db.stats.kicks.slice(-5).reverse()
    });
});

// ── Health check ──────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Anti-WA API] Running on port ${PORT}`);
});

module.exports = app;
