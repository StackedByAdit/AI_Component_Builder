// apps/api/test/codeCleaner.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanGeneratedCode } from '../src/lib/codeCleaner.js';

describe('codeCleaner', () => {
  it('extracts jsx from structured JSON', () => {
    const raw = JSON.stringify({ jsx: '<div className="p-4">Hello World</div>' });
    const cleaned = cleanGeneratedCode(raw);
    assert.equal(cleaned, '<div className="p-4">Hello World</div>');
  });

  it('extracts jsx from markdown-wrapped JSON', () => {
    const raw = '```json\n{\n  "jsx": "<div className=\\"p-4\\">Hello World</div>"\n}\n```';
    const cleaned = cleanGeneratedCode(raw);
    assert.equal(cleaned, '<div className="p-4">Hello World</div>');
  });

  it('strips markdown code fences from raw JSX', () => {
    const raw = '```jsx\n<div className="flex"><span>Test</span></div>\n```';
    const cleaned = cleanGeneratedCode(raw);
    assert.equal(cleaned, '<div className="flex"><span>Test</span></div>');
  });

  it('removes import and export statements', () => {
    const raw = `import React from 'react';
import { useState } from 'react';
export default function Component() {
  return (
    <div className="card">Card Content</div>
  );
}`;
    const cleaned = cleanGeneratedCode(raw);
    assert.equal(cleaned, '<div className="card">Card Content</div>');
  });

  it('unwraps arrow function component returning JSX', () => {
    const raw = `const MyComponent = () => (
  <div className="card">Arrow Card</div>
);`;
    const cleaned = cleanGeneratedCode(raw);
    assert.equal(cleaned, '<div className="card">Arrow Card</div>');
  });

  it('removes trailing semicolon after closing tag', () => {
    const raw = '<div className="p-2">Text</div>;';
    const cleaned = cleanGeneratedCode(raw);
    assert.equal(cleaned, '<div className="p-2">Text</div>');
  });

  it('handles empty or non-string inputs safely', () => {
    assert.equal(cleanGeneratedCode(''), '');
    assert.equal(cleanGeneratedCode(null as any), '');
    assert.equal(cleanGeneratedCode(undefined as any), '');
  });
});
