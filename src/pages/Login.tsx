import { useAppDispatch } from '../hooks/useRedux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../store/authSlice';
import { hidePreloader } from '../store/uiSlice';
import { mockUser } from '../utils/mockData';
import { LoginPage } from '../components/ui/sign-in-page';

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // We wrap the LoginPage to add Redux integration
  // The original LoginPage component handles UI only
  // We could also modify sign-in-page.tsx directly to include Redux,
  // but keeping it separate allows reuse

  return (
    <LoginPage 
      onLogin={async () => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        dispatch(login({ user: mockUser, token: 'mock-jwt-token' }));
        dispatch(hidePreloader());
        const redirect = searchParams.get('redirect') || '/';
        navigate(redirect, { replace: true });
      }}
      onGoogleLogin={async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        dispatch(login({ user: mockUser, token: 'mock-google-token' }));
        dispatch(hidePreloader());
        const redirect = searchParams.get('redirect') || '/';
        navigate(redirect, { replace: true });
      }}
      onGitHubLogin={async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        dispatch(login({ user: mockUser, token: 'mock-github-token' }));
        dispatch(hidePreloader());
        const redirect = searchParams.get('redirect') || '/';
        navigate(redirect, { replace: true });
      }}
    />
  );
};

export default Login;