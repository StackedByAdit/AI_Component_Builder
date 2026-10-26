// apps/api/benchmark/runner.ts
// purpose: executes the benchmark dataset in either deterministic mock mode or live Gemini API mode

import { BENCHMARK_DATASET, type BenchmarkPrompt } from './dataset.js';
import { verifyJsxRender } from './renderValidator.js';
import { calculateMetrics, type EvaluationReport, type PromptEvaluationRecord } from './metrics.js';
import {
  generateComponentWithRepair,
  DEFAULT_MODEL,
  DEFAULT_TIMEOUT_MS,
  MAX_REPAIRS,
} from '../src/lib/geminiGenerator.js';
import { validateJsx } from '../src/lib/jsxValidator.js';

export interface RunBenchmarkOptions {
  mode?: 'deterministic' | 'live';
  apiKey?: string;
  apiKeys?: string[];
  model?: string;
  timeoutMs?: number;
  dataset?: BenchmarkPrompt[];
  onProgress?: (current: number, total: number, prompt: BenchmarkPrompt, record: PromptEvaluationRecord) => void;
}

/**
 * Creates a deterministic mock fetch function tailored to a specific benchmark prompt.
 */
export const createPromptMockFetch = (prompt: BenchmarkPrompt) => {
  let callCount = 0;
  const responses = prompt.mockResponses || [
    `<div className="p-4 bg-white rounded-xl shadow-xs border border-gray-100 text-gray-900">${prompt.prompt}</div>`,
  ];

  return async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const rawJsx = responses[callCount] !== undefined ? responses[callCount] : responses[responses.length - 1];
    callCount++;

    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ jsx: rawJsx }) }],
            },
          },
        ],
      }),
      text: async () => JSON.stringify({ jsx: rawJsx }),
    } as unknown as Response;
  };
};

export const runBenchmark = async (options: RunBenchmarkOptions = {}): Promise<EvaluationReport> => {
  const mode = options.mode || 'deterministic';
  const model = options.model || DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const dataset = options.dataset || BENCHMARK_DATASET;

  const apiKeys =
    options.apiKeys && options.apiKeys.length > 0
      ? options.apiKeys
      : options.apiKey
      ? options.apiKey.split(',').map((k) => k.trim()).filter(Boolean)
      : process.env.GEMINI_API_KEYS
      ? process.env.GEMINI_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean)
      : process.env.GEMINI_API_KEY
      ? [process.env.GEMINI_API_KEY]
      : [];

  if (mode === 'live' && apiKeys.length === 0) {
    throw new Error(
      'Live benchmark evaluation requires GEMINI_API_KEY. Set it in apps/api/.env or pass apiKey/apiKeys option.'
    );
  }

  const records: PromptEvaluationRecord[] = [];

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const startTime = performance.now();

    let record: PromptEvaluationRecord = {
      promptId: item.id,
      category: item.category,
      promptText: item.prompt,
      expectedBehavior: item.expectedBehavior,
      success: false,
      attemptsMade: 0,
      totalRequests: 0,
      latencyMs: 0,
      firstAttemptCompiled: false,
      finalCompiled: false,
      rendered: false,
    };

    try {
      // Setup fetchFn: either custom deterministic mock for this prompt or global fetch for live
      const fetchFn = mode === 'deterministic' ? createPromptMockFetch(item) : fetch;
      const promptApiKey = apiKeys.length > 0 ? apiKeys[i % apiKeys.length] : 'BENCHMARK_MOCK_API_KEY';

      const result = await generateComponentWithRepair({
        prompt: item.prompt,
        apiKey: promptApiKey,
        apiKeys: apiKeys.length > 0 ? apiKeys : undefined,
        timeoutMs,
        model,
        fetchFn,
      });

      const elapsedMs = Math.round(performance.now() - startTime);

      const attemptsMade = result.attempts;
      const firstAttemptCompiled = attemptsMade === 1;
      const finalValidation = validateJsx(result.code);
      const finalCompiled = finalValidation.valid;

      // Headless render verification
      const renderResult = finalCompiled ? verifyJsxRender(result.code) : { rendered: false };

      record = {
        promptId: item.id,
        category: item.category,
        promptText: item.prompt,
        expectedBehavior: item.expectedBehavior,
        success: true,
        code: result.code,
        attemptsMade,
        totalRequests: attemptsMade,
        latencyMs: elapsedMs,
        firstAttemptCompiled,
        finalCompiled,
        rendered: renderResult.rendered,
        renderError: renderResult.error,
      };
    } catch (err: any) {
      const elapsedMs = Math.round(performance.now() - startTime);
      const isValidationError = err?.name === 'GenerationValidationError';
      const attemptsMade = isValidationError ? MAX_REPAIRS + 1 : 1;
      const totalRequests = item.prompt.trim() === '' ? 0 : attemptsMade;

      record = {
        promptId: item.id,
        category: item.category,
        promptText: item.prompt,
        expectedBehavior: item.expectedBehavior,
        success: false,
        code: isValidationError ? err.code : undefined,
        attemptsMade,
        totalRequests,
        latencyMs: elapsedMs,
        firstAttemptCompiled: false,
        finalCompiled: false,
        rendered: false,
        error: err?.message || 'Generation failed',
      };
    }

    records.push(record);

    if (options.onProgress) {
      options.onProgress(i + 1, dataset.length, item, record);
    }

    // Pacing delay between live API calls to respect RPM quotas
    if (mode === 'live' && i < dataset.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  return calculateMetrics({
    records,
    mode,
    model,
    maxRepairs: MAX_REPAIRS,
    timeoutMs,
  });
};
