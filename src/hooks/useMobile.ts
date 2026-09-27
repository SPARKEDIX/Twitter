import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a media query without the setState-in-effect pattern.
 *
 * `useSyncExternalStore` gives us the correct value on the very first
 * client render (no desktop-then-mobile layout flash) and avoids the
 * cascading re-render that `useState` + `useLayoutEffect` produced.
 */
const subscribeToMediaQuery = (query: string) => (onStoreChange: () => void) => {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
};

export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(subscribeToMediaQuery(query), [query]);
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  // Server snapshot assumes desktop; the client corrects it before paint.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};

/**
 * `breakpoint` follows the same convention as the CSS media queries in
 * this project: `max-width: 768px` includes 768 itself, so the JS check
 * must be `<=` and not `<` (the old `<` disagreed with the stylesheet
 * at exactly 768px).
 */
export const MOBILE_BREAKPOINT = 768;

export const useMobile = (breakpoint: number = MOBILE_BREAKPOINT): boolean =>
  useMediaQuery(`(max-width: ${breakpoint}px)`);
