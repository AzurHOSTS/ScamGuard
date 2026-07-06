import axios from 'axios';
import sharp from 'sharp';
import { Jimp, compareHashes } from 'jimp';
import { loadBannedHashes } from './bannedImages.js';

function isWebp(buffer) {
  return buffer.length > 12 && buffer.slice(8, 12).toString('ascii') === 'WEBP';
}

export async function downloadImage(url, maxSize = 5 * 1024 * 1024, timeoutMs = 30000) {
  try {
    const resp = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: timeoutMs,
      maxContentLength: maxSize,
    });
    return Buffer.from(resp.data);
  } catch (e) {
    console.error('[ScamGuard] downloadImage failed:', e.message);
    return null;
  }
}

export async function checkBannedImage(imageBuffer, options = {}) {
  const threshold = options.bannedImagesThreshold ?? 0.15;
  const bannedDir = options.bannedImagesDir ?? './banned_images';

  const banned = await loadBannedHashes(bannedDir);
  if (!banned.length) return null;

  try {
    let buf = imageBuffer;
    if (isWebp(buf)) {
      buf = await sharp(buf).png().toBuffer();
    }

    const img = await Jimp.fromBuffer(buf);
    const h = img.hash();

    for (const { fname, hash: bh } of banned) {
      const d = compareHashes(h, bh);
      if (d <= threshold) {
        const sim = Math.max(0, (1 - d) * 100);
        return { matched: fname, distance: d, similarity: Math.round(sim * 10) / 10 };
      }
    }
  } catch (e) {
    console.error(`[ScamGuard] phash failed:`, e.stack || e.message);
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

  return urls;
}