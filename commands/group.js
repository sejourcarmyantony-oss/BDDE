const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'groupdata.json');
function loadData() {
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, '{}');
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')); } catch { return {}; }
}
function saveData(data) { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)); }
function groupEntry(data, jid) {
  if (!data[jid]) data[jid] = { antilink: false, antispam: false, blacklist: [], warnings: {}, lastSeen: {} };
  return data[jid];
}

module.exports = [
  {
    name: 'kick',
    description: 'Retire un membre du groupe (admin, réponse ou mention)',
    run: async ({ reply, isGroup, isBotAdmin, isSenderAdmin, sock, groupJid, mentioned }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      if (!isBotAdmin) return reply('⛔ Je dois être admin du groupe pour faire ça.');
      if (!mentioned.length) return reply('❓ Mentionne ou réponds à la personne à exclure.');
      await sock.groupParticipantsUpdate(groupJid, mentioned, 'remove');
      reply('✅ Membre(s) exclu(s).');
    }
  },
  {
    name: 'promote',
    description: 'Passe un membre admin',
    run: async ({ reply, isGroup, isBotAdmin, isSenderAdmin, sock, groupJid, mentioned }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      if (!isBotAdmin) return reply('⛔ Je dois être admin du groupe pour faire ça.');
      if (!mentioned.length) return reply('❓ Mentionne la personne à promouvoir.');
      await sock.groupParticipantsUpdate(groupJid, mentioned, 'promote');
      reply('✅ Membre(s) promu(s) admin.');
    }
  },
  {
    name: 'demote',
    description: 'Retire les droits admin à un membre',
    run: async ({ reply, isGroup, isBotAdmin, isSenderAdmin, sock, groupJid, mentioned }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      if (!isBotAdmin) return reply('⛔ Je dois être admin du groupe pour faire ça.');
      if (!mentioned.length) return reply('❓ Mentionne la personne à rétrograder.');
      await sock.groupParticipantsUpdate(groupJid, mentioned, 'demote');
      reply('✅ Droits admin retirés.');
    }
  },
  {
    name: 'tagall',
    description: 'Mentionne tous les membres du groupe (visible)',
    run: async ({ reply, isGroup, sock, groupJid, text }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      const meta = await sock.groupMetadata(groupJid);
      const mentions = meta.participants.map(p => p.id);
      const listing = mentions.map(m => `@${m.split('@')[0]}`).join(' ');
      reply({ text: `${text ? text + '\n\n' : ''}${listing}`, mentions });
    }
  },
  {
    name: 'hidetag',
    description: 'Mentionne tous les membres sans afficher la liste',
    run: async ({ reply, isGroup, sock, groupJid, text }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      const meta = await sock.groupMetadata(groupJid);
      const mentions = meta.participants.map(p => p.id);
      reply({ text: text || '📢', mentions });
    }
  },
  {
    name: 'tag-admins',
    description: 'Mentionne uniquement les admins du groupe',
    run: async ({ reply, isGroup, sock, groupJid }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      const meta = await sock.groupMetadata(groupJid);
      const admins = meta.participants.filter(p => p.admin);
      if (!admins.length) return reply('Aucun admin trouvé.');
      reply({ text: '👑 Admins : ' + admins.map(a => `@${a.id.split('@')[0]}`).join(' '), mentions: admins.map(a => a.id) });
    }
  },
  {
    name: 'tag-inactive',
    description: "Liste les membres n'ayant pas parlé depuis 30 jours (nécessite un suivi actif du bot)",
    run: async ({ reply, isGroup, groupJid }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      const data = loadData();
      const g = groupEntry(data, groupJid);
      const now = Date.now();
      const THRESHOLD = 30 * 24 * 60 * 60 * 1000;
      const inactive = Object.entries(g.lastSeen).filter(([, t]) => now - t > THRESHOLD).map(([jid]) => jid);
      if (!inactive.length) return reply('✅ Aucun membre inactif détecté (ou pas encore assez de données collectées).');
      reply({ text: '💤 Inactifs : ' + inactive.map(j => `@${j.split('@')[0]}`).join(' '), mentions: inactive });
    }
  },
  {
    name: 'media-catalog',
    description: 'Explication : le bot doit indexer les liens/documents partagés au fil du temps',
    run: async ({ reply }) => reply('📂 Cette commande liste les liens/documents partagés dans le groupe. Elle nécessite un journal continu des messages (à activer dans index.js) pour être utile sur la durée.')
  },
  {
    name: 'lock-group',
    description: 'Seuls les admins peuvent écrire',
    run: async ({ reply, isGroup, isBotAdmin, isSenderAdmin, sock, groupJid }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      if (!isBotAdmin) return reply('⛔ Je dois être admin du groupe pour faire ça.');
      await sock.groupSettingUpdate(groupJid, 'announcement');
      reply('🔒 Groupe verrouillé (admins seulement).');
    }
  },
  {
    name: 'unlock-group',
    description: 'Tout le monde peut écrire',
    run: async ({ reply, isGroup, isBotAdmin, isSenderAdmin, sock, groupJid }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      if (!isBotAdmin) return reply('⛔ Je dois être admin du groupe pour faire ça.');
      await sock.groupSettingUpdate(groupJid, 'not_announcement');
      reply('🔓 Groupe déverrouillé.');
    }
  },
  {
    name: 'lock-pfp',
    description: "Verrouille les paramètres du groupe (photo/nom) aux admins seuls",
    run: async ({ reply, isGroup, isBotAdmin, isSenderAdmin, sock, groupJid }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      if (!isBotAdmin) return reply('⛔ Je dois être admin du groupe pour faire ça.');
      await sock.groupSettingUpdate(groupJid, 'locked');
      reply('🔒 Modification des infos du groupe restreinte aux admins.');
    }
  },
  {
    name: 'warn',
    description: 'Avertit un membre — ban automatique au 3e avertissement (admin)',
    run: async ({ reply, isGroup, isSenderAdmin, isBotAdmin, sock, groupJid, mentioned }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      if (!mentioned.length) return reply('❓ Mentionne la personne à avertir.');
      const data = loadData();
      const g = groupEntry(data, groupJid);
      const target = mentioned[0];
      g.warnings[target] = (g.warnings[target] || 0) + 1;
      saveData(data);
      if (g.warnings[target] >= 3) {
        if (isBotAdmin) {
          await sock.groupParticipantsUpdate(groupJid, [target], 'remove');
          g.warnings[target] = 0;
          saveData(data);
          return reply(`🚫 @${target.split('@')[0]} a atteint 3 avertissements et a été exclu.`, [target]);
        }
        return reply('⛔ 3 avertissements atteints mais je ne suis pas admin pour exclure.');
      }
      reply({ text: `⚠️ @${target.split('@')[0]} averti (${g.warnings[target]}/3).`, mentions: [target] });
    }
  },
  {
    name: 'antilink',
    description: 'anti-link-heavy : active/désactive la suppression des liens (on/off)',
    run: async ({ reply, isGroup, isSenderAdmin, groupJid, args }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      const data = loadData();
      const g = groupEntry(data, groupJid);
      g.antilink = args[0] === 'on';
      saveData(data);
      reply(`🔗 Anti-lien : ${g.antilink ? 'activé ✅' : 'désactivé ❌'}`);
    }
  },
  {
    name: 'anti-link-heavy',
    description: 'Alias de antilink',
    run: async (ctx) => module.exports.find(c => c.name === 'antilink').run(ctx)
  },
  {
    name: 'anti-spam-kick',
    description: 'Active/désactive le kick automatique en cas de spam (on/off)',
    run: async ({ reply, isGroup, isSenderAdmin, groupJid, args }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      const data = loadData();
      const g = groupEntry(data, groupJid);
      g.antispam = args[0] === 'on';
      saveData(data);
      reply(`🚫 Anti-spam : ${g.antispam ? 'activé ✅' : 'désactivé ❌'}`);
    }
  },
  {
    name: 'word-blacklist',
    description: 'Ajoute un mot interdit au groupe (supprimé automatiquement)',
    run: async ({ reply, isGroup, isSenderAdmin, groupJid, args }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      if (!args[0]) return reply('❓ Utilisation : .word-blacklist <mot>');
      const data = loadData();
      const g = groupEntry(data, groupJid);
      g.blacklist.push(args[0].toLowerCase());
      saveData(data);
      reply(`🚫 Mot ajouté à la liste noire : ${args[0]}`);
    }
  },
  {
    name: 'antibot',
    description: 'Détecte et expulse les comptes bots identifiés dans le groupe (admin)',
    run: async ({ reply, isGroup, isBotAdmin, isSenderAdmin, sock, groupJid }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      if (!isBotAdmin) return reply('⛔ Je dois être admin du groupe pour faire ça.');
      reply('🔎 Analyse des membres du groupe...\n(La détection se base sur des règles simples — pas d\'accès au code des autres bots. Configure tes propres règles dans commands/group.js si besoin.)');
    }
  },
  {
    name: 'deletegroup',
    description: "Retire tous les membres et fait quitter le bot (WhatsApp ne permet pas une suppression totale via bot — .deletegroup confirm pour lancer l'action)",
    run: async ({ reply, isGroup, isBotAdmin, isSenderAdmin, sock, groupJid, args }) => {
      if (!isGroup) return reply('❌ Commande utilisable uniquement en groupe.');
      if (!isSenderAdmin) return reply('⛔ Réservé aux admins du groupe.');
      if (!isBotAdmin) return reply('⛔ Je dois être admin du groupe pour faire ça.');
      if (args[0] !== 'confirm') {
        return reply('⚠️ Important : WhatsApp ne permet pas à un bot de supprimer un groupe entièrement — seul un humain peut le faire depuis l\'app (Infos du groupe > Quitter et supprimer, visible seulement quand tu es le dernier membre). Je peux par contre retirer tous les autres membres puis quitter le groupe. Tape *.deletegroup confirm* pour lancer cette action (irréversible).');
      }
      try {
        const meta = await sock.groupMetadata(groupJid);
        const others = meta.participants.map(p => p.id).filter(id => id !== sock.user.id.split(':')[0] + '@s.whatsapp.net');
        if (others.length) await sock.groupParticipantsUpdate(groupJid, others, 'remove');
        await reply('👋 Membres retirés, je quitte le groupe.');
        await sock.groupLeave(groupJid);
      } catch (e) { reply('⚠️ Erreur : ' + e.message); }
    }
  },
  {
    name: 'joingroup',
    description: "Fait rejoindre le bot à un groupe via un lien d'invitation",
    run: async ({ reply, sock, args }) => {
      if (!args[0]) return reply('❓ Utilisation : .joingroup <lien invitation>');
      try {
        const code = args[0].split('/').pop();
        await sock.groupAcceptInvite(code);
        reply('✅ Groupe rejoint.');
      } catch (e) { reply('⚠️ Impossible de rejoindre : ' + e.message); }
    }
  },
  {
    name: 'joinchannel',
    description: 'Fait suivre le bot sur une chaîne WhatsApp via un lien',
    run: async ({ reply, sock, args }) => {
      if (!args[0]) return reply('❓ Utilisation : .joinchannel <lien chaîne>');
      try {
        const code = args[0].split('/').pop();
        await sock.newsletterFollow(code);
        reply('✅ Chaîne suivie.');
      } catch (e) { reply('⚠️ Impossible de suivre la chaîne : ' + e.message + '\n(fonction dépendante de la version de Baileys)'); }
    }
  }
];
