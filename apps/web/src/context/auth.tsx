// src/context/auth.tsx
// purpose: auth context — stores token and user, exposes signin/signup/signout

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthState, SignupRequest, SigninRequest } from '@repo/types';
import { API_BASE_URL } from '../lib/api';

const API = API_BASE_URL;

interface AuthContextValue {
  auth: AuthState;
  signup: (data: SignupRequest) => Promise<void>;
  signin: (data: SigninRequest) => Promise<void>;
  signout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('user');
    if (token && raw) {
      try {
        return { status: 'authenticated', token, user: JSON.parse(raw) };
      } catch {
        return { status: 'idle' };
      }
    }
    return { status: 'idle' };
  });

  const signup = useCallback(async (data: SignupRequest) => {
    setAuth({ status: 'loading' });
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Signup failed');
      localStorage.setItem('token', json.token);
      localStorage.setItem('user', JSON.stringify(json.user));
      setAuth({ status: 'authenticated', token: json.token, user: json.user });
    } catch (err) {
      setAuth({ status: 'error', message: err instanceof Error ? err.message : 'Signup failed' });
    }
  }, []);

  const signin = useCallback(async (data: SigninRequest) => {
    setAuth({ status: 'loading' });
    try {
      const res = await fetch(`${API}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Signin failed');
      localStorage.setItem('token', json.token);
      localStorage.setItem('user', JSON.stringify(json.user));
      setAuth({ status: 'authenticated', token: json.token, user: json.user });
    } catch (err) {
      setAuth({ status: 'error', message: err instanceof Error ? err.message : 'Signin failed' });
    }
  }, []);

  const signout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ status: 'idle' });
  }, []);

  return (
    <AuthContext.Provider value={{ auth, signup, signin, signout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
