/**
 * fb-utils.mjs — Utilitaires partagés du pipeline FB
 */

/**
 * Ajoute des paramètres UTM aux URLs enomia.app dans le texte d'un draft.
 * Permet le tracking GA4 par commentaire (utm_content = postId).
 *
 * Format : ?utm_source=facebook&utm_medium=community&utm_campaign=lcd-veille&utm_content=g1-1
 *
 * Idempotent : si l'URL contient déjà utm_source=facebook, on ne re-tag pas.
 */
export function injectUtmInEnomiaLinks(text, postId) {
  if (!text || !postId) return text;
  const utmContent = postId.replace(/\./g, '-');
  const utmParams = `utm_source=facebook&utm_medium=community&utm_campaign=lcd-veille&utm_content=${utmContent}`;

  return text.replace(
    /(https?:\/\/(?:www\.)?enomia\.app\/[^\s)\]>,;]*)/g,
    (url) => {
      if (url.includes('utm_source=facebook')) return url; // déjà taggué
      // Sépare la fragment (#...) du reste pour le préserver
      const [base, fragment] = url.split('#');
      const sep = base.includes('?') ? '&' : '?';
      return base + sep + utmParams + (fragment ? '#' + fragment : '');
    }
  );
}
