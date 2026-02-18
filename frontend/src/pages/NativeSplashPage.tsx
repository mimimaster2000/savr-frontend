import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SPLASH_DURATION_MS = 1800;

/**
 * Shown only in the native (Capacitor) app when the user hits the root URL.
 * Displays the Savr logo with safe-area insets, then redirects to sign-in.
 */
const NativeSplashPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate('/landing', { replace: true });
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center fixed inset-0"
      style={{ backgroundColor: '#204529' }}
    >
      <img
        src="/favicon.svg"
        alt="Savr"
        className="w-[80vw] h-[80vh] max-w-full max-h-full object-contain"
      />
    </div>
  );
};

export default NativeSplashPage;
