import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { GenerationState, ComponentDocument } from './types';
import { Sidebar } from './components/prompt-input';
import { PreviewPanel } from './preview-panel';
import { useAuth } from './context/auth';
import { AuthForm } from './components/auth-form';
import { LandingPage } from './components/landing/landing-page';
import { BrandMark } from './components/brand-mark';
import { API_BASE_URL } from './lib/api';
import { navigate, pathToRoute, ROUTE_TITLES, type AppRoute } from './lib/navigation';

export const App = () => {
  const { auth, isRestoring, signout } = useAuth();
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === 'undefined' ? 'home' : pathToRoute(window.location.pathname),
  );
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

  useEffect(() => {
    const handlePopState = () => setRoute(pathToRoute(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keep protected and auth URLs aligned with the session. The screen itself is derived below.
  const screen = useMemo<AppRoute>(() => {
    if (auth.status === 'authenticated' && (route === 'login' || route === 'signup')) return 'workspace';
    if (!isRestoring && auth.status !== 'authenticated' && auth.status !== 'loading' && route === 'workspace') {
      return 'login';
    }
    return route;
  }, [auth.status, isRestoring, route]);

  useEffect(() => {
    document.title = ROUTE_TITLES[screen];
  }, [screen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target =
      screen === 'workspace' && (route === 'login' || route === 'signup')
        ? '/workspace'
        : screen === 'login' && route === 'workspace'
          ? '/login'
          : null;
    if (target && window.location.pathname !== target) {
      window.history.replaceState(null, '', target);
    }
  }, [screen, route]);

  const handleSwitchAuthMode = useCallback(() => {
    navigate(screen === 'signup' ? '/login' : '/signup');
  }, [screen]);

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
      <div className="flex h-screen items-center justify-center bg-forge-bg text-forge-ink">
        <div className="flex flex-col items-center gap-3">
          <BrandMark />
          <p className="text-sm text-forge-muted">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (screen === 'login' || screen === 'signup') {
    return <AuthForm mode={screen === 'signup' ? 'signup' : 'signin'} onSwitch={handleSwitchAuthMode} />;
  }

  if (screen !== 'workspace' || auth.status !== 'authenticated') {
    return <LandingPage />;
  }

  return (
    <div className="workspace-shell flex h-screen bg-forge-bg text-forge-ink overflow-hidden">
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
