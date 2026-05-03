const fs = require('fs');

const config = {
    owner: "-",
    botNumber: "-",
    setPair: "ANTIWA1",
    thumbUrl: "https://i.imgur.com/IkEv97P.jpeg",
    session: "sessions",
    status: {
        public: true,
        terminal: true,
        reactsw: false
    },
    message: {
        owner: "no, this is for owners only",
        group: "this is for groups only",
        admin: "this command is for admin only",
        private: "this is specifically for private chat"
    },
    mess: {
        owner: 'This command is only for the bot owner!',
        done: 'Done successfully!',
        error: 'Something went wrong!',
        wait: 'Please wait...'
    },
    settings: {
        title: "Anti-WA",
        packname: 'Anti-WA',
        description: "Anti-WA: Stop Cyber Bullying on WhatsApp",
        author: 'https://github.com/OfficialKango',
        footer: "Anti-WA | Stop Cyber Bullying"
    },
    newsletter: {
        name: "Anti-WA",
        id: "0@newsletter"
    },
    api: {
        baseurl: "https://hector-api.vercel.app/",
        apikey: "hector"
    },
    sticker: {
        packname: "Anti-WA",
        author: "Anti-WA Bot"
    },
    antiwa: {
        maxWarnings: 3,
        apiBase: "http://127.0.0.1:3001/api"
    }
};

module.exports = config;

let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
    require('fs').unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
    delete require.cache[file];
    require(file);
});
