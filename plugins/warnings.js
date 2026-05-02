const axios = require('axios');
const API_BASE = 'http://localhost:3001/api';

module.exports = {
    command: 'warnings',
    category: 'group',
    description: 'Check warnings for a member',
    owner: false,
    group: true,
    admin: false,

    execute: async (sock, m, { reply, participants }) => {
        let target;

        if (m.quoted) {
            target = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            target = m.mentionedJid[0];
        } else {
            target = m.sender;
        }

        const targetNum = target.split('@')[0];
        try {
            const res = await axios.get(`${API_BASE}/stats/warnings/${m.chat}/${targetNum}`);
            const { warnings, maxWarnings, history } = res.data;
            const bar = '🟥'.repeat(warnings) + '⬜'.repeat(Math.max(0, maxWarnings - warnings));

            let text = `📋 *Warning Record*\n\n`;
            text += `User: *+${targetNum}*\n`;
            text += `Warnings: *${warnings}/${maxWarnings}*\n`;
            text += `Status: ${bar}\n\n`;

            if (history && history.length > 0) {
                text += `Recent:\n`;
                history.slice(-3).forEach((w, i) => {
                    text += `${i + 1}. ${w.reason} — ${new Date(w.at).toLocaleDateString()}\n`;
                });
            }

            await reply(text);
        } catch {
            await reply(`❌ Could not fetch warnings. Please try again.`);
        }
    }
};
