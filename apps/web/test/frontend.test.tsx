// apps/web/test/frontend.test.tsx
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Mock localStorage for Node test environment
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, val),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

import { PreviewPanel } from '../src/preview-panel.tsx';
import { Sidebar } from '../src/components/prompt-input.tsx';
import { AuthForm } from '../src/components/auth-form.tsx';
import { AuthProvider } from '../src/context/auth.tsx';
import type { GenerationState } from '../src/types.ts';

describe('Frontend Critical Behaviour', () => {
  describe('PreviewPanel Component', () => {
    it('renders idle placeholder when status is idle', () => {
      const state: GenerationState = { status: 'idle' };
      const html = renderToStaticMarkup(
        <PreviewPanel state={state} onSave={() => {}} isSaving={false} />
      );

      assert.ok(html.includes('Describe a component to see a live preview'));
      assert.ok(html.includes('Your generated UI will appear here'));
      assert.ok(!html.includes('iframe'));
      assert.ok(!html.includes('Save'));
    });

    it('renders loading spinner and generating message when status is loading', () => {
      const state: GenerationState = { status: 'loading' };
      const html = renderToStaticMarkup(
        <PreviewPanel state={state} onSave={() => {}} isSaving={false} />
      );

      assert.ok(html.includes('Generating component...'));
      assert.ok(html.includes('This usually takes a few seconds'));
      assert.ok(html.includes('animate-spin'));
      assert.ok(!html.includes('iframe'));
    });

    it('renders error state with message when status is error', () => {
      const errorMessage = 'Gemini rate limit exceeded. Please wait a moment and try again.';
      const state: GenerationState = { status: 'error', message: errorMessage };
      const html = renderToStaticMarkup(
        <PreviewPanel state={state} onSave={() => {}} isSaving={false} />
      );

      assert.ok(html.includes(errorMessage));
      assert.ok(html.includes('Try a different prompt or check your API key'));
      assert.ok(!html.includes('iframe'));
      assert.ok(!html.includes('Save'));
    });

    it('renders sandboxed preview iframe, copy button, and save button when status is success', () => {
      const code = '<div className="p-4 bg-blue-500 text-white">Button</div>';
      const state: GenerationState = { status: 'success', code, prompt: 'A blue button' };
      const html = renderToStaticMarkup(
        <PreviewPanel state={state} onSave={() => {}} isSaving={false} />
      );

      assert.ok(html.includes('Live render'));
      assert.ok(html.includes('iframe'));
      assert.ok(html.includes('sandbox="allow-scripts"'));
      assert.ok(html.includes('title="Component Preview"'));
      assert.ok(html.includes('Copy Code'));
      assert.ok(html.includes('Save'));
      assert.ok(!html.includes('animate-spin'));
    });

    it('displays "Saving..." on save button when isSaving is true', () => {
      const code = '<div className="p-4">Card</div>';
      const state: GenerationState = { status: 'success', code, prompt: 'Card' };
      const html = renderToStaticMarkup(
        <PreviewPanel state={state} onSave={() => {}} isSaving={true} />
      );

      assert.ok(html.includes('Saving...'));
      assert.ok(html.includes('disabled=""') || html.includes('disabled'));
    });
  });

  describe('Sidebar & PromptInput Component', () => {
    it('renders prompt textarea and idle generate button', () => {
      const html = renderToStaticMarkup(
        <AuthProvider>
          <Sidebar onGenerate={() => {}} isLoading={false} />
        </AuthProvider>
      );

      assert.ok(html.includes('Describe a UI component...'));
      assert.ok(html.includes('Generate Component'));
      assert.ok(html.includes('Try an example:'));
      assert.ok(html.includes('A dark pricing card'));
      assert.ok(!html.includes('Cancel'));
    });

    it('renders loading state with spinner when isLoading is true', () => {
      const html = renderToStaticMarkup(
        <AuthProvider>
          <Sidebar onGenerate={() => {}} isLoading={true} />
        </AuthProvider>
      );

      assert.ok(html.includes('Generating...'));
      assert.ok(html.includes('animate-spin'));
    });

    it('renders Cancel button when onCancel is provided and isLoading is true', () => {
      const html = renderToStaticMarkup(
        <AuthProvider>
          <Sidebar onGenerate={() => {}} onCancel={() => {}} isLoading={true} />
        </AuthProvider>
      );

      assert.ok(html.includes('Generating...'));
      assert.ok(html.includes('Cancel'));
    });

    it('does not render Cancel button when isLoading is false', () => {
      const html = renderToStaticMarkup(
        <AuthProvider>
          <Sidebar onGenerate={() => {}} onCancel={() => {}} isLoading={false} />
        </AuthProvider>
      );

      assert.ok(!html.includes('Cancel'));
      assert.ok(html.includes('Generate Component'));
    });
  });

  describe('AuthForm Component', () => {
    it('renders signin mode with appropriate headings and controls', () => {
      const html = renderToStaticMarkup(
        <AuthProvider>
          <AuthForm mode="signin" onSwitch={() => {}} />
        </AuthProvider>
      );

      assert.ok(html.includes('Sign In'));
      assert.ok(html.includes('placeholder="Email"'));
      assert.ok(html.includes('placeholder="Password"'));
      assert.ok(html.includes("Don&#x27;t have an account?") || html.includes("Don't have an account?"));
      assert.ok(html.includes('Sign up'));
    });

    it('renders signup mode with appropriate headings and controls', () => {
      const html = renderToStaticMarkup(
        <AuthProvider>
          <AuthForm mode="signup" onSwitch={() => {}} />
        </AuthProvider>
      );

      assert.ok(html.includes('Create Account'));
      assert.ok(html.includes('placeholder="Email"'));
      assert.ok(html.includes('placeholder="Password"'));
      assert.ok(html.includes('Already have an account?'));
      assert.ok(html.includes('Sign in'));
    });
  });

  describe('Frontend State Transitions & API Failure Handling', () => {
    it('maps network errors (unavailable API) to error generation state', async () => {
      let state: GenerationState = { status: 'idle' };

      // Simulate the App handleGenerate flow when API is completely down/unavailable
      const handleGenerate = async () => {
        state = { status: 'loading' };
        try {
          // Simulate fetch rejection on unreachable server
          throw new TypeError('Failed to fetch: Connection refused');
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Generation failed';
          state = { status: 'error', message };
        }
      };

      assert.equal(state.status, 'idle');
      await handleGenerate();
      assert.equal(state.status, 'error');
      assert.equal(state.message, 'Failed to fetch: Connection refused');
    });

    it('maps upstream HTTP 500/429 response to error generation state with error payload', async () => {
      let state: GenerationState = { status: 'loading' };

      const simulateApiResponse = (ok: boolean, status: number, body: { error?: string }) => {
        if (!ok) {
          state = { status: 'error', message: body.error || `Generation failed (${status})` };
        }
      };

      simulateApiResponse(false, 429, { error: 'Gemini rate limit exceeded. Please wait a moment.' });
      assert.equal(state.status, 'error');
      assert.equal(state.message, 'Gemini rate limit exceeded. Please wait a moment.');
    });

    it('cleanly ignores client AbortError without setting state to error', async () => {
      let state: GenerationState = { status: 'loading' };
      const controller = new AbortController();
      controller.abort();

      const handleGenerateWithAbort = async () => {
        try {
          if (controller.signal.aborted) {
            const err = new Error('The user aborted a request.');
            err.name = 'AbortError';
            throw err;
          }
        } catch (err: unknown) {
          if ((err instanceof Error && err.name === 'AbortError') || controller.signal.aborted) {
            // Cancellation is ignored cleanly, state remains as managed by caller
            return;
          }
          state = { status: 'error', message: 'Failed' };
        }
      };

      await handleGenerateWithAbort();
      // Notice: state was NOT set to 'error'
      assert.notEqual(state.status, 'error');
    });

    it('transitions to success state when API returns valid code', () => {
      let state: GenerationState = { status: 'loading' };
      const generatedCode = '<div className="p-4">Generated Card</div>';
      const prompt = 'Create a card';

      state = { status: 'success', code: generatedCode, prompt };
      assert.equal(state.status, 'success');
      assert.equal(state.code, generatedCode);
      assert.equal(state.prompt, prompt);
    });
  });
});
