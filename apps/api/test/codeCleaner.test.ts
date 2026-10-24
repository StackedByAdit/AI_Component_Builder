// apps/api/test/codeCleaner.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanGeneratedCode, formatJsxCode } from '../src/lib/codeCleaner.js';

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

  it('removes single-line import and export statements on the same line as JSX', () => {
    const raw = `import React, { useState } from 'react'; <div className="p-4">Content</div>`;
    const cleaned = cleanGeneratedCode(raw);
    assert.ok(!cleaned.includes('import'));
    assert.ok(cleaned.includes('<div className="p-4">'));
  });

  it('formats single-line JSX with clean indentation and newlines', () => {
    const raw = `<div className="card"><header><h1>Title</h1></header><p>Description</p></div>`;
    const formatted = formatJsxCode(raw);
    assert.ok(formatted.includes('\n'));
    assert.ok(formatted.split('\n').length >= 4);
    assert.ok(formatted.startsWith('<div'));
    assert.ok(formatted.endsWith('</div>'));
  });

  it('handles empty or non-string inputs safely', () => {
    assert.equal(cleanGeneratedCode(''), '');
    assert.equal(cleanGeneratedCode(null as any), '');
    assert.equal(cleanGeneratedCode(undefined as any), '');
  });
});
