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
  const bannedImagesScore = options.bannedImagesScore ?? 50;
  const result = { score: 0, imageFlag: null, factors: [] };

  const urls = await getImageUrls(message);
  if (urls.length) {
    const downloaded = await Promise.all(
      urls.map(async url => ({ url, buffer: await downloadImage(url) }))
    );

    const bannedResults = await Promise.all(
      downloaded
        .filter(d => d.buffer !== null)
        .map(d => checkBannedImage(d.buffer, options))
    );

    const match = bannedResults.find(r => r !== null);
    if (match) {
      result.imageFlag = { banned: match };
      result.score += bannedImagesScore;
      result.factors.push(`banned_image (${match.matched}, ${match.similarity}%)`);
    }
  }

  const keywordFactors = checkKeywords(message.content || '', options.keywords);
  for (const f of keywordFactors) {
    result.score += f.score;
    result.factors.push(`${f.name} (+${f.score})`);
  }

  const signalFactors = computeUserSignals(message, options);
  for (const f of signalFactors) {
    result.score += f.score;
    result.factors.push(`${f.name} (+${f.score})`);
  }

  const urlFactors = await checkUrls(message.content, options);
  for (const f of urlFactors) {
    result.score += f.score;
    result.factors.push(`${f.name} (+${f.score})`);
  }

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