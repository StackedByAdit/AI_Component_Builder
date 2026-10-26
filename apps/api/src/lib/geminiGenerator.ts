// apps/api/src/lib/geminiGenerator.ts
// purpose: reliable gemini api caller with structured schema, automatic repair, timeout, cancellation, and secret scrubbing

import { cleanGeneratedCode } from './codeCleaner.js';
import { validateJsx } from './jsxValidator.js';

export const MAX_REPAIRS = 2;
export const DEFAULT_TIMEOUT_MS = 30000;
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

export class GenerationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'GenerationError';
    this.statusCode = statusCode;
  }
}

export class GenerationValidationError extends GenerationError {
  code: string;
  errors: string[];
  constructor(message: string, code: string, errors: string[]) {
    super(message, 422);
    this.name = 'GenerationValidationError';
    this.code = code;
    this.errors = errors;
  }
}

export const scrubSecrets = (text: string, secrets: (string | undefined)[]): string => {
  let result = text;
  for (const secret of secrets) {
    if (secret && typeof secret === 'string' && secret.length > 5) {
      result = result.split(secret).join('[REDACTED]');
    }
  }
  return result.replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED]');
};

export interface GenerateOptions {
  prompt: string;
  apiKey?: string;
  apiKeys?: string[];
  signal?: AbortSignal;
  timeoutMs?: number;
  model?: string;
  fetchFn?: typeof fetch;
}

export interface GenerateResult {
  code: string;
  attempts: number;
}

export const buildInitialPrompt = (userPrompt: string): string => {
  return [
    'You are an expert React UI generator.',
    'Return ONLY a valid JSX element styled with Tailwind CSS.',
    'The output must be a single root JSX element starting with a tag like <div and ending with its matching closing tag.',
    'Do NOT include import statements.',
    'Do NOT include export statements.',
    'Do NOT wrap the output in a function, class, or const component declaration.',
    'Do NOT include any markdown code fences, comments, or explanations outside the JSON response schema.',
    '',
    `User Request: ${userPrompt}`,
  ].join('\n');
};

export const buildRepairPrompt = (userPrompt: string, faultyCode: string, errors: string[]): string => {
  return [
    'You are an expert React UI generator.',
    'A previously generated JSX element failed compilation and syntax validation.',
    'Errors detected:',
    ...errors.map((e) => `- ${e}`),
    '',
    'Faulty JSX:',
    faultyCode,
    '',
    'Fix the errors and return ONLY the corrected, valid JSX element styled with Tailwind CSS.',
    'Must start with a root opening tag (e.g. <div) and end with its closing tag.',
    'Do NOT include imports, exports, or component wrapper functions.',
    '',
    `Original Request: ${userPrompt}`,
  ].join('\n');
};

export const callGeminiApi = async ({
  textPrompt,
  apiKey,
  signal,
  model = DEFAULT_MODEL,
  fetchFn = fetch,
}: {
  textPrompt: string;
  apiKey: string;
  signal?: AbortSignal;
  model?: string;
  fetchFn?: typeof fetch;
}): Promise<string> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: textPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          jsx: {
            type: 'STRING',
            description:
              'Pure valid JSX component starting with a root JSX element (like <div ...) and ending with its closing tag.',
          },
        },
        required: ['jsx'],
      },
    },
  };

  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 429) {
      throw new GenerationError('Gemini rate limit exceeded. Please wait a moment and try again.', 429);
    }
    if (res.status === 400) {
      throw new GenerationError(
        scrubSecrets(data.error?.message || 'Invalid prompt or generation request.', [apiKey]),
        400
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new GenerationError('Gemini API authentication failed.', 500);
    }
    if (res.status >= 500) {
      throw new GenerationError('Upstream Gemini service is temporarily unavailable.', 502);
    }
    const message = scrubSecrets(data.error?.message || `Gemini API error (${res.status})`, [apiKey]);
    throw new GenerationError(message, res.status >= 400 && res.status < 500 ? res.status : 500);
  }

  const rawCandidate = data?.candidates?.[0];
  if (!rawCandidate) {
    throw new GenerationError('No response candidate returned by Gemini.', 500);
  }

  if (rawCandidate.finishReason === 'SAFETY') {
    throw new GenerationError('Generation was blocked by safety filters. Try a different prompt.', 400);
  }

  const text =
    rawCandidate.content?.parts
      ?.map((p: any) => p.text || '')
      ?.join('\n') || '';

  if (!text.trim()) {
    throw new GenerationError('Gemini returned an empty response.', 500);
  }

  return text;
};

export const generateComponentWithRepair = async (options: GenerateOptions): Promise<GenerateResult> => {
  const {
    prompt,
    apiKey,
    apiKeys,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    model = DEFAULT_MODEL,
    fetchFn = fetch,
  } = options;

  if (!prompt || !prompt.trim()) {
    throw new GenerationError('Prompt is required.', 400);
  }

  const keyPool: string[] = apiKeys && apiKeys.length > 0
    ? apiKeys
    : apiKey
    ? apiKey.split(',').map((k) => k.trim()).filter(Boolean)
    : [];

  if (keyPool.length === 0) {
    throw new GenerationError('GEMINI_API_KEY is not configured.', 500);
  }

  if (signal?.aborted) {
    const error = new GenerationError('Generation was cancelled.', 499);
    error.name = 'AbortError';
    throw error;
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const effectiveSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let currentPrompt = buildInitialPrompt(prompt);
  let attempt = 0;
  let lastCode = '';
  let lastErrors: string[] = [];
  let activeKeyIndex = 0;

  while (attempt <= MAX_REPAIRS) {
    if (signal?.aborted) {
      const error = new GenerationError('Generation was cancelled.', 499);
      error.name = 'AbortError';
      throw error;
    }

    let rawResponse = '';
    try {
      let lastCallErr: any;
      let succeeded = false;

      for (let k = 0; k < keyPool.length; k++) {
        const keyToUse = keyPool[(activeKeyIndex + k) % keyPool.length];
        try {
          rawResponse = await callGeminiApi({
            textPrompt: currentPrompt,
            apiKey: keyToUse,
            signal: effectiveSignal,
            model,
            fetchFn,
          });
          activeKeyIndex = (activeKeyIndex + k) % keyPool.length;
          succeeded = true;
          break;
        } catch (callErr: any) {
          lastCallErr = callErr;
          if (callErr.statusCode === 429 && k < keyPool.length - 1) {
            // Brief backoff and rotate to next key on rate limit
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }
          throw callErr;
        }
      }

      if (!succeeded && lastCallErr) {
        throw lastCallErr;
      }
    } catch (err: any) {
      if (signal?.aborted) {
        const error = new GenerationError('Generation was cancelled.', 499);
        error.name = 'AbortError';
        throw error;
      }
      if (timeoutSignal.aborted || err.name === 'TimeoutError') {
        throw new GenerationError(`Generation request timed out after ${timeoutMs / 1000} seconds.`, 504);
      }
      if (err instanceof GenerationError) {
        throw err;
      }
      throw new GenerationError(scrubSecrets(err.message || 'Generation failed', keyPool), 500);
    }

    const cleanedCode = cleanGeneratedCode(rawResponse);
    lastCode = cleanedCode;

    const validation = validateJsx(cleanedCode);
    if (validation.valid) {
      return { code: cleanedCode, attempts: attempt + 1 };
    }

    lastErrors = validation.errors || ['Invalid JSX structure'];
    attempt++;

    if (attempt <= MAX_REPAIRS) {
      currentPrompt = buildRepairPrompt(prompt, cleanedCode, lastErrors);
    }
  }

  throw new GenerationValidationError(
    `Generated code failed validation after ${MAX_REPAIRS} repair attempts: ${lastErrors.join('; ')}`,
    lastCode,
    lastErrors
  );
};
