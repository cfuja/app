import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const CanvasCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      // Redirect to backend to complete OAuth
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      window.location.href = `${backendUrl}/api/canvas/oauth/callback?code=${code}&state=${state}`;
    } else {
      toast.error('Canvas authentication failed');
      navigate('/settings');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1929] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing Canvas authentication...</p>
      </div>
    </div>
  );
};

export default CanvasCallback;
