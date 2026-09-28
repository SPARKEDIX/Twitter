import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { reopenConsentPanel } from '../store/consentSlice';
// The document archetype is defined once by the privacy page; the ledger below
// is the only thing that differentiates the two.
import './Privacy.css';
import './Cookies.css';

const EFFECTIVE = '28 September 2026';

interface Clause {
  id: string;
  num: string;
  title: string;
  body: ReactNode;
}

const clauses: Clause[] = [
  {
    id: 'the-short-version',
    num: '01',
    title: 'The short version',
    body: (
      <>
        <p>
          This application sets <strong>no cookies</strong>. It uses no
          advertising, no analytics, and no third-party tracking scripts, and it
          has no server, so nobody â€” including us â€” can see what you do in it.
        </p>
        <p>
          What it does use is your browser&rsquo;s own storage, plus image
          requests to external hosts for the sample profile pictures. Both are
          itemised below, and both are under your control.
        </p>
      </>
    ),
  },
  {
    id: 'what-is-stored',
    num: '02',
    title: 'What is stored on your device',
    body: (
      <>
        <p>
          Three keys exist, all readable only by this app on this device. None
          is transmitted anywhere.
        </p>
        <table className="cookies__table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Purpose</th>
              <th scope="col">Optional?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Name" className="cookies__key">twitter-clone:theme</td>
              <td data-label="Purpose">
                Remembers whether you picked the light or dark theme.
              </td>
              <td data-label="Optional?">
                <span className="cookies__off">No</span>
              </td>
            </tr>
            <tr>
              <td data-label="Name" className="cookies__key">twitter-clone:consent</td>
              <td data-label="Purpose">
                Remembers your answer on this page so the banner does not ask
                on every visit.
              </td>
              <td data-label="Optional?">
                <span className="cookies__off">No</span>
              </td>
            </tr>
            <tr>
              <td data-label="Name" className="cookies__key">
                Firebase auth store
                <br />
                <span style={{ fontWeight: 400 }}>
                  IndexedDB, with a localStorage fallback
                </span>
              </td>
              <td data-label="Purpose">
                Holds your Firebase session token so you stay signed in after
                closing the tab. Signing out deletes it.
              </td>
              <td data-label="Optional?">
                <span className="cookies__off">No</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          Clearing your browser&rsquo;s site data removes all three. The next
          visit will simply ask again and show the light theme.
        </p>
      </>
    ),
  },
  {
    id: 'what-is-not-set',
    num: '03',
    title: 'What is deliberately not set',
    body: (
      <>
        <p>
          Because there is no server and no third-party script, the usual
          suspects simply do not exist here:
        </p>
        <ul>
          <li>No advertising or retargeting cookies.</li>
          <li>No analytics or page-view beacons.</li>
          <li>No session fingerprinting or canvas probes.</li>
          <li>No social widgets, embedded players, or share buttons.</li>
          <li>No consent-mode or cross-site tracking parameters.</li>
        </ul>
        <p>
          There is no such thing as a &ldquo;cookie wall&rdquo; on this site,
          because refusing everything optional still leaves you with a fully
          working app.
        </p>
      </>
    ),
  },
  {
    id: 'third-party-requests',
    num: '04',
    title: 'Third-party image requests',
    body: (
      <>
        <p>
          The one outbound request this app can make is for images. The fictional
          tweets and profiles ship with avatar URLs pointing at third-party image
          hosts â€” Twitter&rsquo;s image CDN and <code>via.placeholder.com</code>.
          Rendering a timeline makes your browser request those images normally.
        </p>
        <p>
          Those hosts observe an ordinary image fetch. They cannot tell who you
          are, cannot associate the request with your account, and receive
          nothing from this app beyond the fact that an image was requested.
        </p>
        <p>
          Declining the third-party category swaps every one of those URLs for an
          inline SVG placeholder, so no request leaves the site you loaded from
          and the layout is unchanged. The gate lives in{' '}
          <code>src/components/GatedImage.tsx</code> and is applied to every
          avatar and the profile banner.
        </p>
        <div className="privacy__callout">
          <strong>Verify it yourself</strong>
          Open your browser&rsquo;s network panel, decline third-party images,
          then load the timeline. No request should appear for any host other
          than the one serving the app.
        </div>
      </>
    ),
  },
];

clauses.push(
  {
    id: 'change-your-mind',
    num: '05',
    title: 'Changing your mind',
    body: (
      <>
        <p>
          Consent is revocable at any time, and doing so takes effect
          immediately â€” no reload required, because every avatar in the app is
          subscribed to the preference.
        </p>
        <p>
          You can also block third-party requests at the browser or network
          level, which is the stronger guarantee: it applies to everything,
          including anything a future version might add.
        </p>
      </>
    ),
  },
  {
    id: 'browser-controls',
    num: '06',
    title: 'Browser controls',
    body: (
      <>
        <p>
          Every major browser lets you delete site data, block third-party
          requests per site, and inspect what a page stores. This application
          cooperates with all of them: nothing is hidden from the settings you
          already have.
        </p>
        <p>
          Note that blocking storage entirely will sign you out on every visit,
          because the Firebase session lives there.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    num: '07',
    title: 'Changes',
    body: (
      <p>
        If this app ever starts setting a real cookie, this page and the banner
        will change before it ships, and the new entry will name the cookie, its
        purpose, and how long it lasts. A category with nothing in it will be
        removed rather than left in place as a placeholder.
      </p>
    ),
  }
);

const Cookies = () => {
  const dispatch = useAppDispatch();
  const hasDecided = useAppSelector((state) => state.consent.hasDecided);

  return (
    <div className="privacy">
      <div className="privacy__bar">
        <Link to="/" className="privacy__back">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
          </svg>
          Back
        </Link>
        <span className="privacy__stamp">Cookies</span>
      </div>

      <div className="privacy__shell">
        <nav className="privacy__index" aria-label="Sections">
          <p className="privacy__index-title">Contents</p>
          <ol>
            {clauses.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>{c.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="privacy__doc">
          <p className="privacy__eyebrow">Legal</p>
          <h1 className="privacy__title">Cookie policy</h1>
          <p className="privacy__meta">
            <span>Effective {EFFECTIVE}</span>
            <span>Version 1.0</span>
          </p>

          <p className="privacy__standfirst">
            This app sets no cookies. It uses your browser&rsquo;s local storage
            and, optionally, external image requests â€” and the difference is
            listed here in full rather than summarised behind a link nobody
            opens.
          </p>

          <div className="cookies__choice">
            <p className="cookies__choice-text">
              {hasDecided
                ? 'Your choice is saved on this device. Reopen the panel to change it.'
                : 'You have not made a choice yet, or you cleared your site data. You can set one now.'}
            </p>
            <button
              type="button"
              className="cookies__btn"
              onClick={() => dispatch(reopenConsentPanel())}
            >
              {hasDecided ? 'Change preferences' : 'Choose preferences'}
            </button>
          </div>

          <div className="privacy__body">
            {clauses.map((c) => (
              <section key={c.id} id={c.id} className="privacy__section">
                <h2 className="privacy__h2">
                  <span>{c.num}</span>
                  {c.title}
                </h2>
                {c.body}
              </section>
            ))}
          </div>

          <footer className="privacy__foot">
            <span>Effective {EFFECTIVE}</span>
            <Link to="/privacy">Privacy policy</Link>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default Cookies;

