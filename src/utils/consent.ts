/**
 * Inline SVG placeholder used when third-party images are declined.
 *
 * A data URI rather than a file so the swap costs no extra request - which is
 * the entire point of declining. Without this the browser would still hit the
 * CDN just to be told the image is not allowed.
 */
export const BLOCKED_AVATAR =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <rect width="40" height="40" fill="#8b98a5"/>
      <circle cx="20" cy="15.5" r="6" fill="#e7e9ea"/>
      <path d="M7 36c0-7.2 5.8-12 13-12s13 4.8 13 12z" fill="#e7e9ea"/>
    </svg>`
  );

/** Only absolute cross-origin URLs count as third-party. */
export const isThirdPartyUrl = (src: string | undefined | null): boolean => {
  if (!src) return false;
  if (src.startsWith('data:') || src.startsWith('blob:')) return false;
  if (src.startsWith('/')) return false;
  return /^https?:\/\//i.test(src);
};

/**
 * Resolves an image `src` against the visitor's third-party consent.
 *
 * Used by the avatar component and by the profile banner, which is a CSS
 * background rather than an `<img>`.
 */
export const resolveGatedSrc = (
  src: string | undefined | null,
  thirdPartyAllowed: boolean
): string | undefined => {
  if (!src) return undefined;
  if (thirdPartyAllowed || !isThirdPartyUrl(src)) return src;
  return BLOCKED_AVATAR;
};
