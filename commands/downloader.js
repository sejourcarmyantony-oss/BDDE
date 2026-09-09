const ytdl = require('ytdl-core');
const yts = require('yt-search');

module.exports = [
  {
    name: 'play',
    description: 'Cherche et envoie une chanson depuis YouTube. Ex: .play titre de la chanson',
    run: async ({ reply, text }) => {
      if (!text) return reply('❓ Utilisation : .play <titre de la chanson>');
      try {
        const search = await yts(text);
        const video = search.videos[0];
        if (!video) return reply('❌ Aucun résultat trouvé.');
        await reply(`🎵 *${video.title}*\n⏱️ ${video.timestamp} — 👁️ ${video.views}\nTéléchargement...`);
        const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
        const chunks = [];
        stream.on('data', c => chunks.push(c));
        stream.on('end', () => {
          reply({ audio: Buffer.concat(chunks), mimetype: 'audio/mp4', fileName: `${video.title}.mp3` });
        });
        stream.on('error', e => reply('⚠️ Erreur de téléchargement : ' + e.message));
      } catch (e) {
        reply('⚠️ Erreur : ' + e.message + '\n(YouTube change souvent ses protections — si ça persiste, ytdl-core peut nécessiter une mise à jour)');
      }
    }
  },
  {
    name: 'ytmp3',
    description: 'Alias de play (audio)',
    run: async (ctx) => module.exports.find(c => c.name === 'play').run(ctx)
  },
  {
    name: 'ytmp4',
    description: 'Télécharge une vidéo YouTube. Ex: .ytmp4 titre',
    run: async ({ reply, text }) => {
      if (!text) return reply('❓ Utilisation : .ytmp4 <titre ou lien>');
      try {
        const search = ytdl.validateURL(text) ? { videos: [{ url: text, title: text }] } : await yts(text);
        const video = search.videos[0];
        if (!video) return reply('❌ Aucun résultat trouvé.');
        await reply(`🎬 *${video.title}*\nTéléchargement (peut être long)...`);
        const stream = ytdl(video.url, { filter: 'audioandvideo', quality: 'lowest' });
        const chunks = [];
        stream.on('data', c => chunks.push(c));
        stream.on('end', () => reply({ video: Buffer.concat(chunks), caption: video.title }));
        stream.on('error', e => reply('⚠️ Erreur : ' + e.message));
      } catch (e) { reply('⚠️ Erreur : ' + e.message); }
    }
  },
  { name: 'tiktok', description: 'Télécharge une vidéo TikTok sans watermark', run: async ({ reply }) => reply('🔧 tiktok nécessite une API tierce (ex: tikwm.com). Voir README pour l\'ajouter dans commands/downloader.js.') },
  { name: 'instagram', description: 'Télécharge un post/reel Instagram', run: async ({ reply }) => reply('🔧 instagram nécessite une API tierce. Voir README.') },
  { name: 'facebook', description: 'Télécharge une vidéo Facebook', run: async ({ reply }) => reply('🔧 facebook nécessite une API tierce. Voir README.') },
  { name: 'twitter', description: 'Télécharge une vidéo Twitter/X', run: async ({ reply }) => reply('🔧 twitter nécessite une API tierce. Voir README.') },
  { name: 'spotify', description: 'Télécharge un titre Spotify', run: async ({ reply }) => reply('🔧 spotify nécessite une API tierce. Voir README.') },
  { name: 'mediafire', description: 'Télécharge un fichier Mediafire', run: async ({ reply }) => reply('🔧 mediafire nécessite un scraper dédié. Voir README.') },
  { name: 'pinterest', description: 'Télécharge une image Pinterest', run: async ({ reply }) => reply('🔧 pinterest nécessite une API tierce. Voir README.') },
  { name: 'threads', description: 'Télécharge un post Threads', run: async ({ reply }) => reply('🔧 threads nécessite une API tierce. Voir README.') },
  { name: 'capcut', description: 'Télécharge un template Capcut', run: async ({ reply }) => reply('🔧 capcut nécessite une API tierce. Voir README.') },
  { name: 'apk', description: 'Recherche un APK', run: async ({ reply }) => reply('🔧 apk nécessite une API tierce (ex: APKPure). Voir README.') },
  { name: 'gdrive', description: 'Télécharge un fichier Google Drive public', run: async ({ reply }) => reply('🔧 gdrive nécessite l\'API Google Drive. Voir README.') }
];
