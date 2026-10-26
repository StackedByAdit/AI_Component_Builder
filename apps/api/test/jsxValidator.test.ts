// apps/api/test/jsxValidator.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateJsx } from '../src/lib/jsxValidator.js';

describe('validateJsx', () => {
  it('validates a correct JSX element tree', () => {
    const code = `<div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md space-y-2">
  <h2 className="text-xl font-bold text-gray-900">Card Title</h2>
  <p className="text-gray-500">This is a description paragraph.</p>
</div>`;
    const result = validateJsx(code);
    assert.equal(result.valid, true);
    assert.equal(result.errors, undefined);
  });

  it('validates a self-closing root tag', () => {
    const code = '<img src="/test.jpg" alt="test" className="w-12 h-12 rounded-full" />';
    const result = validateJsx(code);
    assert.equal(result.valid, true);
  });

  it('validates JSX with embedded expressions', () => {
    const code = `<button className={'px-4 py-2 rounded ' + (true ? 'bg-blue-600' : 'bg-gray-400')}>
  Click Me
</button>`;
    const result = validateJsx(code);
    assert.equal(result.valid, true);
  });

  it('rejects unclosed JSX tags', () => {
    const code = '<div><span>Missing closing span</div>';
    const result = validateJsx(code);
    assert.equal(result.valid, false);
    assert.ok(result.errors && result.errors.length > 0);
  });

  it('rejects invalid syntax inside expressions', () => {
    const code = '<div onClick={)}>Bad Syntax</div>';
    const result = validateJsx(code);
    assert.equal(result.valid, false);
    assert.ok(result.errors && result.errors.length > 0);
  });

  it('rejects code that does not start with < and end with >', () => {
    const code = 'Here is your component: <div>Hello</div>';
    const result = validateJsx(code);
    assert.equal(result.valid, false);
    assert.ok(result.errors?.[0]?.includes('must be a JSX element'));
  });

  it('rejects empty or whitespace code', () => {
    assert.equal(validateJsx('').valid, false);
    assert.equal(validateJsx('   \n  ').valid, false);
  });
});
