import React, { useEffect, useState } from 'react';
import App from './App';
import { AuthSession, UserRole } from './types';

const SESSION_KEY = 'excel-clone-auth';

const RootApp: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const existingSession = window.sessionStorage.getItem(SESSION_KEY);

    if (existingSession) {
      setSession(JSON.parse(existingSession));
      return;
    }

    const defaultSession: AuthSession = {
      id: 'docmost-user',
      name: 'Docmost User',
      email: 'user@docmost.com',
      role: 'Admin' as UserRole,
      department: 'General',
      token: 'no-token-needed',
    };

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(defaultSession));
    setSession(defaultSession);

    if (window.location.pathname !== '/dashboard') {
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const handleLogout = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    window.location.reload();
  };

  const handleSessionUpdate = (updates: Partial<AuthSession>) => {
    setSession((currentSession) => {
      if (!currentSession) return currentSession;

      const updated = { ...currentSession, ...updates };
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  if (!session) return null;

  return (
    <App
      currentUser={session}
      onLogout={handleLogout}
      onSessionUpdate={handleSessionUpdate}
    />
  );
};

export default RootApp;