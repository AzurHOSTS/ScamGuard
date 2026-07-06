import { createWorker } from 'tesseract.js';

let _worker = null;
const _ocrMemoCache = new Map();
const _OCR_CACHE_MAX = 500;

function _cacheKey(buffer) {
  let hash = 0;
  for (let i = 0; i < buffer.length; i += 97) {
    hash = (hash * 31 + buffer[i]) >>> 0;
  }
  return `${buffer.length}_${hash}`;
}

async function _getWorker(lang = 'fra+eng') {
  if (_worker) return _worker;
  console.log(`[ScamGuard][ocrCheck] Initialisation tesseract.js (${lang}) ...`);
  _worker = await createWorker(lang);
  console.log('[ScamGuard][ocrCheck] tesseract.js prêt');
  return _worker;
}

export async function preloadOcr(lang = 'fra+eng') {
  await _getWorker(lang);
}

export async function extractTextFromImage(buffer, options = {}) {
  const maxLen = options.maxOcrLength ?? 2000;
  const lang = options.ocrLang ?? 'fra+eng';

  const key = _cacheKey(buffer);
  const cached = _ocrMemoCache.get(key);
  if (cached !== undefined) {
    console.log(`[ScamGuard][ocrCheck] Cache hit (${cached.length} caractères)`);
    return cached.slice(0, maxLen);
  }

  try {
    const worker = await _getWorker(lang);
    console.log(`[ScamGuard][ocrCheck] Analyse OCR sur ${buffer.length} octets ...`);
    const { data } = await worker.recognize(buffer);
    const text = (data?.text || '').trim();

    _ocrMemoCache.set(key, text);
    if (_ocrMemoCache.size > _OCR_CACHE_MAX) {
      _ocrMemoCache.delete(_ocrMemoCache.keys().next().value);
    }

    console.log(`[ScamGuard][ocrCheck] Texte extrait: ${text.length} caractères`);
    if (text.length > 0) {
      console.log(`[ScamGuard][ocrCheck] Aperçu: "${text.slice(0, 100).replace(/\n/g, ' ')}"`);
    }
    return text.slice(0, maxLen);
  } catch (e) {
    console.error('[ScamGuard][ocrCheck] OCR échoué:', e.stack || e.message);
    return '';
  }
}

export async function terminateOcr() {
  if (_worker) {
    await _worker.terminate();
    _worker = null;
    console.log('[ScamGuard][ocrCheck] Worker terminé');
  }
}