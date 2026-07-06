const seenUsers = new Set();
const crosspost = new Map();

export function computeUserSignals(message, options = {}) {
  console.log(`[ScamGuard][userSignals] Analyse comportementale pour ${message.author.tag} (${message.author.id})`);
  const signals = [];
  const now = Date.now();

  const firstInteractionScore = options.firstInteractionScore ?? 10;
  if (firstInteractionScore && !seenUsers.has(message.author.id)) {
    seenUsers.add(message.author.id);
    console.log(`[ScamGuard][userSignals] Première interaction détectée (+${firstInteractionScore})`);
    signals.push({ name: 'first_interaction', score: firstInteractionScore });
  }

  const imageOnlyScore = options.imageOnlyScore ?? 10;
  if (imageOnlyScore && message.attachments.size > 0 && !message.content.trim()) {
    console.log(`[ScamGuard][userSignals] Message image seule sans texte (+${imageOnlyScore})`);
    signals.push({ name: 'image_only', score: imageOnlyScore });
  }

  const crosspostScore = options.crosspostScore ?? 20;
  const crosspostWindow = options.crosspostWindow ?? 300000;
  const minChannels = options.crosspostMinChannels ?? 2;
  if (crosspostScore && crosspostWindow && message.content.trim()) {
    const key = message.content.trim().toLowerCase();
    const entries = (crosspost.get(key) || []).filter(e => now - e.ts < crosspostWindow);
    entries.push({ channelId: message.channel.id, ts: now });
    crosspost.set(key, entries);
    const uniqueChannels = new Set(entries.map(e => e.channelId)).size;
    if (uniqueChannels >= minChannels) {
      console.log(`[ScamGuard][userSignals] Crosspost détecté sur ${uniqueChannels} salons (+${crosspostScore})`);
      signals.push({ name: `crosspost_${uniqueChannels}ch`, score: crosspostScore });
    }
  }

  console.log(`[ScamGuard][userSignals] ${signals.length} signal(aux) comportemental(aux) détecté(s)`);
  return signals;
}