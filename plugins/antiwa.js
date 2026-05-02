const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

module.exports = {
    command: 'antiwa',
    category: 'tools',
    description: 'Anti-WA cyberbullying protection commands',
    owner: false,
    group: false,
    admin: false,

    execute: async (sock, m, { reply, isCreator, isAdmins, isBotAdmins, args, sender }) => {
        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'help') {
            await reply(
                `🛡️ *Anti-WA Protection*\n\n` +
                `Commands:\n` +
                `• *.antiwa link <code>* — Link your account using app code\n` +
                `• *.antiwa status* — Check bot protection status\n\n` +
                `To flag a sticker:\n` +
                `• Reply to any sticker with *.antiwa flag*\n\n` +
                `📱 Get the Anti-WA app to manage reports visually.`
            );
            return;
        }

        if (sub === 'status') {
            try {
                const res = await axios.get(`${API_BASE}/health`);
                await reply(
                    `🛡️ *Anti-WA Status*\n\n` +
                    `✅ API: Online\n` +
                    `🤖 Bot: Active\n` +
                    `⏱️ Time: ${res.data.time}`
                );
            } catch {
                await reply(`⚠️ Anti-WA API is currently offline.`);
            }
            return;
        }

        if (sub === 'link') {
            const code = args[1];
            if (!code || !/^\d{6}$/.test(code)) {
                await reply(`❌ Please provide your 6-digit code.\n\nExample: *.antiwa link 123456*`);
                return;
            }
            const whatsapp = sender.split('@')[0];
            try {
                const res = await axios.post(`${API_BASE}/verify-code`, { code, whatsapp });
                if (res.data.success) {
                    await reply(
                        `✅ *Account Linked Successfully!*\n\n` +
                        `Your WhatsApp is now connected to Anti-WA.\n` +
                        `You can now use the app to report abusive stickers.\n\n` +
                        `🛡️ Anti-WA is protecting this number.`
                    );
                }
            } catch (e) {
                const msg = e.response?.data?.message || 'Unknown error';
                if (msg === 'Code already used') {
                    await reply(`⚠️ This code has already been used. Generate a new one in the app.`);
                } else if (msg === 'Code expired') {
                    await reply(`⏱️ Your code expired. Please generate a new one in the Anti-WA app.`);
                } else if (msg === 'Invalid code') {
                    await reply(`❌ Invalid code. Please check and try again.`);
                } else {
                    await reply(`❌ Failed to link: ${msg}`);
                }
            }
            return;
        }

        if (sub === 'flag') {
            if (!isAdmins && !isCreator) {
                await reply(`❌ Only group admins can flag stickers.`);
                return;
            }
            const quoted = m.quoted;
            if (!quoted || quoted.mtype !== 'stickerMessage') {
                await reply(`❌ Please reply to a sticker with *.antiwa flag* to flag it.`);
                return;
            }
            try {
                const stream = await downloadContentFromMessage(quoted.msg, 'sticker');
                let buffer = Buffer.alloc(0);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                const crypto = require('crypto');
                const hash = crypto.createHash('sha256').update(buffer).digest('hex');
                const res = await axios.post(`${API_BASE}/flag-sticker-hash`, {
                    hash,
                    flaggedBy: sender.split('@')[0],
                    groupJid: m.chat,
                    description: 'Flagged via bot command'
                });
                if (res.data.success) {
                    await reply(`🚫 *Sticker Flagged!*\n\nThis sticker will now be automatically removed from all groups where Anti-WA is active.`);
                }
            } catch {
                await reply(`❌ Failed to flag sticker. Please try again.`);
            }
            return;
        }

        if (sub === 'unflag') {
            if (!isAdmins && !isCreator) {
                await reply(`❌ Only group admins can unflag stickers.`);
                return;
            }
            const quoted = m.quoted;
            if (!quoted || quoted.mtype !== 'stickerMessage') {
                await reply(`❌ Please reply to a sticker with *.antiwa unflag*.`);
                return;
            }
            try {
                const stream = await downloadContentFromMessage(quoted.msg, 'sticker');
                let buffer = Buffer.alloc(0);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                const crypto = require('crypto');
                const hash = crypto.createHash('sha256').update(buffer).digest('hex');
                await axios.delete(`${API_BASE}/flag-sticker-hash/${hash}`);
                await reply(`✅ Sticker unflagged. It will no longer be auto-removed.`);
            } catch {
                await reply(`❌ Failed to unflag sticker.`);
            }
            return;
        }

        await reply(`❓ Unknown sub-command. Use *.antiwa help* for usage.`);
    }
};

let downloadContentFromMessage;
(async () => {
    const baileys = await import('@whiskeysockets/baileys');
    downloadContentFromMessage = baileys.downloadContentFromMessage;
})();
