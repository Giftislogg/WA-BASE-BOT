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
        const init = { codes: {}, users: {}, flaggedStickers: [], flaggedHashes: [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(init, null, 2));
        return init;
    }
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!db.flaggedHashes) db.flaggedHashes = [];
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

// ── Code verification (called by bot when user sends code in WA) ──
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

// ── Flag sticker via image upload (from app) ──────────────────────────────
app.post('/api/flag-sticker', upload.single('image'), (req, res) => {
    const { sessionId, description } = req.body;
    if (!sessionId || !req.file) return res.status(400).json({ success: false, message: 'Missing data' });
    const db = readDB();
    const user = Object.values(db.users).find(u => u.sessionId === sessionId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const sticker = {
        id: crypto.randomBytes(8).toString('hex'),
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        description: description || '',
        reportedBy: user.sessionId,
        reportedAt: Date.now(),
        removed: false
    };
    db.flaggedStickers.push(sticker);
    writeDB(db);
    res.json({ success: true, sticker });
});

// ── Get all flagged stickers (image reports) ──────────────────────────────
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

// ── Flag sticker by hash (from bot .antiwa flag command) ──────────────────
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

// ── Get all flagged hashes (used by bot for sticker matching) ──────────────
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

// ── Health check ──────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, 'localhost', () => {
    console.log(`[Anti-WA API] Running on port ${PORT}`);
});

module.exports = app;
