import axios from 'axios';

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'shorturl.at'];
const SUSPECT_TLDS = ['.xyz', '.top', '.click', '.gq', '.cf', '.tk', '.buzz'];
const URL_RE = /https?:\/\/[^\s<>"')]+/gi;

async function resolveShortUrl(url, timeout = 5000) {
  console.log(`[ScamGuard][urlCheck] Résolution URL raccourcie: ${url}`);
  try {
    const resp = await axios.get(url, {
      timeout,
      maxRedirects: 5,
      validateStatus: () => true,
    });
    const finalUrl = resp.request?.res?.responseUrl || null;
    console.log(`[ScamGuard][urlCheck] URL résolue: ${url} -> ${finalUrl}`);
    return finalUrl;
  } catch (e) {
    console.error(`[ScamGuard][urlCheck] Résolution échouée pour ${url}:`, e.message);
    return null;
  }
}

function isIpAddress(host) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

export async function checkUrls(content, options = {}) {
  const factors = [];
  if (!content?.trim()) {
    console.log('[ScamGuard][urlCheck] Contenu vide, skip');
    return factors;
  }

  const urls = content.match(URL_RE) || [];
  console.log(`[ScamGuard][urlCheck] ${urls.length} URL(s) détectée(s) dans le message`);
  const whitelist = options.whitelist || [];
  const seenDomains = new Set();

  for (const url of urls.slice(0, 5)) {
    let domain;
    try {
      domain = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      console.log(`[ScamGuard][urlCheck] URL invalide ignorée: ${url}`);
      continue;
    }
    if (!domain || seenDomains.has(domain) || whitelist.includes(domain)) {
      console.log(`[ScamGuard][urlCheck] Domaine ignoré (doublon/whitelist): ${domain}`);
      continue;
    }
    seenDomains.add(domain);

    if (SHORTENERS.includes(domain)) {
      console.log(`[ScamGuard][urlCheck] Raccourcisseur détecté: ${domain} (+${options.shortenerScore ?? 15})`);
      factors.push({ name: `url_shortener_${domain}`, score: options.shortenerScore ?? 15 });
      const finalUrl = await resolveShortUrl(url);
      if (finalUrl) {
        try {
          const finalDomain = new URL(finalUrl).hostname.toLowerCase().replace(/^www\./, '');
          if (finalDomain && !seenDomains.has(finalDomain) && !whitelist.includes(finalDomain)) {
            seenDomains.add(finalDomain);
            analyzeDomain(finalDomain, factors, options);
          }
        } catch {}
      }
      continue;
    }

    analyzeDomain(domain, factors, options);
  }

  console.log(`[ScamGuard][urlCheck] ${factors.length} facteur(s) trouvé(s)`);
  return factors;
}

function analyzeDomain(domain, factors, options) {
  if (isIpAddress(domain)) {
    console.log(`[ScamGuard][urlCheck] Adresse IP détectée: ${domain} (+${options.ipScore ?? 20})`);
    factors.push({ name: `url_ip_${domain}`, score: options.ipScore ?? 20 });
  }
  for (const tld of SUSPECT_TLDS) {
    if (domain.endsWith(tld)) {
      console.log(`[ScamGuard][urlCheck] TLD suspect détecté: ${domain} (+${options.tldScore ?? 10})`);
      factors.push({ name: `url_tld_${tld}`, score: options.tldScore ?? 10 });
      break;
    }
  }
}