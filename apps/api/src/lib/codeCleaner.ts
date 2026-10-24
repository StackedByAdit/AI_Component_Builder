// apps/api/src/lib/codeCleaner.ts
// purpose: robust extraction, cleanup, and formatting of pure JSX from AI responses

/**
 * Pretty formats JSX code with clean indentation and newlines if the AI returned single-line JSX.
 */
export const formatJsxCode = (code: string): string => {
  if (!code || typeof code !== 'string') return '';
  const trimmed = code.trim();

  // If already multiline with at least 4 lines, keep it as is
  if (trimmed.split('\n').length > 4) {
    return trimmed;
  }

  let formatted = '';
  let indentLevel = 0;
  const indent = '  ';

  // Tokenize by JSX tags (<tag ...>, </tag>, <tag ... />) while keeping text/expressions
  const tokens = trimmed.split(/(<\/?[a-zA-Z0-9_.:$-]+(?:\s+[^>]*?)?\/?>)/g).filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim();
    if (!token) continue;

    if (token.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
      formatted += (formatted ? '\n' : '') + indent.repeat(indentLevel) + token;
    } else if (token.startsWith('<') && token.endsWith('/>')) {
      formatted += (formatted ? '\n' : '') + indent.repeat(indentLevel) + token;
    } else if (token.startsWith('<')) {
      formatted += (formatted ? '\n' : '') + indent.repeat(indentLevel) + token;
      indentLevel++;
    } else {
      formatted += (formatted ? '\n' : '') + indent.repeat(indentLevel) + token;
    }
  }

  return formatted.trim() || trimmed;
};

export const cleanGeneratedCode = (raw: string): string => {
  if (!raw || typeof raw !== 'string') return '';
  let code = raw.trim();

  // 1. Try parsing directly as JSON (e.g. structured output { "jsx": "..." })
  try {
    const parsed = JSON.parse(code);
    if (parsed && typeof parsed.jsx === 'string') {
      code = parsed.jsx.trim();
    } else if (parsed && typeof parsed.code === 'string') {
      code = parsed.code.trim();
    }
  } catch {
    // 2. Check if JSON is wrapped in a markdown code fence like ```json { ... } ```
    const jsonMatch = code.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed && typeof parsed.jsx === 'string') {
          code = parsed.jsx.trim();
        } else if (parsed && typeof parsed.code === 'string') {
          code = parsed.code.trim();
        }
      } catch {}
    }
  }

  // 3. Strip any outer markdown fences if still present
  const codeBlockMatch = code.match(/```(?:jsx|tsx|html|javascript|typescript)?\s*\n?([\s\S]*?)\n?```/i);
  if (codeBlockMatch) {
    code = codeBlockMatch[1].trim();
  } else {
    // Strip stray backticks at boundaries
    code = code.replace(/^```[a-zA-Z0-9_-]*\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  }

  // 4. Remove import statements (handles single-line and multiline imports)
  code = code.replace(/import\s+[^;]*?from\s+['"][^'"]*['"]\s*;?\s*/gi, '');
  code = code.replace(/import\s+['"][^'"]*['"]\s*;?\s*/gi, '');
  code = code.replace(/import\s+[\s\S]*?;\s*/gi, '');

  // 5. Remove export statements
  code = code.replace(/export\s+(?:default\s+)?/gi, '');

  // 6. Unwrap functional component or return statement if AI wrapped it
  const returnMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*(?:\}|\);?)*\s*$/);
  if (returnMatch && returnMatch[1].trim().startsWith('<')) {
    code = returnMatch[1].trim();
  } else {
    const arrowDirectMatch = code.match(/(?:const|let|var)?\s*\w+\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>\s*(?:\(?\s*)(<[\s\S]*>)(?:\s*\)?\s*;?)$/);
    if (arrowDirectMatch && arrowDirectMatch[1].trim().startsWith('<')) {
      code = arrowDirectMatch[1].trim();
    }
  }

  // 7. Clean trailing semicolon if present after closing JSX tag
  code = code.trim();
  if (code.endsWith(';') && code.endsWith('>;')) {
    code = code.slice(0, -1).trim();
  }

  return code;
};
