import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AuthDebuggerProps {
  enabled?: boolean;
}

export const AuthDebugger: React.FC<AuthDebuggerProps> = ({ enabled = false }) => {
  const { user, session, loading, error, isAuthenticated } = useAuth();
  const renderCount = useRef(0);
  const lastState = useRef<any>(null);

  useEffect(() => {
    renderCount.current += 1;
  });

  useEffect(() => {
    if (!enabled) return;

    const currentState = {
      user: user?.id,
      session: session?.access_token?.substring(0, 20) + '...',
      loading,
      error,
      isAuthenticated,
    };

    if (JSON.stringify(currentState) !== JSON.stringify(lastState.current)) {
      console.log('🔍 Auth State Changed:', {
        renderCount: renderCount.current,
        previous: lastState.current,
        current: currentState,
        timestamp: new Date().toISOString(),
      });
      lastState.current = currentState;
    }
  }, [user, session, loading, error, isAuthenticated, enabled]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px',
        borderRadius: '0 0 0 10px',
      }}
    >
      <div><strong>Auth Debug</strong></div>
      <div>Renders: {renderCount.current}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      <div>User ID: {user?.id?.substring(0, 8) || 'None'}</div>
      <div>Session: {session ? 'Active' : 'None'}</div>
      <div>Error: {error || 'None'}</div>
    </div>
  );
};