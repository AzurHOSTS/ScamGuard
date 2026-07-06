const DEFAULT_KEYWORDS = [
  { word: 'free nitro', weight: 20 },
  { word: 'claim now', weight: 15 },
  { word: 'airdrop', weight: 15 },
  { word: 'wallet', weight: 10 },
  { word: 'steam gift', weight: 15 },
  { word: 'discord.gift', weight: 25 },
  { word: '0.', weight: 5 },
  { word: 'btc', weight: 10 },
  { word: 'metamask', weight: 15 },
  { word: 'giveaway', weight: 15 },
  { word: 'mrbeast', weight: 20 },
  { word: 'elonmusk', weight: 20 },
  { word: 'elon musk', weight: 20 },
  { word: 'retweet', weight: 10 },
  { word: 'followers', weight: 5 },
  { word: 'like and retweet', weight: 20 },
  { word: 'first 100', weight: 15 },
  { word: 'winners', weight: 10 },
  { word: 'crypto giveaway', weight: 25 },
  { word: 'double your', weight: 20 },
  { word: 'send eth', weight: 25 },
  { word: 'send btc', weight: 25 },
  { word: 'verify wallet', weight: 20 },
  { word: 'connect wallet', weight: 20 },
  { word: 'validate your', weight: 15 },
  { word: 'suspicious activity', weight: 10 },
  { word: 'temporarily locked', weight: 15 },
  { word: 'confirm your account', weight: 15 },
  { word: 'withdraw', weight: 15 },
  { word: 'usdt', weight: 15 },
  { word: 'tether', weight: 15 },
  { word: 'bank card', weight: 15 },
  { word: 'crypto', weight: 10 },
  { word: 'eth', weight: 10 },
  { word: 'bnb', weight: 10 },
  { word: 'trx', weight: 10 },
  { word: 'binance', weight: 15 },
  { word: 'trust wallet', weight: 20 },
  { word: 'seed phrase', weight: 25 },
  { word: 'private key', weight: 25 },
  { word: 'enter your', weight: 10 },
  { word: 'withdraw now', weight: 20 },
  { word: 'instant withdraw', weight: 20 },
  { word: 'minimum withdrawal', weight: 15 },
];

export function checkKeywords(text, keywords = DEFAULT_KEYWORDS) {
  console.log(`[ScamGuard][keywordCheck] Analyse du texte (longueur: ${text?.length || 0})`);
  const factors = [];
  const lower = (text || '').toLowerCase();
  for (const { word, weight } of keywords) {
    if (lower.includes(word.toLowerCase())) {
      console.log(`[ScamGuard][keywordCheck] Mot-clé détecté: "${word}" (+${weight})`);
      factors.push({ name: word.replace(/\s/g, '_'), score: weight });
    }
  }
  console.log(`[ScamGuard][keywordCheck] ${factors.length} facteur(s) trouvé(s)`);
  return factors;
}

export { DEFAULT_KEYWORDS };