import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { requireAuth, requireOnboarding } from '@/utils/authHelpers';

export default function ProtectedRoute({ children, requireOnboarding: needsOnboarding = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [needsOnboarding]);

  const checkAuth = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.jsx:15',message:'checkAuth entry',data:{needsOnboarding},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      if (needsOnboarding) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.jsx:18',message:'requireOnboarding check',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Require both auth and onboarding
        const result = await requireOnboarding(supabase, supabaseHelpers);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.jsx:22',message:'requireOnboarding result',data:{hasResult:!!result,needsOnboarding:result?.needsOnboarding},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        if (!result) {
          // Redirected to login or onboarding
          return;
        }
        if (result.needsOnboarding) {
          navigate('/onboarding');
          return;
        }
        setIsAuthorized(true);
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.jsx:32',message:'requireAuth check',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Only require auth
        const result = await requireAuth(supabase);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.jsx:35',message:'requireAuth result',data:{hasResult:!!result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (!result) {
          navigate('/login');
          return;
        }
        setIsAuthorized(true);
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.jsx:43',message:'checkAuth error',data:{error:error?.message,stack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Error logged (removed for production)
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

