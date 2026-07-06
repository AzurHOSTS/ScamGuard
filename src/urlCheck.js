import axios from 'axios';

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'shorturl.at'];
const SUSPECT_TLDS = ['.xyz', '.top', '.click', '.gq', '.cf', '.tk', '.buzz'];
const URL_RE = /https?:\/\/[^\s<>"')]+/gi;

async function resolveShortUrl(url, timeout = 5000) {
  try {
    const resp = await axios.get(url, {
      timeout,
      maxRedirects: 5,
      validateStatus: () => true,
    });
    return resp.request?.res?.responseUrl || null;
  } catch {
    return null;
  }
}

function isIpAddress(host) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

export async function checkUrls(content, options = {}) {
  const factors = [];
  if (!content?.trim()) return factors;

  const urls = content.match(URL_RE) || [];
  const whitelist = options.whitelist || [];
  const seenDomains = new Set();

  for (const url of urls.slice(0, 5)) {
    let domain;
    try {
      domain = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      continue;
    }
    if (!domain || seenDomains.has(domain) || whitelist.includes(domain)) continue;
    seenDomains.add(domain);

    if (SHORTENERS.includes(domain)) {
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

  return factors;
}

function analyzeDomain(domain, factors, options) {
  if (isIpAddress(domain)) {
    factors.push({ name: `url_ip_${domain}`, score: options.ipScore ?? 20 });
  }
  for (const tld of SUSPECT_TLDS) {
    if (domain.endsWith(tld)) {
      factors.push({ name: `url_tld_${tld}`, score: options.tldScore ?? 10 });
      break;
    }
  }
}