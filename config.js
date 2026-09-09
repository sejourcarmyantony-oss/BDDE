// ============================================
//  SHADOW BOT - Configuration
// ============================================
const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, 'settings.json');

// Valeurs par défaut (utilisées seulement si settings.json n'existe pas encore)
const DEFAULTS = {
  botName: 'Shadow Bot',
  ownerName: 'Olsen-dev',
  ownerNumber: '50931277118', // +509 31 27 7118, sans le "+"
  prefix: '.',
  channelLink: 'https://whatsapp.com/channel/METS-TON-LIEN-ICI',
  footerTag: '-Olszn', // ajouté à la fin de chaque réponse de commande
  botPicUrl: '', // mets ici l'URL ou le chemin local de l'image fournie pour la photo de profil
  mode: 'private', // 'private' = seul le owner peut utiliser le bot en dehors des groupes / 'public' = tout le monde
  sudo: [] // numéros (sans +, format 50931277118) autorisés comme co-admins du bot
};

function loadSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULTS, null, 2));
    return { ...DEFAULTS };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    return { ...DEFAULTS, ...raw };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

let settings = loadSettings();

function get(key) {
  return settings[key];
}

function set(key, value) {
  settings[key] = value;
  saveSettings(settings);
}

module.exports = { get, set, all: () => settings };
