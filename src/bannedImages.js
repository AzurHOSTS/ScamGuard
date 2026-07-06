import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Jimp } from 'jimp';

let _bannedCache = null;

export async function loadBannedHashes(bannedDir = './banned_images') {
  if (_bannedCache) {
    console.log(`[ScamGuard][bannedImages] Cache déjà chargé (${_bannedCache.length} hash)`);
    return _bannedCache;
  }

  const hashes = [];
  const exts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];

  if (!fs.existsSync(bannedDir)) {
    console.warn(`[ScamGuard][bannedImages] Dossier introuvable: ${bannedDir}`);
    return hashes;
  }

  const files = fs.readdirSync(bannedDir).sort();
  console.log(`[ScamGuard][bannedImages] ${files.length} fichier(s) trouvé(s) dans ${bannedDir}`);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!exts.includes(ext)) {
      console.log(`[ScamGuard][bannedImages] Ignoré (extension non supportée): ${file}`);
      continue;
    }
    try {
      const buffer = fs.readFileSync(path.join(bannedDir, file));
      const buf = ext === '.webp' ? await sharp(buffer).png().toBuffer() : buffer;
      const img = await Jimp.fromBuffer(buf);
      const hash = img.hash();
      hashes.push({ fname: file, hash });
      console.log(`[ScamGuard][bannedImages] Hash calculé pour ${file}: ${hash}`);
    } catch (e) {
      console.error(`[ScamGuard][bannedImages] Skipping ${file}:`, e.stack || e.message);
    }
  }

  console.log(`[ScamGuard][bannedImages] ${hashes.length} image(s) de référence chargées depuis ${bannedDir}`);
  _bannedCache = hashes;
  return hashes;
}

export function invalidateBannedCache() {
  console.log('[ScamGuard][bannedImages] Cache invalidé');
  _bannedCache = null;
}