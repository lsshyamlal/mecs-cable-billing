import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem('mecs_auth');
    return stored ? JSON.parse(stored) : null;
  });

  const signIn = (data) => {
    localStorage.setItem('mecs_auth', JSON.stringify(data));
    setAuth(data);
  };

  const signOut = () => {
    localStorage.removeItem('mecs_auth');
    setAuth(null);
  };

  // Auto-logout when the refresh token (session) expires
  useEffect(() => {
    if (!auth?.sessionExpiresAt) return;

    const check = () => {
      if (Date.now() >= auth.sessionExpiresAt) {
        signOut();
        window.location.href = '/login?expired=1';
      }
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [auth?.sessionExpiresAt]);

  return (
    <AuthContext.Provider value={{ auth, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
