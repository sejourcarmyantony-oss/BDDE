const config = require('../config');

module.exports = [
  {
    name: 'menu',
    description: 'Affiche le menu complet',
    run: async ({ reply }) => {
      const { fullMenu } = require('../lib/menu');
      reply(fullMenu());
    }
  },
  {
    name: 'help',
    description: "Alias de menu",
    run: async ({ reply }) => {
      const { fullMenu } = require('../lib/menu');
      reply(fullMenu());
    }
  },
  {
    name: 'ping',
    description: 'Vérifie la latence du bot',
    run: async ({ reply }) => {
      const start = Date.now();
      await reply('🏓 Ping...');
      const ms = Date.now() - start;
      reply(`🏓 Pong ! ${ms}ms`);
    }
  },
  {
    name: 'alive',
    description: 'Vérifie que le bot est en ligne',
    run: async ({ reply }) => {
      const { infoBlock } = require('../lib/menu');
      reply(`✅ ${config.get('botName')} est en ligne !\n\n` + infoBlock());
    }
  },
  {
    name: 'runtime',
    description: "Temps d'activité du bot",
    run: async ({ reply }) => {
      const { formatUptime } = require('../lib/menu');
      reply(`⏱️ Runtime : ${formatUptime(process.uptime())}`);
    }
  },
  {
    name: 'uptime',
    description: 'Alias de runtime',
    run: async ({ reply }) => {
      const { formatUptime } = require('../lib/menu');
      reply(`⏱️ Uptime : ${formatUptime(process.uptime())}`);
    }
  },
  {
    name: 'setprefix',
    description: 'Change le préfixe des commandes (owner)',
    run: async ({ reply, args, isOwner }) => {
      if (!isOwner) return reply('⛔ Seul le créateur peut changer le préfixe.');
      if (!args[0]) return reply('❓ Utilisation : .setprefix <nouveau_prefix>');
      config.set('prefix', args[0]);
      reply(`✅ Préfixe changé pour : ${args[0]}`);
    }
  },
  {
    name: 'setmenustyle',
    description: 'Change le style du menu (à personnaliser)',
    run: async ({ reply }) => {
      reply('🎨 Un seul style de menu est disponible pour le moment. D\'autres styles pourront être ajoutés dans lib/menu.js.');
    }
  },
  {
    name: 'repo',
    description: 'Lien du code source',
    run: async ({ reply }) => {
      reply(`📦 Code du bot développé par ${config.get('ownerName')}.`);
    }
  },
  {
    name: 'owner',
    description: 'Contact du créateur',
    run: async ({ reply }) => {
      reply(`👑 Créateur : ${config.get('ownerName')}\n📞 wa.me/${config.get('ownerNumber')}`);
    }
  },
  {
    name: 'autobio',
    description: 'Active une bio automatique qui affiche le runtime (owner)',
    run: async ({ reply, isOwner }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      reply('🔧 autobio : mets à jour périodiquement le statut du compte. Implémentation à activer dans index.js avec setInterval + sock.updateProfileStatus().');
    }
  },
  {
    name: 'pair',
    description: 'Explique comment connecter le bot via code de pairing',
    run: async ({ reply }) => {
      reply('🔗 Pour connecter le bot : lance-le (npm start), entre ton numéro WhatsApp quand demandé dans les logs, puis saisis le code de pairing reçu dans WhatsApp > Appareils liés.');
    }
  },
  {
    name: 'pairsessions',
    description: 'Liste les sessions actives (owner)',
    run: async ({ reply, isOwner }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      const fs = require('fs');
      const path = require('path');
      const sessionDir = path.join(__dirname, '..', 'session');
      const files = fs.existsSync(sessionDir) ? fs.readdirSync(sessionDir) : [];
      reply(files.length ? `🔐 ${files.length} fichier(s) de session actifs.` : 'Aucune session trouvée.');
    }
  },
  {
    name: 'revokepair',
    description: 'Supprime la session actuelle pour forcer une reconnexion (owner)',
    run: async ({ reply, isOwner }) => {
      if (!isOwner) return reply('⛔ Réservé au créateur.');
      await reply('♻️ Session supprimée, redémarrage nécessaire pour re-générer un code de pairing.');
      const fs = require('fs');
      const path = require('path');
      const sessionDir = path.join(__dirname, '..', 'session');
      if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
      process.exit(0);
    }
  },
  {
    name: 'viewonce',
    description: 'Télécharge un message "vue unique" (réponds à un message vue unique)',
    run: async ({ reply, downloadQuoted, isViewOnceQuoted }) => {
      if (!isViewOnceQuoted) return reply('❓ Réponds à un message "vue unique" avec .viewonce\n\n⚠️ À utiliser uniquement avec le consentement des personnes concernées — cette commande contourne l\'attente de confidentialité du message.');
      const buffer = await downloadQuoted();
      if (!buffer) return reply('⚠️ Impossible de récupérer ce média.');
      reply({ document: buffer, mimetype: 'application/octet-stream', fileName: 'viewonce_media' });
    }
  }
];
