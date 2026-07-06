const SUSPICIOUS_USERNAME_RE = /^[a-z]+\d{4,}$/i;
const RANDOM_STRING_RE = /^[a-z0-9]{8,}$/i;

export function checkAccountAge(message, options = {}) {
  const minDays = options.accountAgeDays ?? 30;
  const score = options.accountAgeScore ?? 15;
  if (!score || !minDays) return null;

  const now = Date.now();
  const ageMs = now - message.author.createdTimestamp;
  const ageDays = Math.floor(ageMs / 86400000);

  if (ageDays < minDays) {
    console.log(`[ScamGuard][accountCheck] Compte récent: ${ageDays}j (+${score})`);
    return { name: `account_age_${ageDays}d`, score };
  }
  return null;
}

export function checkJoinAge(message, options = {}) {
  const minDays = options.joinAgeDays ?? 7;
  const score = options.joinAgeScore ?? 15;
  if (!score || !minDays || !message.member?.joinedTimestamp) return null;

  const now = Date.now();
  const joinAgeDays = Math.floor((now - message.member.joinedTimestamp) / 86400000);

  if (joinAgeDays < minDays) {
    console.log(`[ScamGuard][accountCheck] Arrivée récente sur le serveur: ${joinAgeDays}j (+${score})`);
    return { name: `join_age_${joinAgeDays}d`, score };
  }
  return null;
}

export function checkNoAvatar(message, options = {}) {
  const score = options.noAvatarScore ?? 5;
  if (!score) return null;

  if (!message.author.avatar) {
    console.log(`[ScamGuard][accountCheck] Pas d'avatar personnalisé (+${score})`);
    return { name: 'no_avatar', score };
  }
  return null;
}

export function checkSuspiciousUsername(message, options = {}) {
  const score = options.suspiciousUsernameScore ?? 10;
  if (!score) return null;

  const username = message.author.username || '';

  if (SUSPICIOUS_USERNAME_RE.test(username)) {
    console.log(`[ScamGuard][accountCheck] Pseudo suspect (mot+chiffres): ${username} (+${score})`);
    return { name: 'suspicious_username', score };
  }

  if (RANDOM_STRING_RE.test(username) && !/[aeiou]{2}/i.test(username)) {
    console.log(`[ScamGuard][accountCheck] Pseudo suspect (chaîne aléatoire): ${username} (+${score})`);
    return { name: 'random_username', score };
  }

  return null;
}

export function checkNoRoles(message, options = {}) {
  const score = options.noRolesScore ?? 5;
  if (!score || !message.member) return null;

  const roleCount = message.member.roles?.cache?.size ?? 0;
  if (roleCount <= 1) {
    console.log(`[ScamGuard][accountCheck] Aucun rôle attribué (+${score})`);
    return { name: 'no_roles', score };
  }
  return null;
}

export function checkNoServerAvatar(message, options = {}) {
  const score = options.noServerAvatarScore ?? 3;
  if (!score || !message.member) return null;

  if (!message.member.avatar) {
    console.log(`[ScamGuard][accountCheck] Pas d'avatar spécifique au serveur (+${score})`);
    return { name: 'no_server_avatar', score };
  }
  return null;
}

export function computeAccountSignals(message, options = {}) {
  console.log(`[ScamGuard][accountCheck] Analyse du compte pour ${message.author.tag} (${message.author.id})`);

  const checks = [
    checkAccountAge,
    checkJoinAge,
    checkNoAvatar,
    checkSuspiciousUsername,
    checkNoRoles,
    checkNoServerAvatar,
  ];

  const signals = checks
    .map(fn => fn(message, options))
    .filter(Boolean);

  console.log(`[ScamGuard][accountCheck] ${signals.length} signal(aux) de compte détecté(s)`);
  return signals;
}