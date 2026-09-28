'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import './sign-in-page.css'

export type AuthMode = 'signin' | 'signup'

export interface AuthFormData {
  email: string
  password: string
  displayName: string
  rememberMe: boolean
}

interface LoginPageProps {
  /** Driven by `auth.pending` in Redux. */
  isLoading?: boolean
  /** Driven by the rejected thunk message - e.g. "Incorrect password." */
  error?: string | null
  /** Set once Firebase confirms the reset email was dispatched. */
  resetEmailSent?: boolean
  onSignIn?: (formData: AuthFormData) => Promise<void>
  onSignUp?: (formData: AuthFormData) => Promise<void>
  onGoogleLogin?: () => Promise<void>
  onGitHubLogin?: () => Promise<void>
  onAppleLogin?: () => Promise<void>
  onForgotPassword?: (email: string) => Promise<void>
}

/** Mirrors Firebase's own password policy so the user fails fast, not after a round-trip. */
const MIN_PASSWORD_LENGTH = 6
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage({
  isLoading = false,
  error = null,
  resetEmailSent = false,
  onSignIn,
  onSignUp,
  onGoogleLogin,
  onGitHubLogin,
  onAppleLogin,
  onForgotPassword
}: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  /** Client-side validation only. Server errors arrive via the `error` prop. */
  const [localError, setLocalError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    rememberMe: false
  })

  const isSignUp = mode === 'signup'
  const busy = isLoading
  // Local validation wins: it is more specific than a stale server message.
  const visibleError = localError ?? error

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setLocalError(null)
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setLocalError(null)
    setForgotPassword(false)
  }

  const validate = (): string | null => {
    if (!formData.email.trim()) return 'Please enter your email address.'
    if (!EMAIL_PATTERN.test(formData.email.trim())) return 'Please enter a valid email address.'
    if (!formData.password) return 'Please enter your password.'
    if (isSignUp && !formData.displayName.trim()) return 'Please tell us what to call you.'
    if (isSignUp && formData.password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    }
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return

    if (forgotPassword) {
      setLocalError(null)
      if (!EMAIL_PATTERN.test(formData.email.trim())) {
        setLocalError('Enter your email address so we know where to send the link.')
        return
      }
      try {
        await onForgotPassword?.(formData.email.trim())
      } catch {
        // The parent already surfaced the Firebase message through `error`.
      }
      return
    }

    const validationError = validate()
    if (validationError) {
      setLocalError(validationError)
      return
    }

    setLocalError(null)
    try {
      await (isSignUp ? onSignUp?.(formData) : onSignIn?.(formData))
    } catch {
      // Intentionally swallowed: the parent stores the message in Redux and
      // hands it back through `error`. Rethrowing would duplicate the surface.
    }
  }

  const handleSocialLogin = async (provider?: () => Promise<void>) => {
    if (busy) return
    setLocalError(null)
    try {
      await provider?.()
    } catch {
      // Same as above - `error` carries the Firebase message.
    }
  }

  const heading = forgotPassword
    ? { eyebrow: 'Account recovery', title: 'Reset your password', sub: 'We will email you a link to choose a new one. Sending a reset for an address with no account is a no-op, so you will not learn whether an email is registered.' }
    : isSignUp
      ? { eyebrow: 'Create account', title: 'Join the conversation.', sub: 'A display name, an email, and six characters. That is the whole of it.' }
      : { eyebrow: 'Sign in', title: 'Welcome back.', sub: 'Pick up where your timeline left off.' }

  return (
    <div className="auth">
      <header className="auth__bar">
        <Link to="/" className="auth__mark">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>Twitter</span>
        </Link>
        <nav className="auth__bar-links" aria-label="Legal">
          <Link to="/privacy" className="auth__bar-link">
            Privacy
          </Link>
        </nav>
      </header>

      <div className="auth__main">
        <div className="auth__lede">
          <p className="auth__eyebrow">{heading.eyebrow}</p>
          <h1 className="auth__title">{heading.title}</h1>
          <p className="auth__sub">{heading.sub}</p>
          {!forgotPassword && (
            <p className="auth__switch">
              {isSignUp ? 'Already have an account?' : 'No account yet?'}{' '}
              <button
                type="button"
                className="auth__switch-btn"
                onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
                disabled={busy}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          )}
        </div>

        <div className="auth__form-wrap">
          {visibleError && (
            <p className={`auth__alert auth__alert--error`} role="alert" style={{ marginBottom: 22 }}>
              {visibleError}
            </p>
          )}

          {forgotPassword && resetEmailSent && (
            <p className="auth__alert auth__alert--ok" role="status" style={{ marginBottom: 22 }}>
              If an account exists for <strong>{formData.email.trim()}</strong>, a reset link is on its way.
            </p>
          )}

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            {isSignUp && !forgotPassword && (
              <div className="auth__field">
                <label className="auth__label" htmlFor="displayName">
                  Display name
                </label>
                <input
                  id="displayName"
                  className="auth__input"
                  type="text"
                  name="displayName"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  disabled={busy}
                />
              </div>
            )}

            <div className="auth__field">
              <label className="auth__label" htmlFor={forgotPassword ? 'reset-email' : 'email'}>
                Email address
              </label>
              <input
                id={forgotPassword ? 'reset-email' : 'email'}
                className="auth__input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@domain.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={busy}
              />
            </div>


            {!forgotPassword && (
              <div className="auth__field">
                <label className="auth__label" htmlFor="password">
                  Password
                </label>
                <div className="auth__input-wrap">
                  <input
                    id="password"
                    className="auth__input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="auth__reveal"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={busy}
                  >
                    {showPassword ? (
                      <EyeOff width={17} height={17} aria-hidden="true" />
                    ) : (
                      <Eye width={17} height={17} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {forgotPassword ? (
              <button
                type="button"
                className="auth__submit"
                onClick={() => {
                  setForgotPassword(false)
                  setLocalError(null)
                }}
              >
                Back to sign in
              </button>
            ) : (
              <div className="auth__row">
                <label className="auth__check">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    disabled={busy}
                  />
                  <span>Keep me signed in</span>
                </label>
                <button
                  type="button"
                  className="auth__link-btn"
                  onClick={() => {
                    setForgotPassword(true)
                    setLocalError(null)
                  }}
                  disabled={busy}
                >
                  Forgot password
                </button>
              </div>
            )}

            <button
              type="submit"
              className="auth__submit"
              data-busy={busy}
              disabled={busy || (forgotPassword && resetEmailSent)}
            >
              {forgotPassword
                ? busy
                  ? 'Sending'
                  : 'Email me a link'
                : busy
                  ? isSignUp
                    ? 'Creating account'
                    : 'Signing in'
                  : isSignUp
                    ? 'Create account'
                    : 'Sign in'}
            </button>


            {!forgotPassword && (
              <>
                <div className="auth__divider">or</div>

                <div className="auth__socials">
                  <button
                    type="button"
                    className="auth__social"
                    onClick={() => handleSocialLogin(onGoogleLogin)}
                    disabled={busy}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    className="auth__social"
                    onClick={() => handleSocialLogin(onAppleLogin)}
                    disabled={busy}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M16.365 1.43c0 1.14-.42 2.2-1.23 3.02-.99 1.09-2.19 1.75-3.55 1.65-.15-1.1.4-2.29 1.16-3.05.81-.82 2.26-1.4 3.62-1.45v.83zm4.28 15.32c-.57 1.3-.84 1.88-1.57 3.03-1.01 1.6-2.44 3.59-4.2 3.61-1.66.03-2.1-1.06-4.34-1.04-2.23.02-2.72 1.07-4.37 1.04-1.76-.03-3.1-1.83-4.12-3.42-2.87-4.45-3.16-8.7-1.38-11.16 1.28-1.77 3.3-2.85 5.24-2.85 1.97 0 3.21 1.05 4.83 1.05 1.58 0 2.54-1.05 4.82-1.05 1.72 0 3.54.94 4.82 2.58-4.24 2.32-3.55 7.87.73 9.28z" />
                    </svg>
                    <span>Apple</span>
                  </button>

                  <button
                    type="button"
                    className="auth__social"
                    onClick={() => handleSocialLogin(onGitHubLogin)}
                    disabled={busy}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      <footer className="auth__foot">
        <span>Secured by Firebase Authentication</span>
        <div className="auth__foot-links">
          <Link to="/privacy" className="auth__foot-link">
            Privacy policy
          </Link>
          <Link to="/cookies" className="auth__foot-link">
            Cookie policy
          </Link>
          <Link to="/" className="auth__foot-link">
            Browse without signing in
          </Link>
        </div>
      </footer>
    </div>
  )
}

