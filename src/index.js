import { getImageUrls, downloadImage, checkBannedImage } from './imageCheck.js';
import { invalidateBannedCache, loadBannedHashes } from './bannedImages.js';
import { checkKeywords } from './keywordCheck.js';
import { computeUserSignals } from './userSignals.js';
import { checkUrls } from './urlCheck.js';

/**
 * Analyse complète d'un message Discord.js (image + mots-clés + signaux + URLs)
 * @param {import('discord.js').Message} message
 * @param {object} options
 * @param {number}  [options.bannedImagesThreshold=0.15]         Similarité max (0-1, 0 = identique)
 * @param {number}  [options.bannedImagesScore=50]               Score ajouté si match image
 * @param {string}  [options.bannedImagesDir='./banned_images']  Chemin du dossier
 * @param {Array}   [options.keywords]                           Liste de mots-clés pondérés
 * @param {string[]} [options.whitelist]                         Domaines de confiance pour les URLs
 * @returns {Promise<{score: number, imageFlag: object|null, factors: string[]}>}
 */
export async function analyzeMessageImages(message, options = {}) {
  console.log(`[ScamGuard][index] === Analyse démarrée pour message ${message.id} de ${message.author.tag} ===`);

  const bannedImagesScore = options.bannedImagesScore ?? 50;
  const result = { score: 0, imageFlag: null, factors: [] };

  const urls = await getImageUrls(message);
  console.log(`[ScamGuard][index] Étape image: ${urls.length} URL(s) à analyser`);

  if (urls.length) {
    const downloaded = await Promise.all(
      urls.map(async url => ({ url, buffer: await downloadImage(url) }))
    );

    const failedDownloads = downloaded.filter(d => d.buffer === null).length;
    if (failedDownloads) {
      console.warn(`[ScamGuard][index] ${failedDownloads} téléchargement(s) d'image échoué(s)`);
    }

    const bannedResults = await Promise.all(
      downloaded
        .filter(d => d.buffer !== null)
        .map(d => checkBannedImage(d.buffer, options))
    );

    const match = bannedResults.find(r => r !== null);
    if (match) {
      console.log(`[ScamGuard][index] Image bannie détectée: ${match.matched} (similarité: ${match.similarity}%, +${bannedImagesScore})`);
      result.imageFlag = { banned: match };
      result.score += bannedImagesScore;
      result.factors.push(`banned_image (${match.matched}, ${match.similarity}%)`);
    } else {
      console.log('[ScamGuard][index] Aucune image bannie détectée parmi les URLs analysées');
    }
  } else {
    console.log('[ScamGuard][index] Aucune image à analyser dans ce message');
  }

  const keywordFactors = checkKeywords(message.content || '', options.keywords);
  console.log(`[ScamGuard][index] Étape mots-clés: ${keywordFactors.length} facteur(s) trouvé(s)`);
  for (const f of keywordFactors) {
    result.score += f.score;
    result.factors.push(`${f.name} (+${f.score})`);
  }

  const signalFactors = computeUserSignals(message, options);
  console.log(`[ScamGuard][index] Étape signaux utilisateur: ${signalFactors.length} facteur(s) trouvé(s)`);
  for (const f of signalFactors) {
    result.score += f.score;
    result.factors.push(`${f.name} (+${f.score})`);
  }

  const urlFactors = await checkUrls(message.content, options);
  console.log(`[ScamGuard][index] Étape URLs: ${urlFactors.length} facteur(s) trouvé(s)`);
  for (const f of urlFactors) {
    result.score += f.score;
    result.factors.push(`${f.name} (+${f.score})`);
  }

  console.log(`[ScamGuard][index] === Score final: ${result.score} | Facteurs: [${result.factors.join(', ')}] ===`);

  return result;
}

export {
  invalidateBannedCache,
  loadBannedHashes,
  getImageUrls,
  downloadImage,
  checkBannedImage,
  checkKeywords,
  computeUserSignals,
  checkUrls,
};