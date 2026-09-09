// Regroupe toutes les commandes de chaque fichier de catégorie en un seul objet.
// Pour ajouter une commande : ouvre le fichier de la catégorie concernée et ajoute
// un objet { name, description, run(ctx) } au tableau exporté.

const main = require('./main');
const text = require('./text');
const media = require('./media');
const group = require('./group');
const ai = require('./ai');
const owner = require('./owner');
const downloader = require('./downloader');
const misc = require('./misc');

const categories = {
  MAIN: main,
  AI: ai,
  GROUP: group,
  TOOLS: media.effects.concat(misc.tools),
  STICKER: media.sticker,
  DOWNLOADER: downloader,
  FUN: text,
  OWNER: owner,
  GAMES: misc.games,
  LOGO: misc.logo
};

// Table plate : nom de commande -> handler (pour la recherche rapide dans index.js)
const flat = {};
for (const list of Object.values(categories)) {
  for (const cmd of list) {
    flat[cmd.name.toLowerCase()] = cmd;
  }
}

module.exports = { categories, flat };
