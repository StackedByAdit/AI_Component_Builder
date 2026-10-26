// apps/api/test/benchmark.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePercentile,
  calculateMetrics,
  formatSummaryReport,
  type PromptEvaluationRecord,
} from '../benchmark/metrics.js';
import { verifyJsxRender } from '../benchmark/renderValidator.js';
import { runBenchmark } from '../benchmark/runner.js';
import { BENCHMARK_DATASET } from '../benchmark/dataset.js';

describe('Benchmark Metrics & Calculations', () => {
  describe('calculatePercentile', () => {
    it('handles empty and single-element arrays', () => {
      assert.equal(calculatePercentile([], 50), 0);
      assert.equal(calculatePercentile([100], 50), 100);
      assert.equal(calculatePercentile([100], 95), 100);
    });

    it('calculates median (p50) accurately', () => {
      const odd = [10, 20, 30, 40, 50];
      assert.equal(calculatePercentile(odd, 50), 30);

      const even = [10, 20, 30, 40];
      assert.equal(calculatePercentile(even, 50), 25);
    });

    it('calculates p95 with linear interpolation', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1); // 1 to 100
      const p95 = calculatePercentile(values, 95);
      assert.equal(p95, 95.05);
    });
  });

  describe('calculateMetrics', () => {
    it('computes 100% rates for a perfect run', () => {
      const records: PromptEvaluationRecord[] = [
        {
          promptId: 'test-1',
          category: 'simple-ui',
          promptText: 'Button',
          expectedBehavior: 'success',
          success: true,
          code: '<div className="btn">Click</div>',
          attemptsMade: 1,
          totalRequests: 1,
          latencyMs: 15,
          firstAttemptCompiled: true,
          finalCompiled: true,
          rendered: true,
        },
        {
          promptId: 'test-2',
          category: 'simple-ui',
          promptText: 'Card',
          expectedBehavior: 'success',
          success: true,
          code: '<div className="card">Content</div>',
          attemptsMade: 1,
          totalRequests: 1,
          latencyMs: 25,
          firstAttemptCompiled: true,
          finalCompiled: true,
          rendered: true,
        },
      ];

      const report = calculateMetrics({
        records,
        mode: 'deterministic',
        model: 'gemini-3.5-flash-lite',
      });

      assert.equal(report.totalPrompts, 2);
      assert.equal(report.failedRequests, 0);
      assert.equal(report.firstAttemptCompilationRate, 100);
      assert.equal(report.finalCompilationRate, 100);
      assert.equal(report.renderSuccessRate, 100);
      assert.equal(report.promptsRequiringRepair, 0);
      assert.equal(report.repairSuccessRate, 100); // 0 needed, so 100%
      assert.equal(report.requestsPerGeneration, 1.0);
      assert.equal(report.latency.avgMs, 20);
      assert.equal(report.failureDetails.length, 0);
    });

    it('computes repair and failure metrics accurately', () => {
      const records: PromptEvaluationRecord[] = [
        // 1: Direct success
        {
          promptId: 'p-1',
          category: 'simple-ui',
          promptText: 'A',
          expectedBehavior: 'success',
          success: true,
          attemptsMade: 1,
          totalRequests: 1,
          latencyMs: 10,
          firstAttemptCompiled: true,
          finalCompiled: true,
          rendered: true,
        },
        // 2: Repaired success (attempt 2)
        {
          promptId: 'p-2',
          category: 'edge-cases',
          promptText: 'B',
          expectedBehavior: 'success',
          success: true,
          attemptsMade: 2,
          totalRequests: 2,
          latencyMs: 30,
          firstAttemptCompiled: false,
          finalCompiled: true,
          rendered: true,
        },
        // 3: Exhausted repairs failure
        {
          promptId: 'p-3',
          category: 'edge-cases',
          promptText: 'C',
          expectedBehavior: 'failure',
          success: false,
          attemptsMade: 3,
          totalRequests: 3,
          latencyMs: 40,
          firstAttemptCompiled: false,
          finalCompiled: false,
          rendered: false,
          error: 'Repair limit reached',
        },
        // 4: Render exception (compiled but threw during evaluation)
        {
          promptId: 'p-4',
          category: 'complex-layout',
          promptText: 'D',
          expectedBehavior: 'success',
          success: true,
          attemptsMade: 1,
          totalRequests: 1,
          latencyMs: 20,
          firstAttemptCompiled: true,
          finalCompiled: true,
          rendered: false,
          renderError: 'Runtime exception: items is not defined',
        },
      ];

      const report = calculateMetrics({
        records,
        mode: 'deterministic',
        model: 'gemini-3.5-flash-lite',
      });

      assert.equal(report.totalPrompts, 4);
      assert.equal(report.failedRequests, 1); // p-3
      assert.equal(report.firstAttemptCompilationSuccesses, 2); // p-1, p-4
      assert.equal(report.firstAttemptCompilationRate, 50); // 2/4
      assert.equal(report.finalCompilationSuccesses, 3); // p-1, p-2, p-4
      assert.equal(report.finalCompilationRate, 75); // 3/4

      // Repairs: p-2 and p-3 attempted repair
      assert.equal(report.promptsRequiringRepair, 2);
      assert.equal(report.successfulRepairs, 1); // p-2
      assert.equal(report.failedRepairs, 1); // p-3
      assert.equal(report.repairSuccessRate, 50); // 1/2

      // Renders: p-1, p-2 succeeded. p-3 failed generation, p-4 failed render.
      assert.equal(report.renderSuccesses, 2);
      assert.equal(report.renderSuccessRate, 50); // 2/4

      // Requests per generation: (1 + 2 + 3 + 1) / 4 = 7 / 4 = 1.75
      assert.equal(report.totalModelRequests, 7);
      assert.equal(report.requestsPerGeneration, 1.75);

      // Failures tracked: p-3 (generation), p-4 (render)
      assert.equal(report.failureDetails.length, 2);
      assert.equal(report.failureDetails[0].promptId, 'p-3');
      assert.equal(report.failureDetails[1].promptId, 'p-4');
    });

    it('safely handles empty record arrays without division by zero', () => {
      const report = calculateMetrics({
        records: [],
        mode: 'deterministic',
        model: 'gemini-3.5-flash-lite',
      });

      assert.equal(report.totalPrompts, 0);
      assert.equal(report.firstAttemptCompilationRate, 0);
      assert.equal(report.finalCompilationRate, 0);
      assert.equal(report.renderSuccessRate, 0);
      assert.equal(report.repairSuccessRate, 100);
      assert.equal(report.requestsPerGeneration, 0);
      assert.equal(report.latency.avgMs, 0);
    });

    it('formats human-readable summary without errors', () => {
      const report = calculateMetrics({
        records: [
          {
            promptId: 'simple-badge',
            category: 'simple-ui',
            promptText: 'Badge',
            expectedBehavior: 'success',
            success: true,
            attemptsMade: 1,
            totalRequests: 1,
            latencyMs: 12,
            firstAttemptCompiled: true,
            finalCompiled: true,
            rendered: true,
          },
        ],
        mode: 'deterministic',
        model: 'gemini-3.5-flash-lite',
      });

      const text = formatSummaryReport(report);
      assert.ok(text.includes('AI COMPONENT BUILDER'));
      assert.ok(text.includes('1. COMPILATION METRICS'));
      assert.ok(text.includes('First-Attempt Compilation Rate:  100.0%'));
      assert.ok(text.includes('simple-ui'));
    });
  });

  describe('verifyJsxRender (Headless React Runtime)', () => {
    it('successfully evaluates valid static and expression-based JSX', () => {
      const code = '<div className="p-4"><h1 className="text-xl">Title</h1><p>{1 + 1} items</p></div>';
      const result = verifyJsxRender(code);
      assert.equal(result.rendered, true);
      assert.equal(result.error, undefined);
      assert.equal(result.element?.type, 'div');
    });

    it('successfully evaluates JSX that uses standard React hooks', () => {
      const code = `<div className="p-4"><button onClick={() => {}}>State Component</button></div>`;
      const result = verifyJsxRender(code);
      assert.equal(result.rendered, true);
    });

    it('detects runtime ReferenceErrors for undefined variables', () => {
      const code = '<div className="p-4">{undeclaredVariable.map((x: any) => x)}</div>';
      const result = verifyJsxRender(code);
      assert.equal(result.rendered, false);
      assert.ok(result.error?.includes('undeclaredVariable is not defined'));
    });

    it('detects compilation failure before attempting evaluation', () => {
      const code = '<div><span>Missing closing tag</div>';
      const result = verifyJsxRender(code);
      assert.equal(result.rendered, false);
      assert.ok(result.error?.includes('Transpilation failed'));
    });

    it('rejects empty string or non-JSX strings', () => {
      assert.equal(verifyJsxRender('').rendered, false);
      assert.equal(verifyJsxRender('just text without tags').rendered, false);
    });
  });

  describe('Deterministic Benchmark Runner', () => {
    it('evaluates entire benchmark dataset deterministically without network calls', async () => {
      const report = await runBenchmark({
        mode: 'deterministic',
      });

      assert.equal(report.totalPrompts, BENCHMARK_DATASET.length);
      assert.equal(report.completedEvaluations, BENCHMARK_DATASET.length);
      assert.equal(report.mode, 'deterministic');
      assert.ok(report.firstAttemptCompilationRate > 80);
      assert.ok(report.finalCompilationRate >= report.firstAttemptCompilationRate);
      assert.ok(report.renderSuccessRate > 80);
      assert.ok(report.totalModelRequests >= report.totalPrompts);

      // Verify prompt 37 (empty prompt) failed as expected
      const emptyFailure = report.failureDetails.find((f) => f.promptId === 'edge-empty-prompt');
      assert.ok(emptyFailure);

      // Verify prompt 39 (syntax repair recovery) repaired successfully
      const repairedCount = report.successfulRepairs;
      assert.ok(repairedCount >= 1);
    });

    it('rejects live benchmark mode when API key is missing', async () => {
      await assert.rejects(
        async () => {
          await runBenchmark({
            mode: 'live',
            apiKey: '',
          });
        },
        (err: any) => {
          assert.ok(err.message.includes('requires GEMINI_API_KEY'));
          return true;
        }
      );
    });
  });
});
