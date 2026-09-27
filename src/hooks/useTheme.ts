import { useEffect } from 'react';
import { useAppSelector } from './useRedux';

/**
 * Mirrors `ui.theme` onto the document so CSS can react to it.
 *
 * The Redux slice stored the theme but nothing ever wrote it to the DOM,
 * which made the sun/moon button in the header a visual no-op.
 */
export const useThemeSync = () => {
  const theme = useAppSelector((state) => state.ui.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);
};
