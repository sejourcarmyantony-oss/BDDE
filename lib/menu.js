const config = require('../config');
const { categories } = require('../commands/registry');
const os = require('os');

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function infoBlock() {
  const prefix = config.get('prefix');
  const now = new Date();
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const ramUsedGB = ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2);
  const ramTotalGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

  return (
    `╭─「 *${config.get('botName')}* 」\n` +
    `│ 👑 Owner : ${config.get('ownerName')}\n` +
    `│ ⏱️ Uptime : ${formatUptime(process.uptime())}\n` +
    `│ 🕐 Heure : ${now.toLocaleTimeString('fr-FR')}\n` +
    `│ 📅 Jour : ${days[now.getDay()]}\n` +
    `│ 💾 RAM : ${ramUsedGB} / ${ramTotalGB} GB\n` +
    `│ ⚙️ Prefix : [ ${prefix} ]\n` +
    `│ 📦 Commandes : ${totalCommandCount()}\n` +
    `│ 🌐 Mode : ${config.get('mode')}\n` +
    `╰────────────────`
  );
}

function totalCommandCount() {
  return Object.values(categories).reduce((sum, list) => sum + list.length, 0);
}

function fullMenu() {
  const prefix = config.get('prefix');
  let out = infoBlock() + '\n\n';

  const icons = {
    MAIN: '🏠', AI: '🤖', GROUP: '👥', STICKER: '🎨', DOWNLOADER: '⬇️',
    FUN: '🎮', TOOLS: '🔧', MUSIC: '🎵', OWNER: '👑', GAMES: '🎲',
    LOGO: '🖼️', BUG: '🐛', SECURITE: '🔒'
  };

  for (const [cat, cmds] of Object.entries(categories)) {
    out += `╭─「 ${icons[cat] || '📁'} *${cat}* 」\n`;
    for (const cmd of cmds) {
      out += `│ • ${prefix}${cmd.name}\n`;
    }
    out += `╰────────────────\n\n`;
  }

  out += `✨ *${config.get('ownerName')}* ✨\n`;
  out += `📞 Créateur : wa.me/${config.get('ownerNumber')}\n`;
  out += `📡 Chaîne : ${config.get('channelLink')}`;

  return out;
}

module.exports = { infoBlock, fullMenu, totalCommandCount, formatUptime };
