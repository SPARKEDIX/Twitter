'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50'
const labelClass = 'block text-sm font-medium text-gray-700 mb-2'
const socialBtnClass =
  'flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'

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
  const navigate = useNavigate()
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

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex">
      {/* Left Panel - Image Section */}
      <div className="flex-1 relative overflow-hidden hidden lg:block">
        <div className="absolute top-6 left-6 z-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back to home"
            className="w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1920&q=80"
            alt="Brand Asset"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="flex-1 flex items-center justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-md p-8 my-8">
          {forgotPassword ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset your password</h1>
              <p className="text-gray-600 mb-8">We&apos;ll email you a link to choose a new one.</p>

              {resetEmailSent && (
                <div
                  role="status"
                  className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 mb-6"
                >
                  If an account exists for <strong>{formData.email.trim()}</strong>, a reset link is on its
                  way. Check your spam folder if it doesn&apos;t arrive in a minute.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {visibleError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {visibleError}
                  </div>
                )}

                <div>
                  <label htmlFor="reset-email" className={labelClass}>Email Address</label>
                  <input
                    id="reset-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    className={inputClass}
                    required
                    disabled={busy}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={busy || resetEmailSent}
                >
                  {busy ? 'Sending...' : 'Send reset link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(false)
                    setLocalError(null)
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back to sign in
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isSignUp ? 'Create your account' : 'Welcome Back'}
                </h1>
                <p className="text-gray-600">
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <button
                    type="button"
                    onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {visibleError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {visibleError}
                  </div>
                )}

                {isSignUp && (
                  <div>
                    <label htmlFor="displayName" className={labelClass}>Display name</label>
                    <input
                      id="displayName"
                      type="text"
                      name="displayName"
                      autoComplete="name"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      className={inputClass}
                      required
                      disabled={busy}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className={labelClass}>Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    className={inputClass}
                    required
                    disabled={busy}
                  />
                </div>


                <div>
                  <label htmlFor="password" className={labelClass}>Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className={`${inputClass} pr-12`}
                      required
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={busy}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {!isSignUp && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        disabled={busy}
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPassword(true)
                        setLocalError(null)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      disabled={busy}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={busy}
                >
                  {busy
                    ? isSignUp
                      ? 'Creating account...'
                      : 'Signing in...'
                    : isSignUp
                      ? 'Create account'
                      : 'Sign In'}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>


                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin(onGoogleLogin)}
                    className={socialBtnClass}
                    aria-label="Continue with Google"
                    disabled={busy}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialLogin(onAppleLogin)}
                    className={socialBtnClass}
                    aria-label="Continue with Apple"
                    disabled={busy}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M16.365 1.43c0 1.14-.42 2.2-1.23 3.02-.99 1.09-2.19 1.75-3.55 1.65-.15-1.1.4-2.29 1.16-3.05.81-.82 2.26-1.4 3.62-1.45v.83zm4.28 15.32c-.57 1.3-.84 1.88-1.57 3.03-1.01 1.6-2.44 3.59-4.2 3.61-1.66.03-2.1-1.06-4.34-1.04-2.23.02-2.72 1.07-4.37 1.04-1.76-.03-3.1-1.83-4.12-3.42-2.87-4.45-3.16-8.7-1.38-11.16 1.28-1.77 3.3-2.85 5.24-2.85 1.97 0 3.21 1.05 4.83 1.05 1.58 0 2.54-1.05 4.82-1.05 1.72 0 3.54.94 4.82 2.58-4.24 2.32-3.55 7.87.73 9.28z"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialLogin(onGitHubLogin)}
                    className={socialBtnClass}
                    aria-label="Continue with GitHub"
                    disabled={busy}
                  >
                    <svg className="w-5 h-5" fill="#24292f" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </button>
                </div>

                <p className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  Secured by Firebase Authentication
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

