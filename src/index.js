import { getImageUrls, downloadImage, checkBannedImage } from './imageCheck.js';
import { invalidateBannedCache, loadBannedHashes } from './bannedImages.js';
import { checkKeywords } from './keywordCheck.js';
import { computeUserSignals } from './userSignals.js';
import { checkUrls } from './urlCheck.js';
import { extractTextFromImage, preloadOcr, terminateOcr } from './ocrCheck.js';

/**
 * Analyse complète d'un message Discord.js
 * @param {import('discord.js').Message} message
 * @param {object} options
 * @param {number}  [options.bannedImagesThreshold=0.3125]       Distance max normalisée (0-1)
 * @param {number}  [options.bannedImagesScore=50]               Score ajouté si match image
 * @param {string}  [options.bannedImagesDir='./banned_images']  Chemin du dossier
 * @param {boolean} [options.ocrEnabled=true]                    Active l'OCR sur les images
 * @param {string}  [options.ocrLang='fra+eng']                  Langues tesseract.js
 * @param {number}  [options.maxOcrLength=2000]                  Longueur max du texte OCR
 * @param {number}  [options.noTextBonus=10]                     Bonus si mots-clés trouvés uniquement via OCR
 * @param {Array}   [options.keywords]                           Liste de mots-clés pondérés
 * @param {string[]} [options.whitelist]                         Domaines de confiance pour les URLs
 * @param {boolean} [options.checkDomainAge=true]                Active la vérification whois
 * @returns {Promise<{score: number, imageFlag: object|null, factors: string[], ocrText: string}>}
 */
export async function analyzeMessageImages(message, options = {}) {
  console.log(`[ScamGuard][index] === Analyse démarrée pour message ${message.id} de ${message.author.tag} ===`);

  const bannedImagesScore = options.bannedImagesScore ?? 50;
  const ocrEnabled = options.ocrEnabled ?? true;
  const result = { score: 0, imageFlag: null, factors: [], ocrText: '' };

  const urls = await getImageUrls(message);
  console.log(`[ScamGuard][index] Étape image: ${urls.length} URL(s) à analyser`);

  let downloaded = [];
  if (urls.length) {
    downloaded = await Promise.all(
      urls.map(async url => ({ url, buffer: await downloadImage(url) }))
    );

    const failedDownloads = downloaded.filter(d => d.buffer === null).length;
    if (failedDownloads) {
      console.warn(`[ScamGuard][index] ${failedDownloads} téléchargement(s) d'image échoué(s)`);
    }

    const validBuffers = downloaded.filter(d => d.buffer !== null);

    const bannedResults = await Promise.all(
      validBuffers.map(d => checkBannedImage(d.buffer, options))
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

    if (ocrEnabled && validBuffers.length) {
      console.log(`[ScamGuard][index] Étape OCR: analyse de ${validBuffers.length} image(s)`);
      const ocrResults = await Promise.all(
        validBuffers.map(d => extractTextFromImage(d.buffer, options))
      );
      const combinedOcrText = ocrResults.filter(Boolean).join('\n');
      if (combinedOcrText) {
        result.ocrText = combinedOcrText;
        console.log(`[ScamGuard][index] Texte OCR combiné: ${combinedOcrText.length} caractères`);
      } else {
        console.log('[ScamGuard][index] Aucun texte extrait par OCR');
      }
    }
  } else {
    console.log('[ScamGuard][index] Aucune image à analyser dans ce message');
  }

  const combinedText = [message.content || '', result.ocrText].filter(Boolean).join('\n');

  const keywordFactors = checkKeywords(combinedText, options.keywords);
  console.log(`[ScamGuard][index] Étape mots-clés (texte + OCR): ${keywordFactors.length} facteur(s) trouvé(s)`);
  for (const f of keywordFactors) {
    result.score += f.score;
    result.factors.push(`${f.name} (+${f.score})`);
  }

  if (!message.content?.trim() && result.ocrText && keywordFactors.length) {
    const noTextBonus = options.noTextBonus ?? 10;
    console.log(`[ScamGuard][index] Bonus no_text (mots-clés trouvés uniquement via OCR): +${noTextBonus}`);
    result.score += noTextBonus;
    result.factors.push(`no_text (+${noTextBonus})`);
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
  extractTextFromImage,
  preloadOcr,
  terminateOcr,
};