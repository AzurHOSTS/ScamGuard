const axios = require('axios');
const Jimp = require('jimp');
const blockhash = require('blockhash-js');
const { loadBannedHashes } = require('./bannedImages');

function hammingDistance(a, b) {
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

async function downloadImage(url, maxSize = 5 * 1024 * 1024, timeoutMs = 30000) {
  try {
    const resp = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: timeoutMs,
      maxContentLength: maxSize,
    });
    return Buffer.from(resp.data);
  } catch {
    return null;
  }
}

async function checkBannedImage(imageBuffer, options = {}) {
  const threshold = options.bannedImagesThreshold ?? 20;
  const bannedDir = options.bannedImagesDir ?? './banned_images';

  const banned = await loadBannedHashes(bannedDir);
  if (!banned.length) return null;

  try {
    const img = await Jimp.read(imageBuffer);
    const h = blockhash.blockhashData(img.bitmap, 16, 2);

    for (const { fname, hash: bh } of banned) {
      const d = hammingDistance(h, bh);
      if (d <= threshold) {
        const sim = Math.max(0, 100 - (d / h.length) * 100);
        return { matched: fname, distance: d, similarity: Math.round(sim * 10) / 10 };
      }
    }
  } catch (e) {
    console.debug(`[ScamGuard] phash failed: ${e.message}`);
  }
  return null;
}

async function getImageUrls(message) {
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

module.exports = { checkBannedImage, downloadImage, getImageUrls };