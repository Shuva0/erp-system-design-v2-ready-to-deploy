import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Google OAuth redirects here with ?token=... after a successful login.
// This page's only job is to store that token and bounce the user onward.
export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login');
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/dashboard'))
      .catch(() => navigate('/login'));
  }, [searchParams, loginWithToken, navigate]);

  return <div className="p-8 text-center text-gray-500">Signing you in...</div>;
}
