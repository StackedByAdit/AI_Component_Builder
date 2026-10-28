// src/preview-panel.tsx
// purpose: live preview iframe and syntax-highlighted code display for generated components

import { useState, useCallback, useMemo } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import type { PreviewPanelProps } from './types';
import {
  PREVIEW_SANDBOX_PERMISSIONS,
  buildSrcdoc,
  formatJsxCode,
} from './lib/preview-sandbox';

export const PreviewPanel = ({
  state,
  onSave,
  isSaving,
  isSaved = false,
}: PreviewPanelProps) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [previewKey, setPreviewKey] = useState(0);

  const handleReload = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <div className="flex items-center justify-between px-4 py-2.5 bg-forge-paper border-b border-forge-line">
        <div className="flex items-center gap-3">
          <div className="flex gap-4">
            <TabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')}>
              Preview
            </TabButton>
            <TabButton active={activeTab === 'code'} onClick={() => setActiveTab('code')}>
              Code
            </TabButton>
          </div>
          {state.status === 'success' && (
            <span className="text-xs text-forge-muted border-l border-forge-line pl-3">
              Live render
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.status === 'success' && (
            <>
              {activeTab === 'preview' && (
                <button
                  onClick={handleReload}
                  title="Reload preview iframe"
                  className="text-xs px-2.5 py-1.5 bg-transparent text-forge-ink border border-forge-line hover:bg-forge-bg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
                >
                  Reload
                </button>
              )}
              <CopyButton code={state.code} />
              <button
                onClick={onSave}
                disabled={isSaving || isSaved}
                className={`relative text-xs px-3 py-1.5 transition-colors flex items-center gap-1.5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink ${
                  isSaved
                    ? 'bg-forge-bg text-forge-ink border border-forge-line cursor-default'
                    : isSaving
                    ? 'bg-forge-ink/80 text-white cursor-wait'
                    : 'bg-forge-ink text-white hover:bg-black'
                }`}
                title={isSaved ? 'Component already saved' : 'Save component'}
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 text-forge-ink animate-checkmark"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                      />
                    </svg>
                    <span>Save</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-forge-bg p-6 overflow-auto min-w-0 min-h-0">
        {state.status === 'idle' && <IdlePlaceholder />}
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'error' && <ErrorState message={state.message} />}
        {state.status === 'success' && (
          activeTab === 'preview' ? (
            <WebPreview code={state.code} reloadKey={previewKey} />
          ) : (
            <CodeBlock code={state.code} />
          )
        )}
      </div>
    </div>
  );
};

const IdlePlaceholder = () => (
  <div className="text-center">
    <svg className="w-16 h-16 mx-auto mb-4 text-forge-line" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
    <p className="text-sm text-forge-ink">Describe a component to see a live preview</p>
    <p className="text-xs text-forge-muted mt-1">Your generated UI will appear here</p>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="w-10 h-10 border-2 border-forge-ink border-t-transparent rounded-full animate-spin" />
    <div className="text-center">
      <p className="text-sm text-forge-ink">Generating component...</p>
      <p className="text-xs text-forge-muted mt-1">This usually takes a few seconds</p>
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="text-center max-w-sm">
    <div className="w-10 h-10 mx-auto mb-3 border border-red-200 bg-red-50 flex items-center justify-center">
      <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    <p className="text-sm text-red-800">{message}</p>
    <p className="text-xs text-forge-muted mt-2">Try a different prompt or check your API key</p>
  </div>
);

const WebPreview = ({ code, reloadKey }: { code: string; reloadKey?: number }) => {
  const srcdoc = useMemo(() => buildSrcdoc(code), [code]);

  return (
    <div className="w-full h-full overflow-hidden border border-forge-line bg-white">
      <iframe
        key={reloadKey ?? 0}
        srcDoc={srcdoc}
        sandbox={PREVIEW_SANDBOX_PERMISSIONS}
        title="Component Preview"
        className="w-full h-full border-0"
      />
    </div>
  );
};

const CodeBlock = ({ code }: { code: string }) => {
  const formattedCode = useMemo(() => formatJsxCode(code), [code]);
  const bgColor = '#1c1917';

  return (
    <div
      className="w-full h-full overflow-auto border border-forge-line bg-[#1c1917] min-w-0"
      style={{ backgroundColor: bgColor }}
    >
      <Highlight theme={themes.nightOwl} code={formattedCode} language="jsx">
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="min-w-full w-max p-4 m-0 font-mono text-[13px] leading-relaxed block"
            style={{
              ...style,
              minWidth: '100%',
              width: 'max-content',
              margin: 0,
              padding: '16px',
              fontSize: '13px',
              backgroundColor: bgColor,
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="inline-block w-8 text-right mr-4 text-gray-600 select-none">
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};

const CopyButton = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const formatted = formatJsxCode(code);
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-3 py-1.5 bg-transparent text-forge-ink border border-forge-line hover:bg-forge-bg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink"
    >
      {copied ? 'Copied!' : 'Copy Code'}
    </button>
  );
};

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`px-1 py-1.5 text-xs font-medium border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forge-ink ${
      active
        ? 'border-forge-ink text-forge-ink'
        : 'border-transparent text-forge-muted hover:text-forge-ink'
    }`}
  >
    {children}
  </button>
);
