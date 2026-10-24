// apps/web/src/lib/preview-sandbox.ts
// purpose: sandbox attributes, content security policy, error scrubbing, and srcdoc generation for preview iframe

/**
 * Sandboxing permissions for the component preview.
 *
 * CRITICAL SECURITY PROPERTY:
 * We intentionally grant ONLY 'allow-scripts'.
 * We deliberately DO NOT grant 'allow-same-origin'.
 *
 * Without 'allow-same-origin', the sandboxed iframe is treated as having a unique opaque origin ('null').
 * This browser security boundary strictly guarantees that untrusted, AI-generated JavaScript:
 * 1. CANNOT access the parent document DOM (window.parent.document).
 * 2. CANNOT access the main application's localStorage (where JWT auth tokens are kept).
 * 3. CANNOT access the main application's sessionStorage or cookies.
 * 4. CANNOT navigate the parent window (top navigation is blocked).
 * 5. CANNOT trigger modal dialogs (alert/confirm/prompt are blocked).
 */
export const PREVIEW_SANDBOX_PERMISSIONS = 'allow-scripts';

/**
 * Restrictive Content Security Policy for the preview iframe.
 *
 * - connect-src 'none': Completely prevents generated code from making outbound network calls,
 *   exfiltrating data, or reaching backend endpoints via fetch, XMLHttpRequest, WebSocket, or beacon.
 * - script-src: Restricts scripts to trusted CDNs (unpkg for React/Babel, cdn.tailwindcss.com)
 *   and requires 'unsafe-eval' for client-side Babel compilation and 'unsafe-inline' for the runner script.
 * - style-src: Allows Tailwind CDN and inline preview styling.
 * - img-src / font-src: Allows components to display external images and fonts.
 * - frame-src 'none': Blocks embedding nested iframes.
 * - object-src 'none': Blocks Flash/plugins.
 * - base-uri 'none': Blocks <base> tag hijacking.
 * - form-action 'none': Blocks form submission navigations.
 */
export const PREVIEW_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.tailwindcss.com",
  "style-src 'unsafe-inline' https://cdn.tailwindcss.com",
  "img-src data: blob: https:",
  "font-src data: https:",
  "connect-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

/**
 * Scrubs sensitive API keys and authorization tokens from error messages
 * before displaying them in the preview interface.
 */
export const scrubErrorMessage = (text: string): string => {
  if (!text) return 'Unknown error';
  return String(text)
    .replace(/AQ\.[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]')
    .replace(/AIza[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');
};

/**
 * Builds a sandboxed HTML document that compiles and renders JSX with React 18, Babel, and Tailwind.
 * Features:
 * - Content Security Policy restricting network and framing.
 * - Script breakout prevention: escapes '</script' sequences.
 * - Explicit separation of Compilation Errors vs Runtime Errors vs Render Errors.
 * - Safe DOM insertion (textContent) to prevent DOM-based XSS when displaying errors.
 * - Redaction of sensitive credentials from error traces.
 */
export const buildSrcdoc = (jsxCode: string): string => {
  // Safely serialize JSX code as a JS string literal and escape any closing script tag attempts
  const safeSerializedJsx = JSON.stringify(jsxCode || '').replace(/<\/script/gi, '<\\/script');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}" />
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background: white; }
    .error-display { padding: 16px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 8px; font-family: system-ui, sans-serif; }
    .error-title { color: #dc2626; font-weight: 600; font-size: 14px; margin-bottom: 6px; }
    .error-body { color: #991b1b; font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Safe error reporting utility using textContent to prevent DOM-based XSS
    function scrubError(text) {
      if (!text) return 'Unknown error';
      return String(text)
        .replace(/AQ\\.[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]')
        .replace(/AIza[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]')
        .replace(/Bearer\\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');
    }

    function displayError(title, detail) {
      var root = document.getElementById('root');
      if (!root) return;
      root.textContent = '';

      var container = document.createElement('div');
      container.className = 'error-display';

      var header = document.createElement('div');
      header.className = 'error-title';
      header.textContent = title;

      var body = document.createElement('div');
      body.className = 'error-body';
      body.textContent = scrubError(detail);

      container.appendChild(header);
      container.appendChild(body);
      root.appendChild(container);
    }

    // Global uncaught error handler
    window.onerror = function(msg, url, line, col, err) {
      var errorText = err && err.message ? err.message : String(msg);
      var location = line ? ' (line ' + line + ')' : '';
      displayError('Runtime Error', errorText + location);
      return true;
    };

    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
      var reason = event.reason;
      var text = reason && reason.message ? reason.message : String(reason);
      displayError('Unhandled Promise Rejection', text);
    });
  </script>
  <script>
    (function() {
      var rawCode = ${safeSerializedJsx};

      if (!rawCode || !rawCode.trim()) {
        displayError('Preview Error', 'Component code is empty.');
        return;
      }

      // Verify essential runtime dependencies
      if (typeof React === 'undefined' || typeof ReactDOM === 'undefined' || typeof Babel === 'undefined') {
        displayError('Initialization Error', 'Required preview libraries (React, Babel) failed to load. Check network or CSP.');
        return;
      }

      var Component;

      // Phase 1: Explicit JSX Transpilation (detects compilation and syntax errors)
      try {
        var wrapped = [
          '(function() {',
          '  var useState = React.useState;',
          '  var useEffect = React.useEffect;',
          '  var useCallback = React.useCallback;',
          '  var useMemo = React.useMemo;',
          '  var useRef = React.useRef;',
          '  var useReducer = React.useReducer;',
          '  var useContext = React.useContext;',
          '  var createContext = React.createContext;',
          '  var Fragment = React.Fragment;',
          '  return function GeneratedComponent() {',
          '    return (\\n' + rawCode + '\\n);',
          '  };',
          '})()'
        ].join('\\n');

        var transpiled = Babel.transform(wrapped, {
          presets: ['react'],
          filename: 'generated-component.tsx'
        }).code;

        var factory = new Function('React', 'return ' + transpiled + ';');
        Component = factory(React);
      } catch (compileErr) {
        displayError('Compilation Error', compileErr && compileErr.message ? compileErr.message : String(compileErr));
        return;
      }

      // Phase 2: React Runtime Mount & Execution (catches render-time errors)
      try {
        class ErrorBoundary extends React.Component {
          constructor(props) {
            super(props);
            this.state = { hasError: false, error: null };
          }
          static getDerivedStateFromError(error) {
            return { hasError: true, error: error };
          }
          render() {
            if (this.state.hasError) {
              var msg = this.state.error && this.state.error.message ? this.state.error.message : String(this.state.error);
              return React.createElement('div', { className: 'error-display' },
                React.createElement('div', { className: 'error-title' }, 'Runtime Render Error'),
                React.createElement('div', { className: 'error-body' }, scrubError(msg))
              );
            }
            return this.props.children;
          }
        }

        var rootEl = document.getElementById('root');
        var root = ReactDOM.createRoot(rootEl);
        root.render(
          React.createElement(ErrorBoundary, null, React.createElement(Component))
        );
      } catch (runtimeErr) {
        displayError('Runtime Error', runtimeErr && runtimeErr.message ? runtimeErr.message : String(runtimeErr));
      }
    })();
  </script>
</body>
</html>`;
};
