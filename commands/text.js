// Toutes ces commandes ne font que transformer le texte que tu envoies toi-même.
// Aucune ne trompe ou n'affecte d'autres personnes.

function upsideDown(str) {
  const map = { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z' };
  return str.toLowerCase().split('').reverse().map(c => map[c] || c).join('');
}

function fancy(str) {
  const from = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const to = '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩';
  return str.split('').map(c => { const i = from.indexOf(c); return i === -1 ? c : to[i]; }).join('');
}

function strike(str) { return str.split('').map(c => c + '\u0336').join(''); }
function underline(str) { return str.split('').map(c => c + '\u0332').join(''); }
function mirror(str) { return str.split('').reverse().join(''); }
function spaced(str) { return str.split('').join(' '); }

module.exports = [
  { name: 'upside-down', description: 'Retourne le texte à 180°', run: async ({ reply, text }) => reply(text ? upsideDown(text) : '❓ Utilisation : .upside-down <texte>') },
  { name: 'fancy', description: 'Police stylisée', run: async ({ reply, text }) => reply(text ? fancy(text) : '❓ Utilisation : .fancy <texte>') },
  { name: 'upper', description: 'Texte en majuscules espacées', run: async ({ reply, text }) => reply(text ? spaced(text.toUpperCase()) : '❓ Utilisation : .upper <texte>') },
  { name: 'strike', description: 'Texte barré', run: async ({ reply, text }) => reply(text ? strike(text) : '❓ Utilisation : .strike <texte>') },
  { name: 'bold', description: 'Texte en gras', run: async ({ reply, text }) => reply(text ? `*${text}*` : '❓ Utilisation : .bold <texte>') },
  { name: 'italic', description: 'Texte en italique', run: async ({ reply, text }) => reply(text ? `_${text}_` : '❓ Utilisation : .italic <texte>') },
  { name: 'mono', description: 'Police monospace', run: async ({ reply, text }) => reply(text ? '```' + text + '```' : '❓ Utilisation : .mono <texte>') },
  { name: 'mono-space', description: 'Alias de mono', run: async ({ reply, text }) => reply(text ? '```' + text + '```' : '❓ Utilisation : .mono-space <texte>') },
  { name: 'space', description: 'Espace chaque lettre', run: async ({ reply, text }) => reply(text ? spaced(text) : '❓ Utilisation : .space <texte>') },
  { name: 'ghost-space', description: 'Alias de space', run: async ({ reply, text }) => reply(text ? spaced(text) : '❓ Utilisation : .ghost-space <texte>') },
  { name: 'mirror', description: 'Inverse les lettres', run: async ({ reply, text }) => reply(text ? mirror(text) : '❓ Utilisation : .mirror <texte>') },
  { name: 'reverse', description: 'Alias de mirror', run: async ({ reply, text }) => reply(text ? mirror(text) : '❓ Utilisation : .reverse <texte>') },
  { name: 'combine', description: 'Fusionne deux mots avec un émoji', run: async ({ reply, args }) => {
      if (args.length < 2) return reply('❓ Utilisation : .combine <mot1> <mot2>');
      reply(`${args[0]} 💫 ${args[1]}`);
    }
  },
  {
    name: 'spoiler', description: 'Masque un mot (révélé en copiant le message)', run: async ({ reply, text }) => {
      if (!text) return reply('❓ Utilisation : .spoiler <texte secret>');
      reply(`‎${'‎'.repeat(text.length)} \n(spoiler — copie ce message pour révéler : ${text})`);
    }
  },
  {
    name: 'choose', description: 'Choisit au hasard entre plusieurs options séparées par |', run: async ({ reply, text }) => {
      if (!text) return reply('❓ Utilisation : .choose option1 | option2 | ...');
      const opts = text.split('|').map(s => s.trim()).filter(Boolean);
      if (opts.length < 2) return reply('❓ Donne au moins deux options séparées par |');
      reply(`🎯 Je choisis : *${opts[Math.floor(Math.random() * opts.length)]}*`);
    }
  },
  { name: 'coin', description: 'Pile ou face', run: async ({ reply }) => reply(Math.random() < 0.5 ? '🪙 Pile' : '🪙 Face') },
  { name: 'roll', description: 'Lance un dé (1-6 par défaut)', run: async ({ reply, args }) => {
      const max = parseInt(args[0]) || 6;
      reply(`🎲 ${Math.floor(Math.random() * max) + 1} / ${max}`);
    }
  },
  { name: 'flip', description: 'Alias de coin', run: async ({ reply }) => reply(Math.random() < 0.5 ? '🪙 Pile' : '🪙 Face') },
  { name: 'hi', description: 'Petit message de politesse', run: async ({ reply }) => reply('👋 Bonjour ! Comment ça va ?') },
  { name: 'date', description: "Affiche l'heure et la date", run: async ({ reply }) => {
      const now = new Date();
      reply(`📅 ${now.toLocaleDateString('fr-FR')} — 🕐 ${now.toLocaleTimeString('fr-FR')}`);
    }
  }
];
