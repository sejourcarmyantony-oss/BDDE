const fs = require('fs');
const path = require('path');
const config = require('../config');

const REPLIES_PATH = path.join(__dirname, '..', 'autoreplies.json');
function loadReplies() {
  if (!fs.existsSync(REPLIES_PATH)) fs.writeFileSync(REPLIES_PATH, '{}');
  try { return JSON.parse(fs.readFileSync(REPLIES_PATH, 'utf-8')); } catch { return {}; }
}
function saveReplies(r) { fs.writeFileSync(REPLIES_PATH, JSON.stringify(r, null, 2)); }

module.exports = [
  {
    name: 'broadcast',
    description: 'Envoie un message à tous les groupes où le bot est présent (owner)',
    run: async ({ reply, isOwner, sock, text }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      if (!text) return reply('❓ Utilisation : .broadcast <message>');
      const groups = await sock.groupFetchAllParticipating();
      let count = 0;
      for (const jid of Object.keys(groups)) {
        try { await sock.sendMessage(jid, { text: `📢 *Diffusion*\n\n${text}` }); count++; } catch {}
      }
      reply(`✅ Message envoyé à ${count} groupe(s).`);
    }
  },
  {
    name: 'broadcaster',
    description: 'Alias de broadcast',
    run: async (ctx) => module.exports.find(c => c.name === 'broadcast').run(ctx)
  },
  {
    name: 'broadcast-all',
    description: 'Alias de broadcast',
    run: async (ctx) => module.exports.find(c => c.name === 'broadcast').run(ctx)
  },
  {
    name: 'setbotname',
    description: 'Change le nom affiché du bot (owner)',
    run: async ({ reply, isOwner, args, sock }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      if (!args[0]) return reply('❓ Utilisation : .setbotname <nom>');
      const name = args.join(' ');
      config.set('botName', name);
      try { await sock.updateProfileName(name); } catch {}
      reply(`✅ Nom du bot changé : ${name}`);
    }
  },
  {
    name: 'setbotimg',
    description: 'Explique comment changer la photo du bot (owner)',
    run: async ({ reply, isOwner }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      reply('🖼️ Réponds à une image avec .setbotimg pour changer la photo du bot (implémentation : voir sock.updateProfilePicture dans index.js).');
    }
  },
  {
    name: 'sudoadd',
    description: 'Ajoute un co-admin du bot (owner)',
    run: async ({ reply, isOwner, mentioned, args }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      const target = mentioned[0] || (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply('❓ Mentionne ou donne un numéro.');
      const sudo = config.get('sudo') || [];
      if (!sudo.includes(target)) sudo.push(target);
      config.set('sudo', sudo);
      reply('✅ Ajouté aux sudo.');
    }
  },
  {
    name: 'delsudo',
    description: 'Retire un co-admin du bot (owner)',
    run: async ({ reply, isOwner, mentioned, args }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      const target = mentioned[0] || (args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply('❓ Mentionne ou donne un numéro.');
      config.set('sudo', (config.get('sudo') || []).filter(j => j !== target));
      reply('✅ Retiré des sudo.');
    }
  },
  {
    name: 'listsudo',
    description: 'Liste les co-admins du bot',
    run: async ({ reply }) => {
      const sudo = config.get('sudo') || [];
      reply(sudo.length ? '👑 Sudo :\n' + sudo.map(j => `- ${j.split('@')[0]}`).join('\n') : 'Aucun sudo configuré.');
    }
  },
  {
    name: 'block',
    description: 'Bloque un numéro (owner)',
    run: async ({ reply, isOwner, sock, mentioned }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      if (!mentioned.length) return reply('❓ Mentionne ou réponds à la personne.');
      await sock.updateBlockStatus(mentioned[0], 'block');
      reply('✅ Utilisateur bloqué.');
    }
  },
  {
    name: 'unblock',
    description: 'Débloque un numéro (owner)',
    run: async ({ reply, isOwner, sock, mentioned }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      if (!mentioned.length) return reply('❓ Mentionne ou réponds à la personne.');
      await sock.updateBlockStatus(mentioned[0], 'unblock');
      reply('✅ Utilisateur débloqué.');
    }
  },
  {
    name: 'addreply',
    description: 'Ajoute une réponse automatique. Ex: .addreply bonjour | Salut !',
    run: async ({ reply, isOwner, text }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      const [key, val] = (text || '').split('|').map(s => s && s.trim());
      if (!key || !val) return reply('❓ Utilisation : .addreply <mot> | <réponse>');
      const replies = loadReplies();
      replies[key.toLowerCase()] = val;
      saveReplies(replies);
      reply(`✅ Réponse automatique ajoutée pour "${key}".`);
    }
  },
  {
    name: 'delreply',
    description: 'Supprime une réponse automatique',
    run: async ({ reply, isOwner, args }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      if (!args[0]) return reply('❓ Utilisation : .delreply <mot>');
      const replies = loadReplies();
      delete replies[args[0].toLowerCase()];
      saveReplies(replies);
      reply('✅ Supprimé.');
    }
  },
  {
    name: 'listreply',
    description: 'Liste les réponses automatiques',
    run: async ({ reply }) => {
      const replies = loadReplies();
      const keys = Object.keys(replies);
      reply(keys.length ? '💬 Mots-clés : ' + keys.join(', ') : 'Aucune réponse automatique configurée.');
    }
  },
  {
    name: 'keyword-reply',
    description: 'Alias de addreply',
    run: async (ctx) => module.exports.find(c => c.name === 'addreply').run(ctx)
  },
  {
    name: 'status',
    description: 'État du serveur hébergeant le bot',
    run: async ({ reply }) => {
      const os = require('os');
      reply(
        `📊 *Statut serveur*\n` +
        `RAM libre : ${(os.freemem() / 1024 / 1024).toFixed(0)} MB\n` +
        `RAM totale : ${(os.totalmem() / 1024 / 1024).toFixed(0)} MB\n` +
        `Uptime process : ${Math.floor(process.uptime())}s\n` +
        `Node.js : ${process.version}`
      );
    }
  },
  {
    name: 'restart',
    description: 'Redémarre le bot (owner — nécessite un gestionnaire de process comme Render qui relance automatiquement)',
    run: async ({ reply, isOwner }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      await reply('🔄 Redémarrage...');
      process.exit(0); // Render relance automatiquement le service
    }
  },
  {
    name: 'shutdown',
    description: 'Arrête le bot (owner)',
    run: async ({ reply, isOwner }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      await reply('🛑 Arrêt du bot.');
      process.exit(0);
    }
  },
  {
    name: 'leave-group',
    description: 'Fait quitter le bot du groupe actuel (owner)',
    run: async ({ reply, isOwner, isGroup, sock, groupJid }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      if (!isGroup) return reply('❌ Utilisable uniquement en groupe.');
      await reply('👋 À bientôt !');
      await sock.groupLeave(groupJid);
    }
  },
  {
    name: 'clear-chat',
    description: 'Vide le cache de conversation local du bot',
    run: async ({ reply, isOwner }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      reply('🧹 Cache local vidé (aucune donnée persistante de conversation n\'était stockée).');
    }
  },
  {
    name: 'block-user',
    description: 'Ajoute un utilisateur à la liste noire des commandes du bot (owner)',
    run: async ({ reply, isOwner, mentioned }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      if (!mentioned.length) return reply('❓ Mentionne ou réponds à la personne.');
      const banned = config.get('bannedUsers') || [];
      if (!banned.includes(mentioned[0])) banned.push(mentioned[0]);
      config.set('bannedUsers', banned);
      reply('✅ Utilisateur ajouté à la liste noire du bot.');
    }
  },
  {
    name: 'ban',
    description: "Bannit un membre du groupe (admin) ou l'ajoute à la liste noire du bot",
    run: async ({ reply, isGroup, isBotAdmin, isSenderAdmin, sock, groupJid, mentioned }) => {
      if (!mentioned.length) return reply('❓ Mentionne ou réponds à la personne.');
      const banned = config.get('bannedUsers') || [];
      if (!banned.includes(mentioned[0])) banned.push(mentioned[0]);
      config.set('bannedUsers', banned);
      if (isGroup && isSenderAdmin && isBotAdmin) {
        await sock.groupParticipantsUpdate(groupJid, [mentioned[0]], 'remove');
      }
      reply('🚫 Utilisateur banni.');
    }
  },
  {
    name: 'unban',
    description: 'Retire un utilisateur de la liste noire du bot',
    run: async ({ reply, mentioned }) => {
      if (!mentioned.length) return reply('❓ Mentionne ou réponds à la personne.');
      config.set('bannedUsers', (config.get('bannedUsers') || []).filter(j => j !== mentioned[0]));
      reply('✅ Utilisateur débanni.');
    }
  },
  {
    name: 'banlist',
    description: 'Liste les utilisateurs bannis',
    run: async ({ reply }) => {
      const banned = config.get('bannedUsers') || [];
      reply(banned.length ? '🚫 Bannis :\n' + banned.map(j => `- ${j.split('@')[0]}`).join('\n') : 'Aucun banni.');
    }
  },
  {
    name: 'schedule',
    description: "Planifie l'envoi d'un message. Ex: .schedule 10m Bonjour",
    run: async ({ reply, sock, chatJid, args }) => {
      if (args.length < 2) return reply('❓ Utilisation : .schedule <durée ex:10m|2h> <message>');
      const match = args[0].match(/^(\d+)(s|m|h)$/);
      if (!match) return reply('❓ Format de durée invalide. Exemples : 30s, 10m, 2h');
      const value = parseInt(match[1]);
      const unit = { s: 1000, m: 60000, h: 3600000 }[match[2]];
      const delay = value * unit;
      const msg = args.slice(1).join(' ');
      reply(`⏰ Message programmé dans ${args[0]}.`);
      setTimeout(() => { sock.sendMessage(chatJid, { text: `⏰ *Rappel programmé*\n\n${msg}` }); }, delay);
    }
  },
  {
    name: 'webhook-link',
    description: 'Configure une URL pour relayer les messages reçus (owner)',
    run: async ({ reply, isOwner, args }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      if (!args[0]) return reply('❓ Utilisation : .webhook-link <URL>');
      config.set('webhookUrl', args[0]);
      reply('✅ Webhook configuré : ' + args[0]);
    }
  },
  {
    name: 'bridge',
    description: 'Relaye les messages entre deux groupes que tu administres (owner)',
    run: async ({ reply, isOwner }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      reply('🔧 bridge nécessite de préciser les deux ID de groupe. Utilisation : .bridge <id_groupe_A> <id_groupe_B> — implémentation à activer dans index.js (relai des messages entrants).');
    }
  }
];
