# ScamGuard images

Plugin léger de **détection d'images de scam** pour bots Discord.js.  
Utilise le **hash perceptuel (phash)** pour comparer les images envoyées dans un serveur
avec une bibliothèque d'images de scam connues, en tolérant les variantes (compression, redimensionnement).

## Fonctionnalités

- Comparaison par hash perceptuel (tolérant aux variantes d'image)
- Détection sur pièces jointes, embeds et URLs dans le contenu
- Téléchargement parallèle des images (`Promise.all`)
- Cache en mémoire des hashes de référence
- Zéro dépendance Discord — fonctionne avec n'importe quel bot Discord.js existant
- Entièrement configurable (seuil, score, dossier)

## Installation

```bash
npm install scamguard-images
```

## Démarrage rapide

```js
const { analyzeMessageImages } = require('scamguard-images');

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const result = await analyzeMessageImages(message, {
    bannedImagesDir: './banned_images',   // ton dossier d'images de référence
    bannedImagesThreshold: 20,            // tolérance de similarité (0 = exact, 256 = tout)
    bannedImagesScore: 50,                // score ajouté si match détecté
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

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `bannedImagesDir` | `string` | `./banned_images` | Chemin vers le dossier d'images de référence |
| `bannedImagesThreshold` | `number` | `20` | Distance de Hamming maximale pour un match (0 = identique, plus élevé = plus tolérant) |
| `bannedImagesScore` | `number` | `50` | Score ajouté au résultat si une image bannie est détectée |

## Résultat retourné

```js
{
  score: 50,                  // score total (0 si aucun match)
  imageFlag: {
    banned: {
      matched: "nitro_fake.png",  // nom du fichier de référence
      distance: 8,                // distance de Hamming
      similarity: 95.2            // similarité en %
    }
  },
  factors: ["banned_image (nitro_fake.png, 95.2%)"]
}
```

## Dépendances

| Package | Utilisation |
|---------|-------------|
| `jimp` | Lecture et décodage des images |
| `blockhash-js` | Calcul du hash perceptuel |
| `axios` | Téléchargement des images |

## Prérequis

- Node.js >= 18.0.0
- Discord.js v14+