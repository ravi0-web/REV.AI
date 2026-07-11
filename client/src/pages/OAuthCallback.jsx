import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth Error:', error);
      navigate('/login', { replace: true });
      return;
    }

    if (token && name && email) {
      // Save token and user details to localStorage
      api.setToken(token);
      api.setUser({ name, email });
      
      // Reload the app to update AuthContext state and navigate to home
      window.location.href = '/';
    } else {
      // Missing data, fallback to login
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
        <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-md)' }} />
        <h2>Authenticating...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Securely logging you in with Google.</p>
      </div>
    </div>
  );
}
