// apps/api/src/lib/jsxValidator.ts
// purpose: validate that generated code is syntactically valid JSX

import ts from 'typescript';

export interface JsxValidationResult {
  valid: boolean;
  errors?: string[];
}

export const validateJsx = (code: string): JsxValidationResult => {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return { valid: false, errors: ['Generated code is empty.'] };
  }

  const trimmed = code.trim();

  // Ensure it starts and ends with JSX tags
  if (!trimmed.startsWith('<') || !trimmed.endsWith('>')) {
    return {
      valid: false,
      errors: ['Generated code must be a JSX element starting with "<" and ending with ">".'],
    };
  }

  // Wrap in component expression to validate with TypeScript compiler
  const wrappedSource = `const Component = () => (\n${trimmed}\n);`;

  const result = ts.transpileModule(wrappedSource, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2020,
    },
    reportDiagnostics: true,
  });

  if (result.diagnostics && result.diagnostics.length > 0) {
    const errors = result.diagnostics.map((d) =>
      typeof d.messageText === 'string'
        ? d.messageText
        : ts.flattenDiagnosticMessageText(d.messageText, ' ')
    );
    return { valid: false, errors };
  }

  return { valid: true };
};
