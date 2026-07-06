# ScamGuard images

Plugin léger de **détection d'images et de comportements de scam** pour bots Discord.js.  
Utilise le **hash perceptuel (phash)** pour comparer les images envoyées dans un serveur
avec une bibliothèque d'images de scam connues, en tolérant les variantes (compression, redimensionnement),
et combine ça avec de l'**OCR**, de la **détection de mots-clés**, de l'**analyse d'URLs** et des
**signaux comportementaux/compte** pour calculer un score de risque global.

## Fonctionnalités

- Comparaison par hash perceptuel (tolérant aux variantes d'image)
- Détection sur pièces jointes, embeds et URLs dans le contenu
- OCR (Tesseract.js) sur les images pour extraire le texte et le passer au filtre de mots-clés
- Détection de mots-clés pondérés (texte du message + texte OCR combinés)
- Vérification des URLs (whitelist, âge de domaine via whois)
- Vérification du compte Discord (âge du compte, âge d'arrivée sur le serveur, avatar manquant, pseudo suspect, absence de rôles)
- Signaux comportementaux (première interaction, message image seule, crosspost par texte, crosspost par nombre de pièces jointes identique sur plusieurs salons)
- Téléchargement parallèle des images (`Promise.all`)
- Cache en mémoire des hashes de référence
- Zéro dépendance Discord — fonctionne avec n'importe quel bot Discord.js existant
- Entièrement configurable (seuils, scores, dossiers, langues OCR, whitelist...)

## Installation

```bash
npm install @azurhosts/scamguard-images
```

## Démarrage rapide

```js
import { analyzeMessageImages } from '@azurhosts/scamguard-images';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const result = await analyzeMessageImages(message, {
    bannedImagesDir: './banned_images',   // ton dossier d'images de référence
    bannedImagesThreshold: 0.3125,        // tolérance de similarité normalisée (0-1)
    bannedImagesScore: 50,                // score ajouté si match image détecté
    ocrEnabled: true,                     // active l'OCR sur les images
    ocrLang: 'fra+eng',                   // langues tesseract.js
    checkDomainAge: true,                 // active la vérification whois des domaines
    keywords: [],                         // liste de mots-clés pondérés
    whitelist: [],                        // domaines de confiance pour les URLs
  });

  if (result.score >= 50) {
    console.log(`[ScamGuard] Scam détecté:`, result.factors);
    await message.delete();
    // ta logique de sanction ici
  }
});
```

## Préparer le dossier banned_images

Crée un dossier `banned_images/` à la racine de ton projet et ajoute-y des screenshots des scams connus à bloquer.

```
racine/
├── banned_images/
│   ├── nitro_fake.png
│   ├── steam_scam.jpg
│   └── ...
├── index.js
└── package.json
```

Le plugin tolère les légères modifications d'une image (recadrage, compression JPEG, changement de taille) grâce au hash perceptuel.

## Options

### Images bannies

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `bannedImagesDir` | `string` | `./banned_images` | Chemin vers le dossier d'images de référence |
| `bannedImagesThreshold` | `number` | `0.3125` | Distance max normalisée (0-1) pour un match (0 = identique, plus élevé = plus tolérant) |
| `bannedImagesScore` | `number` | `50` | Score ajouté au résultat si une image bannie est détectée |

### OCR

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `ocrEnabled` | `boolean` | `true` | Active l'OCR sur les images |
| `ocrLang` | `string` | `'fra+eng'` | Langues tesseract.js |
| `maxOcrLength` | `number` | `2000` | Longueur max du texte OCR extrait |
| `noTextBonus` | `number` | `10` | Bonus ajouté si des mots-clés sont trouvés uniquement via l'OCR (message sans texte) |

### Mots-clés et URLs

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `keywords` | `Array` | `[]` | Liste de mots-clés pondérés |
| `whitelist` | `string[]` | `[]` | Domaines de confiance pour les URLs |
| `checkDomainAge` | `boolean` | `true` | Active la vérification whois de l'âge du domaine |

### Vérification du compte Discord

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `accountAgeDays` | `number` | `30` | Seuil d'ancienneté du compte Discord (en jours) |
| `accountAgeScore` | `number` | `15` | Score ajouté si le compte est plus récent que le seuil |
| `joinAgeDays` | `number` | `7` | Seuil d'ancienneté d'arrivée sur le serveur (en jours) |
| `joinAgeScore` | `number` | `15` | Score ajouté si le membre a rejoint le serveur récemment |
| `noAvatarScore` | `number` | `5` | Score ajouté si le compte n'a pas d'avatar global |
| `suspiciousUsernameScore` | `number` | `10` | Score ajouté si le pseudo correspond à un pattern suspect (mot+chiffres, chaîne aléatoire) |
| `noRolesScore` | `number` | `5` | Score ajouté si le membre n'a aucun rôle attribué |
| `noServerAvatarScore` | `number` | `3` | Score ajouté si le membre n'a pas d'avatar spécifique au serveur |

### Signaux comportementaux

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `firstInteractionScore` | `number` | `10` | Score ajouté à la première interaction connue de l'utilisateur |
| `imageOnlyScore` | `number` | `10` | Score ajouté si le message contient une image sans texte |
| `crosspostScore` | `number` | `20` | Score ajouté si le même texte est posté dans plusieurs salons |
| `crosspostWindow` | `number` | `300000` | Fenêtre de temps (ms) pour la détection de crosspost par texte |
| `crosspostMinChannels` | `number` | `2` | Nombre minimum de salons pour déclencher le crosspost par texte |
| `attachmentCrosspostScore` | `number` | `40` | Score ajouté si le même nombre de pièces jointes est posté sur plusieurs salons en peu de temps |
| `attachmentCrosspostWindow` | `number` | `60000` | Fenêtre de temps (ms) pour la détection de crosspost par pièces jointes |
| `attachmentCrosspostMinChannels` | `number` | `2` | Nombre minimum de salons pour déclencher le crosspost par pièces jointes |

## Résultat retourné

```js
{
  score: 65,
  imageFlag: {
    banned: {
      matched: "nitro_fake.png",  // nom du fichier de référence
      distance: 8,                // distance de Hamming
      similarity: 95.2            // similarité en %
    }
  },
  factors: [
    "banned_image (nitro_fake.png, 95.2%)",
    "account_age_3d (+15)",
    "attachment_crosspost_1f_3ch (+40)"
  ],
  ocrText: "Réclame ton Nitro gratuit ici..."
}
```

## Dépendances

| Package | Utilisation |
|---------|-------------|
| `jimp` | Lecture et décodage des images |
| `blockhash` | Calcul du hash perceptuel |
| `axios` | Téléchargement des images |
| `tesseract.js` | OCR sur les images |

## Prérequis

- Node.js >= 18.0.0
- Discord.js v14+