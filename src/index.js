import { getImageUrls, downloadImage, checkBannedImage } from './imageCheck.js';
import { invalidateBannedCache, loadBannedHashes } from './bannedImages.js';

/**
 * Analyse les images d'un message Discord.js
 * @param {import('discord.js').Message} message
 * @param {object} options
 * @param {number}  [options.bannedImagesThreshold=0.15]         Similarité max (0-1, 0 = identique)
 * @param {number}  [options.bannedImagesScore=50]               Score ajouté si match
 * @param {string}  [options.bannedImagesDir='./banned_images']  Chemin du dossier
 * @returns {Promise<{score: number, imageFlag: object|null, factors: string[]}>}
 */
export async function analyzeMessageImages(message, options = {}) {
  const bannedImagesScore = options.bannedImagesScore ?? 50;
  const result = { score: 0, imageFlag: null, factors: [] };

  const urls = await getImageUrls(message);
  if (!urls.length) return result;

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

  return result;
}

export {
  invalidateBannedCache,
  loadBannedHashes,
  getImageUrls,
  downloadImage,
  checkBannedImage,
};