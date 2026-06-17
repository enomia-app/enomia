/**
 * Injecte des transformations Cloudinary (format auto, qualité auto, largeur max)
 * dans une URL d'image stockée, pour servir une image dimensionnée au lieu du
 * fichier original pleine résolution.
 *
 * Gère les deux formes d'URL rencontrées dans le contenu :
 *   - brute :        .../image/upload/v1776878680/fichier.webp
 *   - déjà transformée : .../image/upload/q_auto,f_auto,w_1200/v123/fichier.png
 * (dans le second cas, le segment de transformation existant est remplacé.)
 *
 * `c_limit` garantit qu'on ne fait jamais d'upscale (ratio préservé, pas de CLS).
 * Renvoie l'URL inchangée si ce n'est pas une URL Cloudinary.
 */
export function cldImg(src: string, width: number): string {
  if (!src || !src.includes('res.cloudinary.com') || !src.includes('/upload/')) {
    return src;
  }
  const transform = `f_auto,q_auto,w_${width},c_limit`;
  const [base, rest] = src.split('/upload/');
  const segments = rest.split('/');
  // Un segment de transformation Cloudinary contient une syntaxe `xx_yy` et n'est
  // ni une version (`v123`) ni le nom de fichier final.
  const first = segments[0];
  // Segment de transformation = paramètres Cloudinary (`xx_yy`), ni une version
  // (`v123`), ni un nom de fichier (qui porte une extension).
  const isExistingTransform =
    !/^v\d+$/.test(first) && !/\.[a-z0-9]+$/i.test(first) && /[a-z]_/.test(first);
  const tail = isExistingTransform ? segments.slice(1).join('/') : segments.join('/');
  return `${base}/upload/${transform}/${tail}`;
}
