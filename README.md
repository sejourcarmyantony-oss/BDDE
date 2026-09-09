# 🌑 Shadow Bot

Bot WhatsApp créé par **Olsen-dev**, basé sur [Baileys](https://github.com/WhiskeySockets/Baileys) (librairie non-officielle, connexion par code de pairing — sans navigateur).

## 📦 Contenu

- Menu stylé, catégories : MAIN, AI, GROUP, TOOLS, STICKER, DOWNLOADER, FUN, OWNER, GAMES, LOGO
- Préfixe modifiable (`.setprefix`)
- Modération de groupe (kick/promote/anti-lien/liste noire de mots/avertissements)
- Commandes IA connectables à une clé API
- Téléchargeur YouTube (`.play`, `.ytmp3`, `.ytmp4`)
- Effets de texte, conversion de médias (sticker, audio, image, GIF)
- Toutes les commandes affichent `-Olszn` en signature

**Non inclus** (volontairement) : toute commande de surveillance de tiers, d'usurpation, de spam de notifications, ou de perturbation d'autres comptes/bots — voir la conversation pour le détail de ce qui a été exclu et pourquoi.

## 🚀 Installation locale

```bash
npm install
cp .env.example .env
# édite .env : mets ton numéro dans OWNER_PHONE si tu veux éviter la question interactive
npm start
```

Au premier lancement, le bot affiche un **code de pairing** dans le terminal. Sur ton téléphone : WhatsApp > Paramètres > Appareils liés > Lier un appareil > "Lier avec un numéro de téléphone à la place" > entre le code.

## ☁️ Déploiement sur Render

1. Pousse ce dossier sur un dépôt GitHub (le `.gitignore` exclut déjà `node_modules/`, `session/`, `.env`).
2. Sur [render.com](https://render.com) : **New > Web Service**, connecte le dépôt.
3. Render détecte `render.yaml` automatiquement (ou configure manuellement : Build = `npm install`, Start = `npm start`).
4. Dans **Environment**, ajoute au minimum `OWNER_PHONE` (ton numéro sans le `+`).
5. Déploie. Ouvre l'onglet **Logs** : le code de pairing y apparaît — lie ton téléphone comme en local.

### ⚠️ Limite importante du plan gratuit Render

Le plan gratuit **ne fournit pas de disque persistant** : à chaque redémarrage du service (mise en veille après inactivité, redeploy), le dossier `session/` est réinitialisé et **le bot doit être re-lié** (nouveau code de pairing à chaque fois). Pour une session qui persiste :
- passe sur un plan payant Render avec un disque persistant (le `render.yaml` fourni configure déjà un disque, mais celui-ci n'est disponible qu'à partir du plan payant), **ou**
- héberge plutôt sur une machine qui reste allumée en continu (VPS, Railway avec volume, etc.).

Le service gratuit se met aussi en veille après ~15 minutes sans requête HTTP entrante ; le petit serveur web intégré (`index.js`) répond sur `/` pour permettre un ping externe (ex: UptimeRobot) si tu veux le garder éveillé.

## 🐛 Erreurs anticipées et déjà corrigées dans le code

| Risque | Ce qui a été fait |
|---|---|
| Crash si une commande lève une erreur | Chaque message est traité dans un `try/catch` global (`index.js`) ; l'utilisateur reçoit un message d'erreur au lieu de faire planter le process |
| Perte de connexion réseau | Reconnexion automatique sur `connection.update`, sauf si déconnexion volontaire (`loggedOut`) |
| Promesses rejetées non gérées | `process.on('unhandledRejection'/'uncaughtException')` interceptent et loguent sans arrêter le bot |
| Fichiers temporaires (audio/vidéo) qui s'accumulent | Chaque commande média supprime ses fichiers temporaires dans un bloc `finally` |
| Port manquant sur Render (le service est vu comme "down") | Serveur Express minimal qui écoute sur `process.env.PORT` |
| `ytdl-core` cassé par un changement YouTube | Erreur interceptée et message clair renvoyé (nécessite parfois `npm update ytdl-core`) |
| Commandes admin exécutées sans droits | Vérification systématique `isBotAdmin` / `isSenderAdmin` / `isOwner` avant toute action de groupe |
| Session perdue → boucle de reconnexion infinie | Le code détecte `DisconnectReason.loggedOut` et arrête de retenter (évite de spammer les serveurs WhatsApp) |
| `.env` absent | `dotenv` ne plante pas si le fichier manque ; chaque commande dépendante d'une clé API répond avec des instructions au lieu de crasher |
| Numéro de téléphone mal formaté | `.replace(/\D/g, '')` nettoie les espaces/`+` avant l'envoi à Baileys |

## 🔧 Pour activer les commandes actuellement en "🔧 à connecter"

Plusieurs commandes (génération d'image, TikTok/Instagram downloader, logos, reconnaissance musicale, capture d'écran web...) nécessitent une clé d'API tierce que je ne peux pas générer à ta place. Elles renvoient un message explicatif au lieu de planter. Pour les activer : ouvre le fichier de commande concerné dans `/commands`, ajoute ta clé dans `.env`, et remplace le message de stub par l'appel `fetch()` vers l'API choisie.

## 📁 Structure

```
shadow-bot/
├── index.js              # connexion + routage des messages
├── config.js              # paramètres (nom, prefix, owner, sudo...)
├── lib/menu.js            # génération du menu stylé
├── commands/
│   ├── registry.js        # regroupe toutes les catégories
│   ├── main.js             # menu, ping, pair, viewonce...
│   ├── text.js              # effets de texte
│   ├── media.js             # stickers, audio, image
│   ├── group.js              # modération, admin
│   ├── ai.js                  # chatbot + traduction
│   ├── owner.js                # broadcast, sudo, contrôle serveur
│   ├── downloader.js            # YouTube et alias
│   └── misc.js                   # outils, jeux, logos
├── settings.json          # généré au 1er lancement (prefix, etc.)
├── groupdata.json         # généré : modération par groupe
└── autoreplies.json       # généré : réponses automatiques
```
