import { useCallback } from 'react';
import { useAppDispatch } from '../hooks/useRedux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../store/authSlice';
import { addNotification } from '../store/uiSlice';
import { mockUser } from '../utils/mockData';
import { LoginPage } from '../components/ui/sign-in-page';

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Guard against open-redirects: only same-origin relative paths are honoured.
  const resolveRedirect = useCallback(() => {
    const raw = searchParams.get('redirect');
    if (!raw) return '/';
    // Reject absolute URLs and protocol-relative URLs ("//evil.com").
    if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
    return raw;
  }, [searchParams]);

  const completeLogin = useCallback(
    (token: string) => {
      dispatch(login({ user: mockUser, token }));
      dispatch(addNotification({ type: 'success', message: `Welcome back, ${mockUser.displayName}!` }));
      navigate(resolveRedirect(), { replace: true });
    },
    [dispatch, navigate, resolveRedirect]
  );

  // We wrap the presentational LoginPage to keep Redux concerns here.
  return (
    <LoginPage
      onLogin={async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        completeLogin('mock-jwt-token');
      }}
      onGoogleLogin={async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        completeLogin('mock-google-token');
      }}
      onGitHubLogin={async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        completeLogin('mock-github-token');
      }}
    />
  );
};

export default Login;
