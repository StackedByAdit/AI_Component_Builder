// src/components/prompt-input.tsx
// purpose: left sidebar with prompt input, example chips, saved component library, and sign out

import { useState, useCallback, type FormEvent } from 'react';
import type { SidebarProps } from '../types';
import { useAuth } from '../context/auth';
import { navigate } from '../lib/navigation';
import { Wordmark } from './brand-mark';

const EXAMPLE_PROMPTS = [
  'A dark pricing card with monthly/annual toggle',
  'A user profile card with avatar and social links',
  'A notification toast with progress bar',
  'A login form with email and password',
  'A testimonial card with star ratings',
  'A stats dashboard card with charts',
];

export const Sidebar = ({
  onGenerate,
  onCancel,
  isLoading,
  savedComponents = [],
  isLoadingSaved = false,
  savedError = null,
  onSelectComponent,
  onDeleteComponent,
  onRefreshSaved,
  selectedComponentId = null,
}: SidebarProps) => {
  const { signout, auth } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      onGenerate(input.trim());
    },
    [input, isLoading, onGenerate],
  );

  const handleChipClick = useCallback(
    (prompt: string) => {
      setInput(prompt);
      if (!isLoading) onGenerate(prompt);
    },
    [isLoading, onGenerate],
  );

  const handleSignOut = useCallback(() => {
    signout();
    navigate('/');
  }, [signout]);

  return (
    <aside className="w-80 shrink-0 bg-forge-paper border-r border-forge-line flex flex-col h-screen sticky top-0">
      {/* logo */}
      <div className="px-4 py-4 border-b border-forge-line">
        <Wordmark compact />
      </div>

      {/* Navigation tabs between Create and Saved Library */}
      <div className="flex border-b border-forge-line px-4 pt-2 gap-4">
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-2.5 text-xs font-medium border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink ${
            activeTab === 'create'
              ? 'border-forge-ink text-forge-ink'
              : 'border-transparent text-forge-muted hover:text-forge-ink'
          }`}
        >
          Generator
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-2.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink ${
            activeTab === 'saved'
              ? 'border-forge-ink text-forge-ink'
              : 'border-transparent text-forge-muted hover:text-forge-ink'
          }`}
        >
          Library
          {savedComponents.length > 0 && (
            <span className="px-1.5 text-[10px] border border-forge-line text-forge-muted">
              {savedComponents.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {activeTab === 'create' ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe a UI component..."
                rows={5}
                className="w-full bg-white border border-forge-line px-3 py-2.5 text-sm text-forge-ink placeholder-stone-400 resize-none focus:outline-none focus:ring-1 focus:ring-forge-ink"
              />
              {isLoading ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-forge-ink opacity-80 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </button>
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-3 py-2.5 text-sm font-medium text-forge-ink bg-transparent border border-forge-line hover:bg-forge-bg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-full py-2.5 text-sm font-medium text-white bg-forge-ink hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
                >
                  Generate Component
                </button>
              )}
            </form>

            <div>
              <p className="text-xs text-forge-muted mb-2">Try an example:</p>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleChipClick(prompt)}
                    disabled={isLoading}
                    className="text-left text-xs px-3 py-2 bg-forge-bg text-forge-muted border border-forge-line hover:border-forge-ink hover:text-forge-ink disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-forge-faint">
                Saved Components
              </span>
              {onRefreshSaved && (
                <button
                  onClick={onRefreshSaved}
                  disabled={isLoadingSaved}
                  className="text-xs text-forge-ink underline underline-offset-4 hover:text-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
                >
                  {isLoadingSaved ? 'Refreshing...' : 'Refresh'}
                </button>
              )}
            </div>

            {isLoadingSaved && (
              <div className="flex flex-col items-center justify-center py-8 text-forge-muted gap-2">
                <span className="w-5 h-5 border-2 border-forge-ink border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading library...</span>
              </div>
            )}

            {!isLoadingSaved && savedError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
                <p>{savedError}</p>
                {onRefreshSaved && (
                  <button
                    onClick={onRefreshSaved}
                    className="text-xs px-2 py-1 border border-red-300 hover:bg-red-100 text-red-900"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {!isLoadingSaved && !savedError && savedComponents.length === 0 && (
              <div className="text-center py-8 px-2">
                <svg
                  className="w-10 h-10 mx-auto text-forge-line mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p className="text-xs font-medium text-forge-ink">No saved components yet</p>
                <p className="text-[11px] text-forge-muted mt-1">
                  Generate a component and click Save to add it here.
                </p>
              </div>
            )}

            {!isLoadingSaved && !savedError && savedComponents.length > 0 && (
              <div className="flex flex-col gap-2">
                {savedComponents.map((comp) => {
                  const isSelected = selectedComponentId === comp.id;
                  return (
                    <div
                      key={comp.id}
                      className={`group relative p-2.5 border text-left transition-colors ${
                        isSelected
                          ? 'bg-forge-bg border-forge-ink'
                          : 'bg-white border-forge-line hover:border-forge-ink'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectComponent?.(comp)}
                        className="w-full text-left pr-6"
                      >
                        <p className="text-xs font-medium text-forge-ink line-clamp-1">
                          {comp.title || comp.prompt}
                        </p>
                        <p className="text-[11px] text-forge-muted mt-0.5 line-clamp-1">
                          {comp.prompt}
                        </p>
                        <span className="inline-block text-[10px] text-forge-faint mt-1.5">
                          {new Date(comp.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </button>
                      {onDeleteComponent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteComponent(comp.id);
                          }}
                          title="Delete saved component"
                          className="absolute top-2 right-2 p-1 text-forge-faint hover:text-red-700 opacity-70 group-hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="px-4 py-3 border-t border-forge-line flex items-center justify-between gap-2">
        <p
          className="text-xs text-forge-muted truncate"
          title={auth.status === 'authenticated' ? auth.user.email : undefined}
        >
          {auth.status === 'authenticated' ? auth.user.email : 'Key stored on server'}
        </p>
        <button
          onClick={handleSignOut}
          className="text-xs text-forge-ink underline underline-offset-4 hover:text-black transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};
