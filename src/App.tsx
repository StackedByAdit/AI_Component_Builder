// src/App.tsx
// purpose: main app shell with state management and 3-panel layout

import { useState } from 'react';
import type { GenerationState, GalleryState } from './types';
import { Sidebar } from './components/prompt-input';

export const App = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') ?? '');
  const [generationState] = useState<GenerationState>({ status: 'idle' });
  const [galleryState] = useState<GalleryState>({ status: 'idle' });

  const handleGenerate = (prompt: string) => {
    console.log('Generate:', prompt);
    // we'll implement this in Class 3
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* left sidebar - prompt input */}
      <Sidebar
        onGenerate={handleGenerate}
        isLoading={generationState.status === 'loading'}
        apiKey={apiKey}
        onApiKeySave={setApiKey}
      />

      {/* center - preview (placeholder) */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Preview panel - coming in Class 4</p>
      </div>

      {/* right sidebar - variants (placeholder) */}
      <aside className="w-48 bg-gray-900 border-l border-gray-800 flex items-center justify-center">
        <p className="text-xs text-gray-500">Gallery - coming in Class 5</p>
      </aside>
    </div>
  );
};