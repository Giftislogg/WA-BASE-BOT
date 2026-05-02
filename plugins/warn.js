const axios = require('axios');
const API_BASE = 'http://localhost:3001/api';
const MAX_WARNINGS = 3;

module.exports = {
    command: 'warn',
    category: 'group',
    description: 'Warn a member (auto-kick after max warnings)',
    owner: false,
    group: true,
    admin: true,

    execute: async (sock, m, { reply, isAdmins, isBotAdmins, isCreator, participants, sender }) => {
        if (!isAdmins && !isCreator) {
            return reply(`🚫 Only group admins can warn members.`);
        }

        let target;
        let reason = '';

        if (m.quoted) {
            target = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            target = m.mentionedJid[0];
            const args = m.text?.replace(m.mentionedJid[0], '').trim().split(/\s+/).slice(1).join(' ');
            reason = args || '';
        }

        if (!target) {
            return reply(`❌ Please mention or reply to the member you want to warn.\n\nUsage: *.warn @member <reason>*`);
        }

        const targetNum = target.split('@')[0];
        try {
            const res = await axios.post(`${API_BASE}/stats/warn`, {
                groupJid: m.chat,
                userNumber: targetNum,
                reason: reason || 'No reason provided',
                warnedBy: sender.split('@')[0]
            });

            const { warnings, maxWarnings } = res.data;

            if (warnings >= maxWarnings) {
                // Auto-kick
                if (isBotAdmins) {
                    await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
                    await reply(
                        `🚫 *Anti-WA Auto-Kick*\n\n` +
                        `*+${targetNum}* has been removed after *${maxWarnings} warnings*.\n\n` +
                        `Reason: ${reason || 'Repeated violations'}`
                    );
                    await axios.post(`${API_BASE}/stats/kick`, {
                        groupJid: m.chat,
                        kickedNumber: targetNum,
                        kickedBy: 'auto'
                    }).catch(() => {});
                } else {
                    await reply(
                        `⚠️ *Warning ${warnings}/${maxWarnings}* for *+${targetNum}*\n\n` +
                        `Reason: ${reason || 'Violation'}\n\n` +
                        `⚠️ Max warnings reached but bot lacks admin rights to kick.`
                    );
                }
            } else {
                await reply(
                    `⚠️ *Warning ${warnings}/${maxWarnings}* issued to *+${targetNum}*\n\n` +
                    `Reason: ${reason || 'Violation'}\n\n` +
                    `${maxWarnings - warnings} more warning(s) before auto-kick.`
                );
            }
        } catch {
            await reply(`❌ Failed to issue warning. Please try again.`);
        }
    }
};
