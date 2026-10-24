import { useState, useCallback, useRef, useEffect } from 'react';
import type { GenerationState, ComponentDocument } from './types';
import { Sidebar } from './components/prompt-input';
import { PreviewPanel } from './preview-panel';
import { useAuth } from './context/auth';
import { AuthForm } from './components/auth-form';
import { API_BASE_URL } from './lib/api';

export const App = () => {
  const { auth, isRestoring, signout } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/signup') {
      return 'signup';
    }
    return 'signin';
  });
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedComponents, setSavedComponents] = useState<ComponentDocument[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);

  // Sync initial URL path and listen for popstate
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/signup') {
        setAuthMode('signup');
      } else if (currentPath === '/login' || currentPath === '/') {
        setAuthMode('signin');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL to / when authenticated
  useEffect(() => {
    if (auth.status === 'authenticated' && typeof window !== 'undefined') {
      if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [auth.status]);

  const handleSwitchAuthMode = useCallback(() => {
    setAuthMode((prev) => {
      const next = prev === 'signin' ? 'signup' : 'signin';
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', next === 'signup' ? '/signup' : '/login');
      }
      return next;
    });
  }, []);

  const fetchSavedComponents = useCallback(async () => {
    if (auth.status !== 'authenticated') return;
    setIsLoadingSaved(true);
    setSavedError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/components`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      if (response.status === 401) {
        signout();
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch components (${response.status})`);
      }
      const data = await response.json();
      setSavedComponents(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setSavedError(err instanceof Error ? err.message : 'Failed to load saved components');
    } finally {
      setIsLoadingSaved(false);
    }
  }, [auth, signout]);

  useEffect(() => {
    let isMounted = true;
    if (auth.status === 'authenticated') {
      fetch(`${API_BASE_URL}/components`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            setSavedComponents(Array.isArray(data) ? data : []);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            setSavedError(err instanceof Error ? err.message : 'Failed to load saved components');
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [auth]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSaved(false);
    setGenerationState({ status: 'idle' });
  }, []);

  const handleGenerate = useCallback(
    async (prompt: string) => {
      if (auth.status !== 'authenticated') return;

      setSelectedComponentId(null);
      setIsSaved(false);
      // Abort previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const currentRequestId = ++requestIdRef.current;

      setGenerationState({ status: 'loading' });

      try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        // Ignore response if a newer request was dispatched
        if (currentRequestId !== requestIdRef.current) return;

        if (response.status === 401) {
          signout();
          return;
        }

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
    [auth, signout],
  );

  const handleSave = useCallback(async () => {
    if (
      generationState.status !== 'success' ||
      auth.status !== 'authenticated' ||
      isSavingRef.current ||
      isSaved
    ) {
      return;
    }
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          prompt: generationState.prompt,
          code: generationState.code,
          title: generationState.prompt.slice(0, 60),
        }),
      });

      if (response.status === 401) {
        signout();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save component');
      }

      const saved = await response.json();
      setSelectedComponentId(saved.id);
      setIsSaved(true);
      await fetchSavedComponents();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save component');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [generationState, auth, isSaved, fetchSavedComponents, signout]);

  const handleDeleteComponent = useCallback(
    async (id: string) => {
      if (auth.status !== 'authenticated') return;
      try {
        const response = await fetch(`${API_BASE_URL}/components/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        if (response.status === 401) {
          signout();
          return;
        }
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to delete component');
        }
        setSavedComponents((prev) => prev.filter((c) => c.id !== id));
        if (selectedComponentId === id) {
          setSelectedComponentId(null);
          setIsSaved(false);
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete component');
      }
    },
    [auth, selectedComponentId, signout],
  );

  const handleSelectComponent = useCallback((comp: ComponentDocument) => {
    setSelectedComponentId(comp.id);
    setIsSaved(true);
    setGenerationState({
      status: 'success',
      code: comp.code,
      prompt: comp.prompt,
    });
  }, []);

  if (isRestoring) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (auth.status !== 'authenticated') {
    return (
      <AuthForm
        mode={authMode}
        onSwitch={handleSwitchAuthMode}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar
        onGenerate={handleGenerate}
        onCancel={handleCancel}
        isLoading={generationState.status === 'loading'}
        savedComponents={savedComponents}
        isLoadingSaved={isLoadingSaved}
        savedError={savedError}
        onSelectComponent={handleSelectComponent}
        onDeleteComponent={handleDeleteComponent}
        onRefreshSaved={fetchSavedComponents}
        selectedComponentId={selectedComponentId}
      />

      <PreviewPanel
        state={generationState}
        onSave={handleSave}
        isSaving={isSaving}
        isSaved={isSaved}
      />
    </div>
  );
};
