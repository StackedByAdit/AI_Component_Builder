// src/components/auth-form.tsx
// purpose: shared signin / signup form

import { useState, useCallback, type FormEvent } from 'react';
import { useAuth } from '../context/auth';

export const AuthForm = ({ mode, onSwitch }: { mode: 'signin' | 'signup'; onSwitch: () => void }) => {
  const { signup, signin, auth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isLoading = auth.status === 'loading';

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password.trim() || isLoading) return;
      mode === 'signup' ? signup({ email, password }) : signin({ email, password });
    },
    [email, password, isLoading, mode, signup, signin]
  );

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="w-80 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-linear-to-br from-violet-500 to-indigo-600 rounded-lg" />
          <span className="font-semibold text-white text-sm">AI Component Builder</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          {auth.status === 'error' && (
            <p className="text-xs text-red-400">{auth.message}</p>
          )}
          <button
            type="submit"
            disabled={!email.trim() || !password.trim() || isLoading}
            className="w-full py-2.5 text-sm font-medium text-white bg-linear-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : (
              mode === 'signup' ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center">
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={onSwitch} className="text-violet-400 hover:text-violet-300 transition-colors">
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
};
