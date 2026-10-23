// src/components/prompt-input.tsx
// purpose: left sidebar with prompt input, example chips, and sign out

import { useState, useCallback, type FormEvent } from 'react';
import type { PromptInputProps } from '../types';
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
  isLoading,
}: PromptInputProps) => {
  const { signout } = useAuth();
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
    <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      {/* logo */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-linear-to-br from-violet-500 to-indigo-600 rounded-lg" />
          <span className="font-semibold text-white text-sm">AI Component Builder</span>
        </div>
      </div>

      {/* prompt input */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe a UI component..."
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-full py-2.5 text-sm font-medium text-white bg-linear-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              'Generate Component'
            )}
          </button>
        </form>

        {/* example chips */}
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
