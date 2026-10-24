// apps/web/test/preview-security.test.tsx
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
import {
  PREVIEW_SANDBOX_PERMISSIONS,
  PREVIEW_CSP,
  buildSrcdoc,
  scrubErrorMessage,
  formatJsxCode,
} from '../src/lib/preview-sandbox.ts';
import type { GenerationState } from '../src/types.ts';

describe('Preview Security Boundary & Sandboxing', () => {
  describe('1. Iframe Sandbox Permissions', () => {
    it('grants only allow-scripts to the preview iframe', () => {
      assert.equal(PREVIEW_SANDBOX_PERMISSIONS, 'allow-scripts');
    });

    it('strictly omits allow-same-origin to maintain an opaque null origin', () => {
      // Adding allow-same-origin would let generated code access parent DOM, cookies, and localStorage
      assert.ok(
        !PREVIEW_SANDBOX_PERMISSIONS.includes('allow-same-origin'),
        'allow-same-origin MUST NOT be granted to untrusted preview code'
      );
    });

    it('omits dangerous navigation and UI disruption permissions', () => {
      assert.ok(!PREVIEW_SANDBOX_PERMISSIONS.includes('allow-top-navigation'));
      assert.ok(!PREVIEW_SANDBOX_PERMISSIONS.includes('allow-top-navigation-by-user-activation'));
      assert.ok(!PREVIEW_SANDBOX_PERMISSIONS.includes('allow-modals'));
      assert.ok(!PREVIEW_SANDBOX_PERMISSIONS.includes('allow-popups'));
      assert.ok(!PREVIEW_SANDBOX_PERMISSIONS.includes('allow-forms'));
      assert.ok(!PREVIEW_SANDBOX_PERMISSIONS.includes('allow-downloads'));
    });

    it('renders iframe with verified sandbox attribute in PreviewPanel', () => {
      const state: GenerationState = {
        status: 'success',
        code: '<button className="p-2">Click</button>',
        prompt: 'button',
      };
      const html = renderToStaticMarkup(
        <PreviewPanel state={state} onSave={() => {}} isSaving={false} />
      );

      assert.ok(html.includes('sandbox="allow-scripts"'));
      assert.ok(!html.includes('allow-same-origin'));
      assert.ok(!html.includes('allow-top-navigation'));
    });
  });

  describe('2. Content Security Policy (CSP)', () => {
    it('embeds restrictive Content-Security-Policy meta tag in srcdoc', () => {
      const srcdoc = buildSrcdoc('<div>Hello</div>');
      assert.ok(srcdoc.includes('<meta http-equiv="Content-Security-Policy"'));
    });

    it('blocks all outbound network connections via connect-src none', () => {
      // connect-src 'none' prevents generated code from calling fetch/XHR to localhost or exfiltrating data
      assert.ok(
        PREVIEW_CSP.includes("connect-src 'none'"),
        'connect-src none is required to block fetch/XHR network requests'
      );
      const srcdoc = buildSrcdoc('<div>Hello</div>');
      assert.ok(srcdoc.includes("connect-src 'none'"));
    });

    it('blocks nested frames and plugins via frame-src none and object-src none', () => {
      assert.ok(PREVIEW_CSP.includes("frame-src 'none'"));
      assert.ok(PREVIEW_CSP.includes("object-src 'none'"));
      assert.ok(PREVIEW_CSP.includes("base-uri 'none'"));
      assert.ok(PREVIEW_CSP.includes("form-action 'none'"));
    });

    it('restricts script execution to unpkg and tailwind cdn with required eval for babel', () => {
      assert.ok(PREVIEW_CSP.includes("https://unpkg.com"));
      assert.ok(PREVIEW_CSP.includes("https://cdn.tailwindcss.com"));
      assert.ok(PREVIEW_CSP.includes("'unsafe-eval'"));
      assert.ok(PREVIEW_CSP.includes("'unsafe-inline'"));
    });
  });

  describe('3. Script Breakout Prevention & Sanitization', () => {
    it('escapes </script> tags in JSX code to prevent breaking out of script container', () => {
      const maliciousCode = '<div onClick={() => {}}></script><script>alert("pwned")</script></div>';
      const srcdoc = buildSrcdoc(maliciousCode);

      // The raw closing </script> must not appear unescaped inside the HTML script payload
      const scriptParts = srcdoc.split('<script>');
      const executionScript = scriptParts[scriptParts.length - 1];

      assert.ok(
        !executionScript.includes('</script><script>'),
        'Unescaped closing script tag must not break execution script block'
      );
      assert.ok(
        executionScript.includes('<\\/script>'),
        'Closing script tag should be safely escaped as <\\/script>'
      );
    });

    it('escapes case-insensitive </SCRIPT> variations', () => {
      const maliciousCode = '<div></SCRIPT><SCRIPT>evil()</SCRIPT></div>';
      const srcdoc = buildSrcdoc(maliciousCode);
      const executionScript = srcdoc.split('<script>').pop() || '';

      assert.ok(!executionScript.includes('</SCRIPT>'));
      assert.ok(executionScript.toLowerCase().includes('<\\/script>'));
    });

    it('safely serializes quotes, newlines, and backslashes via JSON encoding', () => {
      const complexJsx = '<div className={"test \\"value\\""}>\n\t<p>Line 2</p>\n</div>';
      const srcdoc = buildSrcdoc(complexJsx);

      assert.ok(srcdoc.includes('var rawCode = '));
      // Does not contain syntax-breaking raw unescaped newlines in the string literal declaration
      assert.ok(!srcdoc.includes('var rawCode = <div'));
    });

    it('uses classic React runtime in Babel transform to prevent ES module import emission', () => {
      const srcdoc = buildSrcdoc('<div>Component</div>');

      // The classic runtime uses React.createElement rather than emitting "import { jsx as _jsx } from 'react/jsx-runtime'"
      assert.ok(
        srcdoc.includes("['react', { runtime: 'classic' }]"),
        'Babel transform must explicitly configure classic runtime to prevent module import syntax errors in eval'
      );
    });

    it('strips stray import/export statements in preview runner', () => {
      const srcdoc = buildSrcdoc("import React from 'react'; <div className=\"p-4\">Clean</div>");
      assert.ok(srcdoc.includes('.replace(/import\\s+'));
      assert.ok(srcdoc.includes('.replace(/export\\s+'));
    });

    it('formats single-line JSX with clean indentation and newlines', () => {
      const singleLine = '<div className="p-4"><header><h1>Title</h1></header><p>Desc</p></div>';
      const formatted = formatJsxCode(singleLine);
      assert.ok(formatted.includes('\n'));
      assert.ok(formatted.split('\n').length >= 4);
    });
  });

  describe('4. Error Handling & Safe DOM Rendering', () => {
    it('uses textContent instead of innerHTML to prevent DOM injection in error display', () => {
      const srcdoc = buildSrcdoc('<div>Component</div>');

      assert.ok(
        srcdoc.includes('body.textContent = scrubError(detail)'),
        'Error messages must be assigned to textContent, not innerHTML'
      );
      assert.ok(
        !srcdoc.includes("root.innerHTML = '<div class=\"error-display\">'"),
        'Direct innerHTML concatenation of errors must be eliminated'
      );
    });

    it('distinguishes compilation errors from runtime errors in execution script', () => {
      const srcdoc = buildSrcdoc('<div>Component</div>');

      // Phase 1 detects compilation errors
      assert.ok(srcdoc.includes("displayError('Compilation Error'"));
      // Phase 2 detects runtime errors
      assert.ok(srcdoc.includes("displayError('Runtime Error'"));
      // React ErrorBoundary detects runtime render exceptions
      assert.ok(srcdoc.includes("displayError('Runtime Render Error'") || srcdoc.includes("'Runtime Render Error'"));
      // Dependency check detects failed CDNs
      assert.ok(srcdoc.includes("displayError('Initialization Error'"));
    });

    it('wraps component in a React ErrorBoundary to catch lifecycle render errors', () => {
      const srcdoc = buildSrcdoc('<div>Component</div>');

      assert.ok(srcdoc.includes('class ErrorBoundary extends React.Component'));
      assert.ok(srcdoc.includes('static getDerivedStateFromError'));
      assert.ok(srcdoc.includes('React.createElement(ErrorBoundary'));
    });

    it('registers global window.onerror and unhandledrejection handlers early', () => {
      const srcdoc = buildSrcdoc('<div>Component</div>');

      assert.ok(srcdoc.includes('window.onerror = function('));
      assert.ok(srcdoc.includes("window.addEventListener('unhandledrejection'"));
    });
  });

  describe('5. Credential Scrubbing & Isolation of Application Secrets', () => {
    it('redacts Gemini API keys from error messages', () => {
      const raw = 'Request failed: https://generativelanguage.googleapis.com?key=AQ.FAKE_GEMINI_KEY_FOR_TESTING_1234567890_ABCD';
      const scrubbed = scrubErrorMessage(raw);

      assert.ok(!scrubbed.includes('AQ.FAKE_GEMINI_KEY_FOR_TESTING_1234567890_ABCD'));
      assert.ok(scrubbed.includes('[REDACTED_API_KEY]'));
    });

    it('redacts Google AIza keys from error messages', () => {
      const raw = 'Error with key AIzaSyD3x92ExampleSecretKey12345 in preview';
      const scrubbed = scrubErrorMessage(raw);

      assert.ok(!scrubbed.includes('AIzaSyD3x92ExampleSecretKey12345'));
      assert.ok(scrubbed.includes('[REDACTED_API_KEY]'));
    });

    it('redacts Authorization Bearer tokens from error messages', () => {
      const raw = 'Header Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid';
      const scrubbed = scrubErrorMessage(raw);

      assert.ok(!scrubbed.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
      assert.ok(scrubbed.includes('Bearer [REDACTED_TOKEN]'));
    });

    it('does not leak parent application secrets or tokens into the preview srcdoc', () => {
      const sensitiveToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.parent_token_secret';
      localStorage.setItem('token', sensitiveToken);

      const srcdoc = buildSrcdoc('<div className="p-4">Safe Component</div>');

      assert.ok(!srcdoc.includes(sensitiveToken));
      assert.ok(!srcdoc.includes('parent_token_secret'));
    });
  });

  describe('6. Resource Control & Recovery Safeguards', () => {
    it('renders Reload button in Preview tab so users can recover from corrupted iframe state', () => {
      const state: GenerationState = {
        status: 'success',
        code: '<div>Sample</div>',
        prompt: 'Sample',
      };
      const html = renderToStaticMarkup(
        <PreviewPanel state={state} onSave={() => {}} isSaving={false} />
      );

      assert.ok(html.includes('Reload'));
      assert.ok(html.includes('title="Reload preview iframe"'));
    });

    it('allows switching to Code tab even when viewing generated component', () => {
      const state: GenerationState = {
        status: 'success',
        code: '<button>Click Me</button>',
        prompt: 'Button',
      };
      const html = renderToStaticMarkup(
        <PreviewPanel state={state} onSave={() => {}} isSaving={false} />
      );

      assert.ok(html.includes('Preview'));
      assert.ok(html.includes('Code'));
      assert.ok(html.includes('Live render'));
    });

    it('unmounts iframe when transitioning to idle or loading, terminating execution', () => {
      const idleHtml = renderToStaticMarkup(
        <PreviewPanel state={{ status: 'idle' }} onSave={() => {}} isSaving={false} />
      );
      assert.ok(!idleHtml.includes('iframe'));

      const loadingHtml = renderToStaticMarkup(
        <PreviewPanel state={{ status: 'loading' }} onSave={() => {}} isSaving={false} />
      );
      assert.ok(!loadingHtml.includes('iframe'));
    });
  });
});
