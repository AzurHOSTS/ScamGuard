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
];

export function checkKeywords(text, keywords = DEFAULT_KEYWORDS) {
  const factors = [];
  const lower = text.toLowerCase();
  for (const { word, weight } of keywords) {
    if (lower.includes(word.toLowerCase())) {
      factors.push({ name: word.replace(/\s/g, '_'), score: weight });
    }
  }
  return factors;
}