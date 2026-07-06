const seenUsers = new Set();
const crosspost = new Map();

export function computeUserSignals(message, options = {}) {
  console.log(`[ScamGuard][userSignals] Analyse pour ${message.author.tag} (${message.author.id})`);
  const signals = [];
  const now = Date.now();

  const minAccountDays = options.accountAgeDays ?? 30;
  const accountAgeScore = options.accountAgeScore ?? 15;
  const accountAgeMs = now - message.author.createdTimestamp;
  const accountAgeDays = Math.floor(accountAgeMs / 86400000);
  if (accountAgeDays < minAccountDays) {
    console.log(`[ScamGuard][userSignals] Compte récent: ${accountAgeDays}j (+${accountAgeScore})`);
    signals.push({ name: `account_age_${accountAgeDays}d`, score: accountAgeScore });
  }

  const minJoinDays = options.joinAgeDays ?? 7;
  const joinAgeScore = options.joinAgeScore ?? 15;
  if (message.member?.joinedTimestamp) {
    const joinAgeDays = Math.floor((now - message.member.joinedTimestamp) / 86400000);
    if (joinAgeDays < minJoinDays) {
      console.log(`[ScamGuard][userSignals] Arrivée récente sur le serveur: ${joinAgeDays}j (+${joinAgeScore})`);
      signals.push({ name: `join_age_${joinAgeDays}d`, score: joinAgeScore });
    }
  }

  const firstInteractionScore = options.firstInteractionScore ?? 10;
  if (!seenUsers.has(message.author.id)) {
    seenUsers.add(message.author.id);
    console.log(`[ScamGuard][userSignals] Première interaction détectée (+${firstInteractionScore})`);
    signals.push({ name: 'first_interaction', score: firstInteractionScore });
  }

  const noAvatarScore = options.noAvatarScore ?? 5;
  if (!message.author.avatar) {
    console.log(`[ScamGuard][userSignals] Pas d'avatar personnalisé (+${noAvatarScore})`);
    signals.push({ name: 'no_avatar', score: noAvatarScore });
  }

  const imageOnlyScore = options.imageOnlyScore ?? 10;
  if (message.attachments.size > 0 && !message.content.trim()) {
    console.log(`[ScamGuard][userSignals] Message image seule sans texte (+${imageOnlyScore})`);
    signals.push({ name: 'image_only', score: imageOnlyScore });
  }

  const crosspostScore = options.crosspostScore ?? 20;
  const crosspostWindow = options.crosspostWindow ?? 300000;
  const minChannels = options.crosspostMinChannels ?? 2;
  if (message.content.trim()) {
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

  console.log(`[ScamGuard][userSignals] ${signals.length} signal(aux) détecté(s)`);
  return signals;
}