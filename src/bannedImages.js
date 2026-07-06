const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const blockhash = require('blockhash-js');

let _bannedCache = null;

async function loadBannedHashes(bannedDir = './banned_images') {
  if (_bannedCache) return _bannedCache;

  const hashes = [];
  const exts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'];

  if (!fs.existsSync(bannedDir)) {
    console.warn(`[ScamGuard] Dossier introuvable: ${bannedDir}`);
    return hashes;
  }

  const files = fs.readdirSync(bannedDir).sort();
  for (const file of files) {
    if (!exts.includes(path.extname(file).toLowerCase())) continue;
    try {
      const img = await Jimp.read(path.join(bannedDir, file));
      const hash = blockhash.blockhashData(img.bitmap, 16, 2);
      hashes.push({ fname: file, hash });
    } catch (e) {
      console.debug(`[ScamGuard] Skipping ${file}: ${e.message}`);
    }
  }

  console.log(`[ScamGuard] ${hashes.length} image(s) de référence chargées depuis ${bannedDir}`);
  _bannedCache = hashes;
  return hashes;
}

function invalidateBannedCache() {
  _bannedCache = null;
}

module.exports = { loadBannedHashes, invalidateBannedCache };