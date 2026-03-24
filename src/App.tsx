import { useState, useEffect, useCallback } from 'react';
import type { GenerationState, GalleryState } from './types';
import { Sidebar } from './components/prompt-input';
import { cleanGeneratedCode } from './components/codeCleaner';

export const App = () => {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('openai_api_key') ?? ''
  );

  const [generationState, setGenerationState] =
    useState<GenerationState>({ status: 'idle' });

  const [galleryState] = useState<GalleryState>({ status: 'idle' });
  const [isSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem('openai_api_key', apiKey);
  }, [apiKey]);


  const handleGenerate = useCallback(
    async (prompt: string) => {
      // console.log("BUTTON CLICKED");
      if (!apiKey) {
        setGenerationState({
          status: 'error',
          message: 'Please enter your API key',
        });
        return;
      }

      setGenerationState({ status: 'loading' });

      // console.log(apiKey);


      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `
You are a React UI generator.

Return ONLY valid JSX.
No explanations.
No markdown.
No code fences.
No imports.

The output MUST start with <div> and end with </div>.

Use Tailwind CSS.

Component:
${prompt}
                      `,
                    },
                  ],
                },
              ],
            }),
          }
        );

        const data = await response.json();

        console.log("FULL GEMINI RESPONSE:", data);

        const raw =
          data?.candidates
            ?.flatMap((c: any) => c.content?.parts || [])
            ?.map((p: any) => p.text || '')
            ?.join('\n') || '';

        if (!raw) {
          console.log("Empty response from Gemini:", data);
          setGenerationState({
            status: 'error',
            message: 'No code was generated. Try a different prompt.',
          });
          return;
        }

        const code = cleanGeneratedCode(raw);

        if (!code) {
          setGenerationState({
            status: 'error',
            message: 'Failed to clean generated code.',
          });
          return;
        }

        setGenerationState({ status: 'success', code, prompt });

      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Generation failed';

        setGenerationState({ status: 'error', message });
      }
    },
    [apiKey]
  );

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
     
      <Sidebar
        onGenerate={handleGenerate}
        isLoading={generationState.status === 'loading'}
        apiKey={apiKey}
        onApiKeySave={setApiKey}
      />


      <div className="flex-1 flex items-center justify-center p-8">
        {generationState.status === 'idle' && (
          <p className="text-gray-500">
            Describe a component to generate code
          </p>
        )}

        {generationState.status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Generating...</p>
          </div>
        )}

        {generationState.status === 'error' && (
          <p className="text-red-400">
            {generationState.message}
          </p>
        )}

        {generationState.status === 'success' && (
          <div className="max-w-2xl w-full">
            <p className="text-sm text-gray-400 mb-2">
              Generated code:
            </p>

            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-green-400 overflow-auto max-h-96">
              {generationState.code}
            </pre>
          </div>
        )}
      </div>

      <aside className="w-48 bg-gray-900 border-l border-gray-800 flex items-center justify-center">
        <p className="text-xs text-gray-500">
          Gallery - Class 5
        </p>
      </aside>
    </div>
  );
};