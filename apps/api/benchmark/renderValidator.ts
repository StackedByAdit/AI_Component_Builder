// apps/api/benchmark/renderValidator.ts
// purpose: headless React runtime evaluation to verify that generated JSX executes without throwing exceptions

import ts from 'typescript';

export interface RenderResult {
  rendered: boolean;
  error?: string;
  element?: {
    type: string | symbol | Function;
    props: Record<string, any> | null;
  };
}

/**
 * Minimal React runtime mock sufficient to instantiate and execute React element trees
 * and standard React hooks without requiring a full DOM or browser engine.
 */
export const createMockReact = () => {
  const React = {
    createElement: (type: any, props: any = null, ...children: any[]) => {
      const flatChildren = children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
      return {
        $$typeof: Symbol.for('react.element'),
        type,
        props: props ? { ...props, children: flatChildren } : { children: flatChildren },
      };
    },
    Fragment: Symbol.for('react.fragment'),
    useState: (initial: any) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => {},
    useCallback: (fn: any) => fn,
    useMemo: (fn: any) => fn(),
    useRef: (initial: any) => ({ current: initial }),
  };

  return React;
};

/**
 * Headless render verification:
 * 1. Transpiles JSX into executable JavaScript (React.createElement calls).
 * 2. Instantiates the component function in an isolated execution context.
 * 3. Catches runtime reference errors, invalid hook usage, and runtime exceptions.
 *
 * Limitation: This tests JavaScript execution of the React component hierarchy.
 * It does NOT test browser DOM insertion, CSS Tailwind rendering, or browser iframe lifecycles.
 */
export const verifyJsxRender = (jsxCode: string): RenderResult => {
  if (!jsxCode || typeof jsxCode !== 'string' || !jsxCode.trim()) {
    return { rendered: false, error: 'JSX code is empty.' };
  }

  const trimmed = jsxCode.trim();
  if (!trimmed.startsWith('<') || !trimmed.endsWith('>')) {
    return { rendered: false, error: 'Code must be a JSX element starting with "<" and ending with ">".' };
  }

  // Wrap inside a component function that executes immediately
  const wrappedSource = `
    const { useState, useEffect, useCallback, useMemo, useRef } = React;
    const Component = () => (
${trimmed}
    );
    return Component();
  `;

  // Transpile JSX to JS using React JSX emit
  const transpiled = ts.transpileModule(wrappedSource, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2020,
    },
    reportDiagnostics: true,
  });

  if (transpiled.diagnostics && transpiled.diagnostics.length > 0) {
    const errorMessages = transpiled.diagnostics.map((d) =>
      typeof d.messageText === 'string'
        ? d.messageText
        : ts.flattenDiagnosticMessageText(d.messageText, ' ')
    );
    return {
      rendered: false,
      error: `Transpilation failed: ${errorMessages.join('; ')}`,
    };
  }

  const mockReact = createMockReact();

  try {
    // Execute transpiled component function with mock React in scope
    const evaluator = new Function('React', transpiled.outputText);
    const element = evaluator(mockReact);

    if (!element || typeof element !== 'object') {
      return {
        rendered: false,
        error: 'Component executed but did not return a valid React element.',
      };
    }

    return {
      rendered: true,
      element: {
        type: element.type,
        props: element.props,
      },
    };
  } catch (err: any) {
    return {
      rendered: false,
      error: `Runtime render exception: ${err?.message || String(err)}`,
    };
  }
};
