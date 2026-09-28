import type { ImgHTMLAttributes } from 'react';
import { useAppSelector } from '../hooks/useRedux';
import { resolveGatedSrc } from '../utils/consent';

interface GatedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
}

/**
 * Drop-in `<img>` that honours the third-party image preference.
 *
 * Every profile picture in the app routes through here, which is what makes
 * "reject" mean something rather than just flipping a stored boolean. The
 * gating helpers live in `utils/consent.ts` so this file exports only a
 * component and Fast Refresh keeps working.
 */
const GatedImage = ({ src, alt = '', ...rest }: GatedImageProps) => {
  const thirdPartyAllowed = useAppSelector((state) => state.consent.thirdParty);
  return <img src={resolveGatedSrc(src, thirdPartyAllowed)} alt={alt} {...rest} />;
};

export default GatedImage;
