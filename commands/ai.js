const fetch = require('node-fetch');

// Configure la clé API dans le fichier .env (voir .env.example).
// Par défaut ce module appelle l'API Anthropic (Claude). Tu peux le remplacer
// par OpenAI, Gemini, etc. en modifiant callAI() ci-dessous.
async function callAI(prompt) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return "🔧 Aucune clé d'IA configurée. Ajoute AI_API_KEY dans le fichier .env pour activer cette commande (voir README).";
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data.error) return '⚠️ Erreur IA : ' + data.error.message;
    return data.content?.map(c => c.text || '').join('\n') || '⚠️ Réponse vide.';
  } catch (e) {
    return '⚠️ Erreur de connexion à l\'IA : ' + e.message;
  }
}

const aiHandler = async ({ reply, text }) => {
  if (!text) return reply('❓ Utilisation : .ai <ta question>');
  await reply('🤖 Réflexion...');
  const answer = await callAI(text);
  reply(answer);
};

// Alias : toutes ces commandes pointent vers le même moteur par défaut.
// Pour brancher un modèle différent par commande (gemini, gpt, etc.),
// duplique aiHandler avec un autre appel API dans callAI().
const aliases = [
  'ai', 'chatbot', 'gpt', 'gemini', 'claudepro', 'meta', 'blackbox',
  'llamacoder', 'llama', 'deepai', 'deepaimodels', 'letmegpt', 'unlimitedai'
];

module.exports = aliases.map(name => ({
  name,
  description: name === 'ai' ? 'Pose une question à l\'IA' : `Alias de .ai (moteur : ${name})`,
  run: aiHandler
})).concat([
  {
    name: 'imagine',
    description: "Génère une image à partir d'une description (nécessite une API d'image)",
    run: async ({ reply }) => reply('🔧 imagine nécessite une API de génération d\'image (ex: Stability, DALL·E). Ajoute IMAGE_API_KEY dans .env — voir README.')
  },
  { name: 'dalle', description: 'Alias de imagine', run: async ({ reply }) => reply('🔧 dalle nécessite une API de génération d\'image. Voir README.') },
  { name: 'flux', description: 'Alias de imagine', run: async ({ reply }) => reply('🔧 flux nécessite une API de génération d\'image. Voir README.') },
  { name: 'nanobanana', description: 'Alias de imagine', run: async ({ reply }) => reply('🔧 nanobanana nécessite une API de génération d\'image. Voir README.') },
  { name: 'nanoblend', description: 'Alias de imagine', run: async ({ reply }) => reply('🔧 nanoblend nécessite une API de génération d\'image. Voir README.') },
  { name: 'txt2video', description: 'Génère une vidéo à partir de texte (nécessite une API vidéo)', run: async ({ reply }) => reply('🔧 txt2video nécessite une API de génération vidéo (ex: Veo, Runway). Voir README.') },
  { name: 'veo3', description: 'Alias de txt2video', run: async ({ reply }) => reply('🔧 veo3 nécessite une API de génération vidéo. Voir README.') },
  { name: 'remini', description: "Améliore la qualité d'une image (réponse à une image)", run: async ({ reply }) => reply('🔧 remini nécessite une API d\'amélioration d\'image. Voir README.') },
  { name: 'upscale', description: 'Alias de remini', run: async ({ reply }) => reply('🔧 upscale nécessite une API d\'amélioration d\'image. Voir README.') },
  {
    name: 'translate',
    description: "Traduit un texte. Ex: .translate en Bonjour",
    run: async ({ reply, args }) => {
      if (args.length < 2) return reply('❓ Utilisation : .translate <langue_cible> <texte>');
      const target = args[0];
      const text = args.slice(1).join(' ');
      try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${target}`);
        const data = await res.json();
        reply(data.responseData?.translatedText || '⚠️ Traduction indisponible.');
      } catch (e) { reply('⚠️ Erreur de traduction : ' + e.message); }
    }
  }
]);
      
