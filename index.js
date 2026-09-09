require('dotenv').config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const express = require('express');
const readline = require('readline');

const config = require('./config');
const { flat: commands } = require('./commands/registry');
const { fullMenu } = require('./lib/menu');

const SESSION_DIR = path.join(__dirname, 'session');
const logger = pino({ level: 'silent' });

// ---------------------------------------------------------------
// Petit serveur HTTP : obligatoire sur Render (Web Service) pour
// que la plateforme considère le service comme "en ligne".
// ---------------------------------------------------------------
const app = express();
app.get('/', (req, res) => res.send('✅ Shadow Bot est en ligne.'));
app.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Serveur HTTP de statut démarré sur le port ${process.env.PORT || 3000}`);
});

function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ['Shadow Bot', 'Chrome', '1.0.0']
  });

  // ---- Connexion par code de pairing (pas de QR) ----
  if (!sock.authState.creds.registered) {
    const phone = process.env.OWNER_PHONE || await askQuestion('📱 Entre le numéro WhatsApp du bot (avec indicatif, ex: 50931277118) : ');
    try {
      const code = await sock.requestPairingCode(phone.replace(/\D/g, ''));
      console.log(`\n🔗 Code de pairing : ${code}\n`);
      console.log('👉 Ouvre WhatsApp > Appareils liés > Lier un appareil > Lier avec un numéro de téléphone, puis entre ce code.\n');
    } catch (e) {
      console.error('❌ Impossible de générer le code de pairing :', e.message);
    }
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('✅ Shadow Bot connecté et prêt !');
      // Applique la photo de profil fournie une seule fois (marqueur .picset)
      const marker = path.join(SESSION_DIR, '.picset');
      const picPath = path.join(__dirname, 'media', 'botpic.jpg');
      if (!fs.existsSync(marker) && fs.existsSync(picPath)) {
        try {
          await sock.updateProfilePicture(sock.user.id, { url: picPath });
          fs.writeFileSync(marker, 'done');
          console.log('🖼️ Photo de profil appliquée.');
        } catch (e) {
          console.error('⚠️ Impossible de définir la photo de profil :', e.message);
        }
      }
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('⚠️ Connexion fermée.', statusCode, shouldReconnect ? '→ reconnexion...' : '→ déconnecté définitivement, supprime le dossier session/ pour relier le bot.');
      if (shouldReconnect) startBot().catch(err => console.error('Erreur au redémarrage :', err));
    }
  });

  // ---- Données de modération persistées par commands/group.js ----
  const groupdataPath = path.join(__dirname, 'groupdata.json');
  function loadGroupData() {
    if (!fs.existsSync(groupdataPath)) return {};
    try { return JSON.parse(fs.readFileSync(groupdataPath, 'utf-8')); } catch { return {}; }
  }
  function saveGroupData(d) { fs.writeFileSync(groupdataPath, JSON.stringify(d, null, 2)); }

  const autorepliesPath = path.join(__dirname, 'autoreplies.json');
  function loadAutoReplies() {
    if (!fs.existsSync(autorepliesPath)) return {};
    try { return JSON.parse(fs.readFileSync(autorepliesPath, 'utf-8')); } catch { return {}; }
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    try {
      await handleMessage(sock, msg, { loadGroupData, saveGroupData, loadAutoReplies });
    } catch (err) {
      console.error('❌ Erreur en traitant un message :', err);
      try {
        await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Une erreur est survenue en exécutant cette commande. Elle a été notée dans les logs du serveur.' });
      } catch {}
    }
  });

  return sock;
}

function getMessageText(message) {
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    ''
  );
}

async function handleMessage(sock, msg, { loadGroupData, saveGroupData, loadAutoReplies }) {
  const chatJid = msg.key.remoteJid;
  const isGroup = chatJid.endsWith('@g.us');
  const sender = isGroup ? msg.key.participant : chatJid;
  const bodyMessage = msg.message.viewOnceMessageV2?.message || msg.message.viewOnceMessage?.message || msg.message;
  const text = getMessageText(bodyMessage);
  const prefix = config.get('prefix');

  const ownerJid = config.get('ownerNumber') + '@s.whatsapp.net';
  const sudo = config.get('sudo') || [];
  const isOwner = sender === ownerJid || sudo.includes(sender);
  const bannedUsers = config.get('bannedUsers') || [];
  if (bannedUsers.includes(sender)) return;

  // ---- Modération passive (anti-lien / liste noire de mots / suivi d'activité) ----
  if (isGroup) {
    const data = loadGroupData();
    const g = data[chatJid];
    if (g) {
      g.lastSeen = g.lastSeen || {};
      g.lastSeen[sender] = Date.now();
      saveGroupData(data);

      const linkRegex = /(https?:\/\/|chat\.whatsapp\.com|wa\.me)/i;
      if (g.antilink && linkRegex.test(text) && !text.startsWith(prefix)) {
        try {
          await sock.sendMessage(chatJid, { delete: msg.key });
          await sock.sendMessage(chatJid, { text: `🔗 Lien supprimé (anti-lien actif) — @${sender.split('@')[0]}`, mentions: [sender] });
        } catch {}
        return;
      }
      if (g.blacklist?.length && g.blacklist.some(w => text.toLowerCase().includes(w))) {
        try {
          await sock.sendMessage(chatJid, { delete: msg.key });
          await sock.sendMessage(chatJid, { text: `🚫 Message supprimé (mot interdit) — @${sender.split('@')[0]}`, mentions: [sender] });
        } catch {}
        return;
      }
    }
  }

  if (!text.startsWith(prefix)) {
    // Pas une commande : vérifier les réponses automatiques par mot-clé
    const replies = loadAutoReplies();
    const lower = text.toLowerCase().trim();
    if (replies[lower]) {
      await sock.sendMessage(chatJid, { text: replies[lower] }, { quoted: msg });
    }
    return;
  }

  const withoutPrefix = text.slice(prefix.length).trim();
  const [cmdName, ...args] = withoutPrefix.split(/\s+/);
  const command = commands[cmdName?.toLowerCase()];
  if (!command) return;

  const argText = args.join(' ');
  const mentioned = bodyMessage.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const quotedParticipant = bodyMessage.extendedTextMessage?.contextInfo?.participant;
  if (quotedParticipant && !mentioned.includes(quotedParticipant)) mentioned.push(quotedParticipant);

  let isBotAdmin = false, isSenderAdmin = false, groupJid = null;
  if (isGroup) {
    groupJid = chatJid;
    try {
      const meta = await sock.groupMetadata(chatJid);
      const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      isBotAdmin = meta.participants.some(p => p.id === botId && p.admin);
      isSenderAdmin = meta.participants.some(p => p.id === sender && p.admin) || isOwner;
    } catch {}
  }

  const isViewOnceQuoted = !!(
    bodyMessage.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessage ||
    bodyMessage.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessageV2
  );

  async function downloadQuoted() {
    const quoted = bodyMessage.extendedTextMessage?.contextInfo?.quotedMessage;
    const target = quoted?.viewOnceMessage?.message || quoted?.viewOnceMessageV2?.message || quoted;
    if (!target) return null;
    try {
      return await downloadMediaMessage({ message: target, key: msg.key }, 'buffer', {});
    } catch (e) {
      console.error('Erreur téléchargement média :', e.message);
      return null;
    }
  }

  async function reply(content) {
    const footer = config.get('footerTag');
    if (typeof content === 'string') {
      const withFooter = `${content}\n\n${footer}`;
      return sock.sendMessage(chatJid, { text: withFooter }, { quoted: msg });
    }
    // objets média (sticker, image, audio, video, document...) : pas de footer ajouté au binaire
    return sock.sendMessage(chatJid, content, { quoted: msg });
  }

  const ctx = {
    sock, msg, reply, text: argText, args, mentioned,
    isGroup, groupJid, chatJid, sender,
    isOwner, isBotAdmin, isSenderAdmin,
    isViewOnceQuoted, downloadQuoted,
    ownerName: config.get('ownerName')
  };

  await command.run(ctx);
}

startBot().catch(err => {
  console.error('❌ Erreur fatale au démarrage :', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => console.error('⚠️ Rejection non gérée :', err));
process.on('uncaughtException', (err) => console.error('⚠️ Exception non capturée :', err));
