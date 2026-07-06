const DEFAULT_KEYWORDS = [
  { word: 'free nitro', weight: 20 },
  { word: 'nitro gift', weight: 20 },
  { word: 'claim now', weight: 15 },
  { word: 'discord.gift', weight: 25 },
  { word: 'discordapp.gift', weight: 25 },
  { word: 'discord nitro', weight: 15 },
  { word: 'steam gift', weight: 15 },
  { word: 'wallet', weight: 10 },
  { word: 'airdrop', weight: 15 },
  { word: 'btc', weight: 10 },
  { word: 'metamask', weight: 15 },
  { word: 'crypto', weight: 10 },
  { word: 'eth', weight: 10 },
  { word: 'bnb', weight: 10 },
  { word: 'trx', weight: 10 },
  { word: 'usdt', weight: 15 },
  { word: 'tether', weight: 15 },
  { word: 'binance', weight: 15 },
  { word: 'trust wallet', weight: 20 },
  { word: 'verify wallet', weight: 20 },
  { word: 'connect wallet', weight: 20 },
  { word: 'seed phrase', weight: 25 },
  { word: 'private key', weight: 25 },
  { word: 'recovery phrase', weight: 25 },
  { word: 'send eth', weight: 25 },
  { word: 'send btc', weight: 25 },
  { word: 'send usdt', weight: 25 },
  { word: 'double your', weight: 20 },
  { word: 'withdraw', weight: 15 },
  { word: 'withdrawal', weight: 20 },
  { word: 'withdraw now', weight: 20 },
  { word: 'instant withdraw', weight: 20 },
  { word: 'minimum withdrawal', weight: 15 },
  { word: 'transaction history', weight: 20 },
  { word: 'transaction successful', weight: 20 },
  { word: 'was successful', weight: 15 },
  { word: 'payment successful', weight: 15 },
  { word: 'bank card', weight: 15 },
  { word: 'add bank', weight: 15 },
  { word: 'balance available', weight: 10 },
  { word: 'giveaway', weight: 15 },
  { word: 'crypto giveaway', weight: 25 },
  { word: 'mrbeast', weight: 20 },
  { word: 'elonmusk', weight: 20 },
  { word: 'elon musk', weight: 20 },
  { word: 'retweet', weight: 10 },
  { word: 'followers', weight: 5 },
  { word: 'like and retweet', weight: 20 },
  { word: 'first 100', weight: 15 },
  { word: 'first 50', weight: 15 },
  { word: 'winners', weight: 10 },
  { word: 'you won', weight: 15 },
  { word: 'you have been selected', weight: 20 },
  { word: 'congratulations you', weight: 15 },
  { word: 'verify your account', weight: 15 },
  { word: 'confirm your account', weight: 15 },
  { word: 'validate your', weight: 15 },
  { word: 'suspicious activity', weight: 10 },
  { word: 'temporarily locked', weight: 15 },
  { word: 'account suspended', weight: 15 },
  { word: 'account will be', weight: 10 },
  { word: 'click here to', weight: 10 },
  { word: 'enter your', weight: 10 },
  { word: 'act now', weight: 10 },
  { word: 'limited time', weight: 10 },
  { word: 'expires in', weight: 10 },
  { word: 'urgent action', weight: 15 },
  { word: '0.', weight: 5 },
  { word: 'guaranteed profit', weight: 20 },
  { word: 'risk free', weight: 15 },
  { word: 'investment opportunity', weight: 15 },
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