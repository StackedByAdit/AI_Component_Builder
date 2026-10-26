import { useState, useCallback, useRef } from 'react';
import type { GenerationState } from './types';
import { Sidebar } from './components/prompt-input';
import { PreviewPanel } from './preview-panel';
import { useAuth } from './context/auth';
import { AuthForm } from './components/auth-form';

export const App = () => {
  const { auth } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [isSaving, setIsSaving] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setGenerationState({ status: 'idle' });
  }, []);

  const handleGenerate = useCallback(
    async (prompt: string) => {
      if (auth.status !== 'authenticated') return;

      // Abort previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const currentRequestId = ++requestIdRef.current;

      setGenerationState({ status: 'loading' });

      try {
        const response = await fetch('http://localhost:3001/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        // Ignore response if a newer request was dispatched
        if (currentRequestId !== requestIdRef.current) return;

        if (!response.ok) {
          throw new Error(data.error ?? `Generation failed (${response.status})`);
        }

        const code = data.code as string;
        if (!code) {
          setGenerationState({ status: 'error', message: 'No code was generated.' });
          return;
        }

        setGenerationState({ status: 'success', code, prompt });
      } catch (err: unknown) {
        // Ignore stale responses
        if (currentRequestId !== requestIdRef.current) return;

        // Cleanly ignore client cancellation
        if ((err instanceof Error && err.name === 'AbortError') || controller.signal.aborted) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Generation failed';
        setGenerationState({ status: 'error', message });
      } finally {
        if (currentRequestId === requestIdRef.current) {
          abortControllerRef.current = null;
        }
      }
    },
    [auth],
  );

  const handleSave = useCallback(async () => {
    if (generationState.status !== 'success' || auth.status !== 'authenticated') return;
    setIsSaving(true);
    try {
      await fetch('http://localhost:3001/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          prompt: generationState.prompt,
          code: generationState.code,
          title: generationState.prompt.slice(0, 60),
        }),
      });
    } finally {
      setIsSaving(false);
    }
  }, [generationState, auth]);

  if (auth.status === 'idle' || auth.status === 'loading' || auth.status === 'error') {
    return (
      <AuthForm
        mode={authMode}
        onSwitch={() => setAuthMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar
        onGenerate={handleGenerate}
        onCancel={handleCancel}
        isLoading={generationState.status === 'loading'}
      />

      <PreviewPanel
        state={generationState}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};
