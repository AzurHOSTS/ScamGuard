import axios from 'axios';
import sharp from 'sharp';
import { Jimp, compareHashes } from 'jimp';
import { loadBannedHashes } from './bannedImages.js';

function isWebp(buffer) {
  return buffer.length > 12 && buffer.slice(8, 12).toString('ascii') === 'WEBP';
}

export async function downloadImage(url, maxSize = 5 * 1024 * 1024, timeoutMs = 30000) {
  console.log(`[ScamGuard][imageCheck] Téléchargement: ${url}`);
  try {
    const resp = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: timeoutMs,
      maxContentLength: maxSize,
    });
    console.log(`[ScamGuard][imageCheck] Téléchargé ${resp.data.length} octets depuis ${url}`);
    return Buffer.from(resp.data);
  } catch (e) {
    console.error('[ScamGuard][imageCheck] downloadImage failed:', e.message);
    return null;
  }
}

export async function checkBannedImage(imageBuffer, options = {}) {
  const threshold = options.bannedImagesThreshold ?? 0.3125;
  const bannedDir = options.bannedImagesDir ?? './banned_images';

  const banned = await loadBannedHashes(bannedDir);
  if (!banned.length) {
    console.log('[ScamGuard][imageCheck] Aucune image de référence chargée, skip comparaison');
    return null;
  }

  try {
    let buf = imageBuffer;
    if (isWebp(buf)) {
      buf = await sharp(buf).png().toBuffer();
      console.log('[ScamGuard][imageCheck] Conversion WEBP -> PNG effectuée');
    }

    const img = await Jimp.fromBuffer(buf);
    const h = img.hash();
    console.log(`[ScamGuard][imageCheck] Hash de l'image testée: ${h}`);

    let bestMatch = null;
    let bestDistance = Infinity;

    for (const { fname, hash: bh } of banned) {
      const d = compareHashes(h, bh);
      console.log(`[ScamGuard][imageCheck] Comparaison avec ${fname} -> distance: ${d.toFixed(4)} (seuil: ${threshold})`);
      if (d <= threshold && d < bestDistance) {
        bestDistance = d;
        const sim = Math.max(0, (1 - d) * 100);
        bestMatch = { matched: fname, distance: d, similarity: Math.round(sim * 10) / 10 };
      }
    }

    if (bestMatch) {
      console.log(`[ScamGuard][imageCheck] MEILLEUR MATCH: ${bestMatch.matched} (similarité: ${bestMatch.similarity}%, distance: ${bestMatch.distance.toFixed(4)})`);
      return bestMatch;
    }
    console.log('[ScamGuard][imageCheck] Aucune correspondance sous le seuil');
  } catch (e) {
    console.error(`[ScamGuard][imageCheck] phash failed:`, e.stack || e.message);
  }
  return null;
}

export async function getImageUrls(message) {
  const exts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
  const urls = [];

  for (const att of message.attachments.values()) {
    if (exts.some(e => att.name?.toLowerCase().endsWith(e))) urls.push(att.url);
  }

  for (const embed of message.embeds) {
    if (embed.image?.url && !urls.includes(embed.image.url)) urls.push(embed.image.url);
    if (embed.thumbnail?.url && !urls.includes(embed.thumbnail.url)) urls.push(embed.thumbnail.url);
  }

  const imgRe = /https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)/gi;
  for (const m of (message.content?.matchAll(imgRe) ?? [])) {
    if (!urls.includes(m[0])) urls.push(m[0]);
  }

  console.log(`[ScamGuard][imageCheck] ${urls.length} URL(s) d'image détectée(s):`, urls);
  return urls;
}