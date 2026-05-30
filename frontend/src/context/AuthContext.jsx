import { createContext, useContext, useEffect, useState } from 'react';
import { ping } from '../api';

const AuthContext = createContext(null);
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem('mecs_auth');
    return stored ? JSON.parse(stored) : null;
  });

  const signIn = (data) => {
    localStorage.setItem('mecs_auth', JSON.stringify(data));
    localStorage.setItem('mecs_last_activity', String(Date.now()));
    setAuth(data);
  };

  const signOut = () => {
    localStorage.removeItem('mecs_auth');
    localStorage.removeItem('mecs_last_activity');
    setAuth(null);
  };

  // Sync auth state across tabs: another tab signing in/out updates localStorage,
  // and the 'storage' event fires in every OTHER tab of the same browser profile.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'mecs_auth') return;
      if (e.newValue == null) {
        setAuth(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else {
        try { setAuth(JSON.parse(e.newValue)); } catch { setAuth(null); }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!auth) return;

    // On every page load, check whether the server has restarted since the last login.
    ping()
      .then(({ data }) => {
        if (auth.serverInstanceId && data.instanceId !== auth.serverInstanceId) {
          signOut();
          window.location.href = '/login?restart=1';
        }
      })
      .catch((err) => {
        if (!err.response) {
          // Server unreachable — treat as maintenance restart.
          signOut();
          window.location.href = '/login?restart=1';
        }
      });

    // Idle timeout: auto-logout after 2 hours with no API activity.
    const check = () => {
      const lastActivity = Number(localStorage.getItem('mecs_last_activity') || Date.now());
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        const name = auth.name;
        signOut();
        const params = new URLSearchParams({ expired: '1' });
        if (name) params.set('user', name);
        window.location.href = `/login?${params}`;
      }
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
