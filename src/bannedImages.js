import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Jimp } from 'jimp';

let _bannedCache = null;

export async function loadBannedHashes(bannedDir = './banned_images') {
  if (_bannedCache) return _bannedCache;

  const hashes = [];
  const exts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];

  if (!fs.existsSync(bannedDir)) {
    console.warn(`[ScamGuard] Dossier introuvable: ${bannedDir}`);
    return hashes;
  }

  const files = fs.readdirSync(bannedDir).sort();
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!exts.includes(ext)) continue;
    try {
      const buffer = fs.readFileSync(path.join(bannedDir, file));
      const buf = ext === '.webp' ? await sharp(buffer).png().toBuffer() : buffer;
      const img = await Jimp.fromBuffer(buf);
      const hash = img.hash();
      hashes.push({ fname: file, hash });
    } catch (e) {
      console.error(`[ScamGuard] Skipping ${file}:`, e.stack || e.message);
    }
  }

  console.log(`[ScamGuard] ${hashes.length} image(s) de référence chargées depuis ${bannedDir}`);
  _bannedCache = hashes;
  return hashes;
}

export function invalidateBannedCache() {
  _bannedCache = null;
}