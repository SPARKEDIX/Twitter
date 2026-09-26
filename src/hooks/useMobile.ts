import { useState, useLayoutEffect } from 'react';

export const useMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};