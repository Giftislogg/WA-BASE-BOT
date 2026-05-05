const axios = require('axios');
const config = require('../settings/config');
const API_BASE = config.antiwa?.apiBase || 'http://localhost:3001/api';

module.exports = {
    command: 'resetwarn',
    category: 'group',
    description: 'Reset warnings for a member',
    owner: false,
    group: true,
    admin: true,

    execute: async (sock, m, { reply, isAdmins, isCreator }) => {
        if (!isAdmins && !isCreator) {
            return reply(`🚫 Only group admins can reset warnings.`);
        }

        let target;
        if (m.quoted) {
            target = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            target = m.mentionedJid[0];
        }

        if (!target) {
            return reply(`❌ Please mention or reply to the member whose warnings you want to reset.`);
        }

        const targetNum = target.split('@')[0];
        try {
            await axios.delete(`${API_BASE}/stats/warnings/${m.chat}/${targetNum}`);
            await reply(`✅ Warnings for *+${targetNum}* have been reset.`);
        } catch {
            await reply(`❌ Failed to reset warnings.`);
        }
    }
};
