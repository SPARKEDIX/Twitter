import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';

/**
 * Best-effort App Check. Needs VITE_RECAPTCHA_SITE_KEY.
 * Get key: Console -> App Check -> Apps -> Register -> reCAPTCHA v3.
 * Dev: set VITE_APPCHECK_DEBUG_TOKEN in .env to use debug token.
 */
export function initAppCheck(app: FirebaseApp): void {
  try {
    const siteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim();
    if (!siteKey) return;
    if (import.meta.env.DEV && (import.meta.env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined)) {
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: unknown }).FIREBASE_APPCHECK_DEBUG_TOKEN =
        import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn('[appCheck] disabled', e);
  }
}
