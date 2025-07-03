import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token','error');
    const refreshToken = params.get('refreshToken','error');

    if (token && refreshToken) {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      navigate('/dashboard');
    } else {
      console.error('OAuth Error:',  error);
      navigate('/login?error=oauth_failed');
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Completing login...</h2>
      </div>
    </div>
  );
};

export default OAuthCallback;