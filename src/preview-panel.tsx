// src/preview-panel.tsx
// purpose: live preview iframe and syntax-highlighted code display for generated components

import { useState, useCallback, useMemo } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import type { PreviewPanelProps } from './types';

// builds a sandboxed html document that renders jsx with react 18, babel, and tailwind via cdn
export const buildSrcdoc = (jsxCode: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background: white; }
    .error-display { color: #ef4444; padding: 16px; font-family: monospace; font-size: 14px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      const Component = () => (
        ${jsxCode}
      );
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Component));
    } catch (err) {
      document.getElementById('root').innerHTML = '<div class="error-display">Render error: ' + err.message + '</div>';
    }
  <\/script>
  <script>
    window.onerror = function(msg) {
      document.getElementById('root').innerHTML = '<div class="error-display">Error: ' + msg + '</div>';
    };
  <\/script>
</body>
</html>`;
