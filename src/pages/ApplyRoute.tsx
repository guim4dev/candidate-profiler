import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { parseAutoUpdateUrl } from '../utils/autoUpdateUrl';
import type { AutoUpdatePayload } from '../types';
import { Toast } from '../components/Toast';

export function ApplyRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const fullUrl = window.location.href;
    const payload = parseAutoUpdateUrl(fullUrl);

    if (!payload) {
      setErrorMessage('Invalid auto-update URL');
      setShowError(true);
      return;
    }

    navigate(`/candidates/${payload.candidateId}`, {
      state: { autoUpdatePayload: payload } as AutoUpdateRouteState,
      replace: true,
    });
  }, [navigate, location]);

  const handleHideError = () => {
    setShowError(false);
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 100);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-500">Processing...</div>
      <Toast
        message={errorMessage || 'Invalid auto-update URL'}
        isVisible={showError}
        onHide={handleHideError}
        duration={3000}
        variant="error"
      />
    </div>
  );
}

export interface AutoUpdateRouteState {
  autoUpdatePayload: AutoUpdatePayload;
}
