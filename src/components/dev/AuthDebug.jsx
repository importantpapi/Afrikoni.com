import { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';

/**
 * Auth Debug Panel - Dev Only (For Youba Only)
 * 
 * Shows real-time auth state for debugging:
 * - Session existence
 * - User ID and email
 * - Session expiration
 * - Auth state change events
 * 
 * Only renders for specific user email: youba.thiam@icloud.com
 */
export default function AuthDebug() {
  const [session, setSession] = useState(null);
  const [authEvent, setAuthEvent] = useState(null);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Get initial session and check if we should show debug panel
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      // Show only for youba.thiam@icloud.com
      const userEmail = data.session?.user?.email?.toLowerCase();
      setShouldShow(userEmail === 'youba.thiam@icloud.com');
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AUTH EVENT]', event, session);
        setAuthEvent(event);
        setSession(session);
        // Update visibility on auth changes
        const userEmail = session?.user?.email?.toLowerCase();
        setShouldShow(userEmail === 'youba.thiam@icloud.com');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Don't render if not authorized user
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-green-400 text-xs p-3 rounded-lg max-w-sm overflow-auto border border-green-500/30 shadow-lg">
      <div className="font-bold mb-2 text-green-300">🔐 Auth Debug (Dev Only)</div>
      <pre className="whitespace-pre-wrap break-words">
        {JSON.stringify({
          loggedIn: !!session,
          userId: session?.user?.id?.substring(0, 8) + '...' || null,
          email: session?.user?.email || null,
          expiresAt: session?.expires_at 
            ? new Date(session.expires_at * 1000).toLocaleTimeString()
            : null,
          lastEvent: authEvent || 'initial_load'
        }, null, 2)}
      </pre>
    </div>
  );
}

