// src/components/auth-form.tsx
// purpose: accessible, responsive signup and login pages with inline validation and show/hide password controls

import { useState, useCallback, useRef, type FormEvent } from 'react';
import { useAuth } from '../context/auth';
import { Wordmark } from './brand-mark';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSwitch: () => void;
}

export const AuthForm = ({ mode, onSwitch }: AuthFormProps) => {
  const { signup, signin, auth, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const isSubmittingRef = useRef(false);
  const isLoading = auth.status === 'loading';

  // Inline validation calculations
  const emailError =
    touched.email && email.trim() && !EMAIL_REGEX.test(email.trim().toLowerCase())
      ? 'Please enter a valid email address'
      : touched.email && !email.trim()
      ? 'Email is required'
      : null;

  const passwordError =
    mode === 'signup' && touched.password && password && password.length < 8
      ? 'Password must be at least 8 characters'
      : touched.password && !password
      ? 'Password is required'
      : null;

  const confirmPasswordError =
    mode === 'signup' && touched.confirmPassword && confirmPassword && confirmPassword !== password
      ? 'Passwords do not match'
      : mode === 'signup' && touched.confirmPassword && !confirmPassword
      ? 'Please confirm your password'
      : null;

  const isFormValid =
    Boolean(email.trim()) &&
    EMAIL_REGEX.test(email.trim().toLowerCase()) &&
    Boolean(password) &&
    (mode === 'signin' || (password.length >= 8 && confirmPassword === password));

  const handleSwitch = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTouched({});
    clearError();
    onSwitch();
  }, [clearError, onSwitch]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setTouched({ email: true, password: true, confirmPassword: true });

      if (!isFormValid || isLoading || isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      try {
        if (mode === 'signup') {
          await signup({
            email: email.trim().toLowerCase(),
            password,
            confirmPassword,
          });
        } else {
          await signin({
            email: email.trim().toLowerCase(),
            password,
          });
        }
      } catch {
        // Error state handled by AuthContext
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [email, password, confirmPassword, isFormValid, isLoading, mode, signup, signin]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge-bg px-4 py-8 text-forge-ink">
      <div className="w-full max-w-sm bg-forge-paper border border-forge-line p-6 sm:p-8 space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Wordmark />
          <div>
            <h1 className="font-serif text-2xl font-medium text-forge-ink tracking-tight">
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-sm text-forge-muted mt-1">
              {mode === 'signup'
                ? 'Create an account to generate, preview, and save React components.'
                : 'Log in to your ForgeAI workspace.'}
            </p>
          </div>
        </div>

        {/* Server Error Alert */}
        {auth.status === 'error' && (
          <div
            role="alert"
            className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="leading-tight">{auth.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-forge-ink mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="Email"
              onChange={(e) => {
                setEmail(e.target.value);
                if (auth.status === 'error') clearError();
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'email-error' : undefined}
              className={`w-full bg-white border rounded-md px-3.5 py-2.5 text-sm text-forge-ink placeholder-stone-400 focus:outline-none transition-colors ${
                emailError
                  ? 'border-red-600 focus:ring-1 focus:ring-red-600'
                  : 'border-forge-line focus:ring-1 focus:ring-forge-ink focus:border-forge-ink'
              }`}
            />
            {emailError && (
              <p id="email-error" className="text-[11px] text-red-400 mt-1">
                {emailError}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-forge-ink">
                Password
              </label>
              {mode === 'signup' && (
                <span className="text-[10px] text-forge-muted">At least 8 characters</span>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="Password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (auth.status === 'error') clearError();
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'password-error' : undefined}
                className={`w-full bg-white border rounded-md pl-3.5 pr-10 py-2.5 text-sm text-forge-ink placeholder-stone-400 focus:outline-none transition-colors ${
                  passwordError
                    ? 'border-red-600 focus:ring-1 focus:ring-red-600'
                    : 'border-forge-line focus:ring-1 focus:ring-forge-ink focus:border-forge-ink'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-muted hover:text-forge-ink transition-colors p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p id="password-error" className="text-[11px] text-red-400 mt-1">
                {passwordError}
              </p>
            )}
          </div>

          {/* Confirm Password Field (Signup Mode Only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-forge-ink mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (auth.status === 'error') clearError();
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                  aria-invalid={Boolean(confirmPasswordError)}
                  aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
                  className={`w-full bg-white border rounded-md pl-3.5 pr-10 py-2.5 text-sm text-forge-ink placeholder-stone-400 focus:outline-none transition-colors ${
                    confirmPasswordError
                      ? 'border-red-600 focus:ring-1 focus:ring-red-600'
                      : 'border-forge-line focus:ring-1 focus:ring-forge-ink focus:border-forge-ink'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-muted hover:text-forge-ink transition-colors p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p id="confirm-password-error" className="text-[11px] text-red-400 mt-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full py-2.5 px-4 text-sm font-medium text-white bg-forge-ink rounded-md hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{mode === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
              </span>
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Mode Switch Footer */}
        <div className="pt-2 border-t border-forge-line text-center">
          <p className="text-xs text-forge-muted">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={handleSwitch}
              className="text-forge-ink hover:underline font-medium transition-colors cursor-pointer ml-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
