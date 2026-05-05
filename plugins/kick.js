const axios = require('axios');
const config = require('../settings/config');
const API_BASE = config.antiwa?.apiBase || 'http://localhost:3001/api';

module.exports = {
    command: 'kick',
    category: 'group',
    description: 'Remove a member from the group',
    owner: false,
    group: true,
    admin: true,

    execute: async (sock, m, { reply, isAdmins, isBotAdmins, isCreator, participants, sender }) => {
        if (!isAdmins && !isCreator) {
            return reply(`🚫 Only group admins can use this command.`);
        }
        if (!isBotAdmins) {
            return reply(`⚠️ Anti-WA bot must be an admin to kick members.`);
        }

        let target;
        if (m.quoted) {
            target = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            target = m.mentionedJid[0];
        }

        if (!target) {
            return reply(`❌ Please mention or reply to the member you want to remove.\n\nUsage: *.kick @member* or reply to their message with *.kick*`);
        }

        const isMember = participants.some(p => p.id === target);
        if (!isMember) {
            return reply(`❌ That user is not in this group.`);
        }

        const targetNum = target.split('@')[0];
        try {
            await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
            await reply(`✅ *Anti-WA* removed *+${targetNum}* from the group.`);

            axios.post(`${API_BASE}/stats/kick`, {
                groupJid: m.chat,
                kickedNumber: targetNum,
                kickedBy: sender.split('@')[0]
            }).catch(() => {});
        } catch (e) {
            await reply(`❌ Failed to remove member. Make sure the bot has admin rights.`);
        }
    }
};
