import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithSocialProvider,
  sendPasswordReset,
  clearAuthError,
} from '../store/authSlice';
import { addNotification } from '../store/uiSlice';
import {
  consumeBucket,
  emailKey,
  rateLimitMessage,
  LOGIN_BUCKET,
  SIGNUP_BUCKET,
  SOCIAL_BUCKET,
  RESET_BUCKET,
  GLOBAL_AUTH_BUCKET,
} from '../utils/tokenBucket';
import { LoginPage, type AuthMode } from '../components/ui/sign-in-page';

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // The pending flag and the error come from the auth slice, which gets them
  // from the rejected thunk. The previous version faked a 1.5s delay and
  // hard-coded a mock user, so a wrong password still "succeeded".
  const pending = useAppSelector((state) => state.auth.pending);
  const authError = useAppSelector((state) => state.auth.error);
  const resetEmailSent = useAppSelector((state) => state.auth.resetEmailSent);

  // Guard against open-redirects: only same-origin relative paths are honoured.
  const resolveRedirect = useCallback(() => {
    const raw = searchParams.get('redirect');
    if (!raw) return '/';
    // Reject absolute URLs and protocol-relative URLs ("//evil.com").
    if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
    return raw;
  }, [searchParams]);

  // An already-authenticated visitor has no business on /login.
  const status = useAppSelector((state) => state.auth.status);
  useEffect(() => {
    if (status === 'authenticated') {
      navigate(resolveRedirect(), { replace: true });
    }
  }, [status, navigate, resolveRedirect]);

  const completeAuth = useCallback(
    (message: string) => {
      dispatch(addNotification({ type: 'success', message }));
      navigate(resolveRedirect(), { replace: true });
    },
    [dispatch, navigate, resolveRedirect]
  );

  const checkLimit = useCallback(
    (key: string, bucket: { capacity: number; refillIntervalMs: number }) => {
      const r = consumeBucket(key, bucket);
      if (!r.allowed) {
        const msg = rateLimitMessage(r.retryAfterSec);
        dispatch(addNotification({ type: 'error', message: msg }));
        throw new Error(msg);
      }
    },
    [dispatch]
  );

  const handleEmailAuth = useCallback(
    async (mode: AuthMode, formData: { email: string; password: string; displayName: string }) => {
      const bucket = mode === 'signup' ? SIGNUP_BUCKET : LOGIN_BUCKET;
      checkLimit(emailKey('ratelimit:auth:email:', formData.email), bucket);
      checkLimit('ratelimit:auth:global', GLOBAL_AUTH_BUCKET);
      const action =
        mode === 'signup'
          ? signUpWithEmail({ email: formData.email, password: formData.password, displayName: formData.displayName })
          : signInWithEmail({ email: formData.email, password: formData.password });

      // unwrap() re-throws the rejectValue so the presentational component can
      // render the message inline next to the form.
      const result = await dispatch(action).unwrap();
      completeAuth(
        mode === 'signup' ? `Welcome, ${result.displayName}!` : `Welcome back, ${result.displayName}!`
      );
    },
    [dispatch, completeAuth, checkLimit]
  );

  const handleSocialAuth = useCallback(
    async (provider: 'google' | 'github' | 'apple') => {
      checkLimit('ratelimit:auth:social:' + provider, SOCIAL_BUCKET);
      checkLimit('ratelimit:auth:global', GLOBAL_AUTH_BUCKET);
      const result = await dispatch(signInWithSocialProvider(provider)).unwrap();
      completeAuth(`Signed in as ${result.displayName}`);
    },
    [dispatch, completeAuth]
  );

  const handleForgotPassword = useCallback(
    async (email: string) => {
      checkLimit(emailKey('ratelimit:auth:reset:', email), RESET_BUCKET);
      await dispatch(sendPasswordReset(email)).unwrap();
    },
    [dispatch, checkLimit]
  );

  // Drop any stale error when the page mounts or unmounts, so a failure from
  // a previous visit is not still on screen.
  useEffect(() => {
    dispatch(clearAuthError());
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  return (
    <LoginPage
      isLoading={pending}
      error={authError}
      resetEmailSent={resetEmailSent}
      onSignIn={(formData) => handleEmailAuth('signin', formData)}
      onSignUp={(formData) => handleEmailAuth('signup', formData)}
      onGoogleLogin={() => handleSocialAuth('google')}
      onGitHubLogin={() => handleSocialAuth('github')}
      onAppleLogin={() => handleSocialAuth('apple')}
      onForgotPassword={handleForgotPassword}
    />
  );
};

export default Login;
