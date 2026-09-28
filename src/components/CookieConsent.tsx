import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  acceptAll,
  rejectOptional,
  saveConsent,
  CATEGORY_META,
  OPTIONAL_CATEGORIES,
  type ConsentCategory,
} from '../store/consentSlice';
import './CookieConsent.css';

/** Routes the banner would only obstruct - the pages that explain it. */
const EXEMPT_PATHS = new Set(['/privacy', '/cookies']);

/**
 * Consent notice.
 *
 * Renders nothing once a decision is on record, and nothing on the two legal
 * pages. The expanded panel is local state rather than a modal so managing
 * preferences never navigates away or traps focus - this is a small,
 * reversible choice, not a flow.
 */
const CookieConsent = () => {
  const dispatch = useAppDispatch();
  const consent = useAppSelector((state) => state.consent);
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);

  // Prefill the switches from stored state so reopening shows the truth.
  const [draft, setDraft] = useState<Record<ConsentCategory, boolean>>({
    essential: true,
    preferences: consent.preferences,
    thirdParty: consent.thirdParty,
  });

  if (consent.hasDecided || EXEMPT_PATHS.has(pathname)) return null;

  const toggle = (category: ConsentCategory) => {
    setDraft((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <aside className="consent" role="region" aria-label="Privacy choices">
      <div className="consent__panel">
        <div className="consent__head">
          <span>Privacy choices</span>
          <Link to="/cookies" className="consent__toggle" style={{ marginLeft: 0, order: 0 }}>
            Cookie policy
          </Link>
        </div>

        <div className="consent__body">
          <h2 className="consent__title">This app sets no cookies.</h2>
          <p className="consent__text">
            It keeps your sign-in state and theme in your browser&rsquo;s local storage, and the
            sample timeline loads profile pictures from external image hosts. Nothing is sent to
            us, because we run no server. You can decline the external images and the app will use
            local placeholders instead — see the <Link to="/cookies">cookie policy</Link> for the
            full detail.
          </p>

          {expanded && (
            <div className="consent__cats">
              {(Object.keys(CATEGORY_META) as ConsentCategory[]).map((category) => {
                const meta = CATEGORY_META[category];
                const locked = !OPTIONAL_CATEGORIES.includes(category);
                return (
                  <div className="consent__cat" key={category}>
                    <div>
                      <p className="consent__cat-name">{meta.label}</p>
                      <p className="consent__cat-summary">{meta.summary}</p>
                    </div>
                    {locked ? (
                      <span className="consent__locked">Always on</span>
                    ) : (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft[category]}
                        aria-label={meta.label}
                        className="consent__switch"
                        onClick={() => toggle(category)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="consent__actions">
            <button type="button" className="consent__btn" onClick={() => dispatch(acceptAll())}>
              Accept all
            </button>
            <button
              type="button"
              className="consent__btn consent__btn--ghost"
              onClick={() => dispatch(rejectOptional())}
            >
              Essential only
            </button>
            {expanded ? (
              <>
                <button
                  type="button"
                  className="consent__btn consent__btn--ghost"
                  onClick={() => dispatch(saveConsent(draft))}
                >
                  Save selection
                </button>
                <button
                  type="button"
                  className="consent__toggle"
                  onClick={() => setExpanded(false)}
                >
                  Hide options
                </button>
              </>
            ) : (
              <button type="button" className="consent__toggle" onClick={() => setExpanded(true)}>
                Manage preferences
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CookieConsent;
