import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './Privacy.css';

/**
 * Sections are data-driven so the sticky index can never drift out of sync
 * with the body. Adding a clause means adding one array entry, not editing
 * two places and hoping.
 */
interface Clause {
  id: string;
  num: string;
  title: string;
  body: ReactNode;
}

const EFFECTIVE = '28 September 2026';

const clauses: Clause[] = [
  {
    id: 'what-this-is',
    num: '01',
    title: 'What this app is',
    body: (
      <>
        <p>
          This is a demonstration build of a Twitter-style timeline. It is a
          static web application: the code runs in your browser, there is no
          server operated by us, and the content you see in the timeline â€”
          tweets, profiles, notifications, conversations â€” is fictional sample
          data bundled with the app.
        </p>
        <p>
          It is not affiliated with, endorsed by, or connected to X Corp,
          Twitter, or any of their subsidiaries.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    num: '02',
    title: 'What we collect',
    body: (
      <>
        <p>
          We operate no analytics, no advertising, and no tracking scripts. The
          only information this app handles is what you type into it, and it
          goes directly from your browser to Google&rsquo;s Firebase services.
          We never receive it.
        </p>
        <p>Specifically, that means:</p>
        <ul>
          <li>
            <strong>Account details.</strong> If you sign up with an email and
            password, Firebase stores that address and a securely hashed
            version of your password. If you sign in with Google, GitHub, or
            Apple, that provider shares your name, email address, and profile
            picture instead.
          </li>
          <li>
            <strong>Your profile.</strong> A display name you type, plus a
            username and avatar derived from the account. These are written to
            a Firestore document at <code>users/&#123;your-account-id&#125;</code>{' '}
            so the app has a stable identity to render.
          </li>
          <li>
            <strong>Your theme preference.</strong> Light or dark, kept in your
            browser&rsquo;s local storage.
          </li>
        </ul>
        <p>
          We do not ask for your date of birth, phone number, or location, and
          we have no way to see posts you compose â€” they stay in the browser tab
          and are discarded on refresh.
        </p>
      </>
    ),
  },
  {
    id: 'how-it-is-used',
    num: '03',
    title: 'How it is used',
    body: (
      <>
        <p>
          Your account exists for one purpose: to sign you in to this app. The
          data is used to authenticate you, render your name and avatar, and
          keep you signed in across page reloads. That is the complete list.
        </p>
        <p>
          Your data is never sold, rented, or shared for advertising. It is not
          used to build a profile of you, and it is never used to train a model.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    num: '04',
    title: 'Third parties',
    body: (
      <>
        <p>
          Authentication and profile storage are provided by{' '}
          <strong>Google Firebase</strong>. Your credentials pass through
          Google&rsquo;s infrastructure, and Google&rsquo;s own privacy policy
          and terms govern that processing. We have no access to the Firebase
          project&rsquo;s data.
        </p>
        <p>
          If you sign in with a third-party provider, that provider handles
          authentication under its own policy. Apple sign-in, for example, may
          conceal your email address from us and from Firebase.
        </p>
        <p>
          The sign-in screen loads no fonts, images, or scripts from any
          third-party origin — the application ships everything it needs from
          the same host you loaded it from.
        </p>
        <p>
          The sample timeline is the exception, and it is worth being precise
          about: the fictional tweets and profiles ship with avatar URLs pointing
          at third-party image hosts (Twitter&rsquo;s image CDN and
          <code>via.placeholder.com</code>). Viewing them makes your browser
          issue ordinary image requests to those hosts, which is visible to them
          in the ordinary way. Replace the URLs in{' '}
          <code>src/utils/mockData.ts</code> with local assets to eliminate this
          entirely.
        </p>
        <p>
          None of this carries any identifier. Those hosts see the same request
          an image anywhere on the web would show them, and nothing links it to
          your account.
        </p>
      </>
    ),
  },
  {
    id: 'cookies-and-storage',
    num: '05',
    title: 'Cookies and local storage',
    body: (
      <>
        <p>
          This app sets no cookies. It uses two browser storage mechanisms, both
          readable only by this app on this device:
        </p>
        <ul>
          <li>
            <strong>Firebase auth persistence</strong> â€” stores your session
            token so you stay signed in after closing the tab. Signing out
            removes it.
          </li>
          <li>
            <strong><code>twitter-clone:theme</code></strong> â€” stores{' '}
            <code>light</code> or <code>dark</code>. Cosmetic, and safe to
            delete at any time.
          </li>
        </ul>
        <p>
          No advertising or cross-site tracking cookies are set, because there is
          no third party to set them.
        </p>
      </>
    ),
  },
  {
    id: 'offline',
    num: '06',
    title: 'Offline use and the service worker',
    body: (
      <p>
        This app is installable as a progressive web app. Once installed, a
        service worker caches the application shell and static assets on your
        device so it can open and render without a network connection. That
        cache is stored by your browser, not sent anywhere, and is cleared when
        you uninstall the app or clear site data.
      </p>
    ),
  },

  {
    id: 'your-rights',
    num: '07',
    title: 'Your rights',
    body: (
      <>
        <p>
          You can exercise the following at any time, without contacting us,
          because everything is under your control:
        </p>
        <ul>
          <li>
            <strong>Access and export</strong> — sign in, and the app shows the
            name and avatar associated with your account.
          </li>
          <li>
            <strong>Edit</strong> — your display name is editable in your
            Firebase account settings.
          </li>
          <li>
            <strong>Delete</strong> — deleting your account in Firebase removes
            your authentication record permanently. Profile data can be removed
            the same way.
          </li>
          <li>
            <strong>Withdraw consent</strong> — stop using the app; nothing
            further is collected.
          </li>
        </ul>
        <p>
          Because we do not hold a copy of your data, we cannot export or erase
          it on your behalf. The controls in the product are the fastest route.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    num: '08',
    title: 'Children',
    body: (
      <p>
        This is a demonstration project and is not directed at children under 13
        or any equivalent minimum age in your jurisdiction. We do not knowingly
        collect information from children. If you believe a child has created an
        account, delete it through Firebase and it will be removed.
      </p>
    ),
  },
  {
    id: 'security',
    num: '09',
    title: 'Security',
    body: (
      <>
        <p>
          Passwords are never transmitted to or stored by this application. The
          Firebase SDK hashes them before they leave your device, and Firebase
          applies rate limiting to block credential-stuffing attempts.
        </p>
        <div className="privacy__callout">
          <strong>On the API key</strong>
          The Firebase web configuration key in this app&rsquo;s source is not a
          secret. Client keys are designed to ship inside browser bundles and
          are meant to be public. What actually protects the project is Firebase
          Security Rules and API-key restrictions, not hiding the key.
        </div>
      </>
    ),
  },
  {
    id: 'changes',
    num: '10',
    title: 'Changes to this policy',
    body: (
      <p>
        If this policy changes, the effective date at the top of the page will
        change. Material changes — involving data we now collect, or a new third
        party — will be called out in the app rather than applied silently.
      </p>
    ),
  },
];


const Privacy = () => (
  <div className="privacy">
    <div className="privacy__bar">
      <Link to="/" className="privacy__back">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
        </svg>
        Back
      </Link>
      <span className="privacy__stamp">Privacy</span>
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
        <h1 className="privacy__title">Privacy policy</h1>
        <p className="privacy__meta">
          <span>Effective {EFFECTIVE}</span>
          <span>Version 1.0</span>
        </p>

        <p className="privacy__standfirst">
          This is a demo application. It has no server, no analytics, and no
          advertising. Everything you type goes straight from your browser to
          Google&rsquo;s Firebase, and never reaches us.
        </p>

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
          <Link to="/login">Sign in</Link>
        </footer>
      </article>
    </div>
  </div>
);

export default Privacy;

