// src/components/prompt-input.tsx
// purpose: left sidebar with prompt input, example chips, saved component library, and sign out

import { useState, useCallback, type FormEvent } from 'react';
import type { SidebarProps } from '../types';
import { useAuth } from '../context/auth';

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
  const { signout } = useAuth();
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

  return (
    <aside className="w-80 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      {/* logo */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-linear-to-br from-violet-500 to-indigo-600 rounded-lg" />
          <span className="font-semibold text-white text-sm">AI Component Builder</span>
        </div>
      </div>

      {/* Navigation tabs between Create and Saved Library */}
      <div className="flex border-b border-gray-800 px-4 pt-2 gap-3 bg-gray-900/60">
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'create'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          Generator
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-2.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'saved'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          Library
          {savedComponents.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-800 text-gray-300">
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
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {isLoading ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-linear-to-r from-violet-600 to-indigo-600 rounded-lg opacity-80 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </button>
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-3 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:text-white hover:border-gray-600 hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-full py-2.5 text-sm font-medium text-white bg-linear-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Generate Component
                </button>
              )}
            </form>

            <div>
              <p className="text-xs text-gray-500 mb-2">Try an example:</p>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleChipClick(prompt)}
                    disabled={isLoading}
                    className="text-left text-xs px-3 py-2 bg-gray-800/50 text-gray-400 rounded-lg border border-gray-800 hover:border-gray-700 hover:text-gray-200 disabled:opacity-50 transition-colors"
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
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Saved Components
              </span>
              {onRefreshSaved && (
                <button
                  onClick={onRefreshSaved}
                  disabled={isLoadingSaved}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {isLoadingSaved ? 'Refreshing...' : 'Refresh'}
                </button>
              )}
            </div>

            {isLoadingSaved && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2">
                <span className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading library...</span>
              </div>
            )}

            {!isLoadingSaved && savedError && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300 space-y-2">
                <p>{savedError}</p>
                {onRefreshSaved && (
                  <button
                    onClick={onRefreshSaved}
                    className="text-xs px-2 py-1 bg-red-900/60 rounded hover:bg-red-800 text-white"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {!isLoadingSaved && !savedError && savedComponents.length === 0 && (
              <div className="text-center py-8 px-2">
                <svg
                  className="w-10 h-10 mx-auto text-gray-700 mb-2"
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
                <p className="text-xs font-medium text-gray-400">No saved components yet</p>
                <p className="text-[11px] text-gray-600 mt-1">
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
                      className={`group relative p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-violet-950/30 border-violet-600/50'
                          : 'bg-gray-800/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/80'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectComponent?.(comp)}
                        className="w-full text-left pr-6"
                      >
                        <p className="text-xs font-medium text-gray-200 line-clamp-1 group-hover:text-white">
                          {comp.title || comp.prompt}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                          {comp.prompt}
                        </p>
                        <span className="inline-block text-[10px] text-gray-600 mt-1.5">
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
                          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity"
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
      <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
        <p className="text-xs text-gray-600">Key stored on server</p>
        <button
          onClick={signout}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};
