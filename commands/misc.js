const fetch = require('node-fetch');

const tools = [
  {
    name: 'calc',
    description: 'Calculatrice simple. Ex: .calc 5*(3+2)',
    run: async ({ reply, text }) => {
      if (!text) return reply('❓ Utilisation : .calc <expression>');
      if (!/^[0-9+\-*/().\s]+$/.test(text)) return reply('❌ Expression invalide (chiffres et opérateurs uniquement).');
      try { reply(`🧮 = ${Function('"use strict"; return (' + text + ')')()}`); }
      catch { reply('❌ Expression invalide.'); }
    }
  },
  {
    name: 'quote',
    description: 'Citation inspirante aléatoire',
    run: async ({ reply }) => {
      const quotes = [
        "Le succès, c'est se déplacer d'échec en échec sans perdre son enthousiasme.",
        "La vie, c'est comme une bicyclette. Il faut avancer pour ne pas perdre l'équilibre.",
        "Ce qui ne nous tue pas nous rend plus forts.",
        "Le doute est le commencement de la sagesse."
      ];
      reply('💬 ' + quotes[Math.floor(Math.random() * quotes.length)]);
    }
  },
  {
    name: 'fact',
    description: 'Un fait aléatoire',
    run: async ({ reply }) => {
      const facts = [
        "Le miel ne se périme jamais.",
        "Les poulpes ont trois cœurs.",
        "Le Mont Everest grandit d'environ 4mm par an.",
        "Un jour sur Vénus dure plus longtemps qu'une année sur Vénus."
      ];
      reply('📚 ' + facts[Math.floor(Math.random() * facts.length)]);
    }
  },
  { name: 'meme', description: 'Envoie un meme aléatoire', run: async ({ reply }) => reply('🔧 meme nécessite une API de memes (ex: meme-api.com). Voir README.') },
  { name: 'shorturl', description: 'Raccourcit un lien. Ex: .shorturl https://...', run: async ({ reply, text }) => {
      if (!text) return reply('❓ Utilisation : .shorturl <lien>');
      try {
        const res = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(text));
        reply(await res.text());
      } catch (e) { reply('⚠️ Erreur : ' + e.message); }
    }
  },
  { name: 'qrcode', description: 'Génère un QR code. Ex: .qrcode texte', run: async ({ reply, text }) => {
      if (!text) return reply('❓ Utilisation : .qrcode <texte>');
      reply({ image: { url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}` }, caption: '✅ QR code généré' });
    }
  },
  { name: 'ip-lookup', description: 'Infos publiques sur une IP. Ex: .ip-lookup 8.8.8.8', run: async ({ reply, args }) => {
      if (!args[0]) return reply('❓ Utilisation : .ip-lookup <adresse IP>');
      try {
        const res = await fetch(`http://ip-api.com/json/${args[0]}`);
        const data = await res.json();
        if (data.status !== 'success') return reply('❌ IP invalide ou introuvable.');
        reply(`🌐 ${data.query}\nPays : ${data.country}\nVille : ${data.city}\nFAI : ${data.isp}`);
      } catch (e) { reply('⚠️ Erreur : ' + e.message); }
    }
  },
  { name: 'dns-lookup', description: 'Enregistrements DNS publics. Ex: .dns-lookup exemple.com', run: async ({ reply, args }) => {
      if (!args[0]) return reply('❓ Utilisation : .dns-lookup <domaine>');
      try {
        const dns = require('dns').promises;
        const records = await dns.resolve(args[0]).catch(() => []);
        reply(records.length ? '📡 ' + records.join('\n') : '❌ Aucun enregistrement trouvé.');
      } catch (e) { reply('⚠️ Erreur : ' + e.message); }
    }
  },
  { name: 'headers', description: "En-têtes HTTP d'un site. Ex: .headers https://exemple.com", run: async ({ reply, text }) => {
      if (!text) return reply('❓ Utilisation : .headers <URL>');
      try {
        const res = await fetch(text, { method: 'HEAD' });
        let out = '';
        res.headers.forEach((v, k) => out += `${k}: ${v}\n`);
        reply('📋 ' + (out || 'Aucun en-tête reçu.'));
      } catch (e) { reply('⚠️ Erreur : ' + e.message); }
    }
  },
  { name: 'proxy-status', description: 'Vérifie la connectivité réseau du bot', run: async ({ reply }) => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        reply(`✅ Connecté — IP sortante : ${data.ip}`);
      } catch (e) { reply('❌ Problème réseau : ' + e.message); }
    }
  },
  { name: 'temp-mail', description: 'Explique comment obtenir un email jetable', run: async ({ reply }) => reply('🔧 temp-mail nécessite une API dédiée (ex: mail.tm). Voir README pour l\'intégrer.') },
  { name: 'web-screenshot', description: "Capture d'écran d'un site (nécessite un navigateur headless, lourd pour un hébergement gratuit)", run: async ({ reply }) => reply('🔧 web-screenshot nécessite Puppeteer/Playwright — gourmand en RAM, peu adapté au plan gratuit de Render. Voir README pour l\'activer sur un plan payant.') }
];

const games = [
  {
    name: 'riddle',
    description: 'Devinette aléatoire',
    run: async ({ reply }) => {
      const riddles = [
        { q: "Je n'ai pas de bouche mais je peux parler. Qui suis-je ?", r: "Un écho" },
        { q: "Plus je sèche, plus je deviens mouillé. Qui suis-je ?", r: "Une serviette" },
        { q: "Qu'est-ce qui a des clés mais n'ouvre aucune porte ?", r: "Un clavier / un piano" }
      ];
      const pick = riddles[Math.floor(Math.random() * riddles.length)];
      reply(`🧩 ${pick.q}\n\n(Réponse dans 15s...)`);
      setTimeout(() => {}, 0);
    }
  },
  {
    name: 'animequiz',
    description: 'Petit quiz anime',
    run: async ({ reply }) => {
      const quiz = [
        { q: "Quel est le nom du héros de 'Naruto' ?", r: "Naruto Uzumaki" },
        { q: "Dans 'One Piece', comment s'appelle le bateau de l'équipage principal ?", r: "Le Thousand Sunny (ou le Going Merry au début)" }
      ];
      const pick = quiz[Math.floor(Math.random() * quiz.length)];
      reply(`🎌 ${pick.q}`);
    }
  }
];

const logoNames = ['1917','arena','blackpink','devil','fire','glitch','hacker','ice','impressive','leaves','light','matrix','metallic','neon','purple','sand','snow','thunder'];
const logo = logoNames.map(name => ({
  name,
  description: `Génère un logo style "${name}" à partir d'un texte`,
  run: async ({ reply, text }) => {
    if (!text) return reply(`❓ Utilisation : .${name} <texte>`);
    reply(`🔧 Génération de logo "${name}" nécessite une API de logo-maker (ex: ephoto360 via scraper). Voir README pour la connecter dans commands/misc.js.`);
  }
})).concat([{ name: 'logolist', description: 'Liste tous les styles de logo disponibles', run: async ({ reply }) => reply('🖼️ Styles disponibles : ' + logoNames.join(', ')) }]);

module.exports = { tools, games, logo };
