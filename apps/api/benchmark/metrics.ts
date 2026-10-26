// apps/api/benchmark/metrics.ts
// purpose: precise evaluation metric calculations and human-readable reporting

import type { PromptCategory } from './dataset.js';

export interface PromptEvaluationRecord {
  promptId: string;
  category: PromptCategory;
  promptText: string;
  expectedBehavior: 'success' | 'failure';
  // Generation results
  success: boolean;
  code?: string;
  attemptsMade: number;
  totalRequests: number;
  latencyMs: number;
  error?: string;
  // Step-by-step validations
  firstAttemptCompiled: boolean;
  finalCompiled: boolean;
  rendered: boolean;
  renderError?: string;
}

export interface LatencyStats {
  totalMs: number;
  avgMs: number;
  medianMs: number;
  p95Ms: number;
  minMs: number;
  maxMs: number;
}

export interface CategoryMetrics {
  total: number;
  successful: number;
  failed: number;
  firstAttemptCompiled: number;
  finalCompiled: number;
  rendered: number;
  repairedCount: number;
  avgLatencyMs: number;
}

export interface EvaluationReport {
  timestamp: string;
  mode: 'deterministic' | 'live';
  model: string;
  configuration: {
    maxRepairs: number;
    timeoutMs: number;
  };
  totalPrompts: number;
  completedEvaluations: number;
  failedRequests: number;

  // Compilation metrics
  firstAttemptCompilationSuccesses: number;
  firstAttemptCompilationRate: number; // percentage 0-100
  finalCompilationSuccesses: number;
  finalCompilationRate: number; // percentage 0-100

  // Repair metrics
  promptsRequiringRepair: number;
  successfulRepairs: number;
  failedRepairs: number;
  repairSuccessRate: number; // percentage 0-100

  // Render metrics
  renderSuccesses: number;
  renderFailures: number;
  renderSuccessRate: number; // percentage 0-100

  // Latency & Efficiency
  latency: LatencyStats;
  totalModelRequests: number;
  requestsPerGeneration: number;

  // Breakdowns
  byCategory: Record<PromptCategory, CategoryMetrics>;
  failureDetails: Array<{
    promptId: string;
    category: PromptCategory;
    promptText: string;
    stage: 'generation' | 'compilation' | 'render';
    error: string;
  }>;
}

export const calculatePercentile = (sortedValues: number[], percentile: number): number => {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const fraction = index - lower;
  return sortedValues[lower] + fraction * (sortedValues[upper] - sortedValues[lower]);
};

export const calculateMetrics = ({
  records,
  mode,
  model,
  maxRepairs = 2,
  timeoutMs = 30000,
}: {
  records: PromptEvaluationRecord[];
  mode: 'deterministic' | 'live';
  model: string;
  maxRepairs?: number;
  timeoutMs?: number;
}): EvaluationReport => {
  const totalPrompts = records.length;
  const completedEvaluations = records.length;
  const failedRequests = records.filter((r) => !r.success).length;

  const firstAttemptCompilationSuccesses = records.filter((r) => r.firstAttemptCompiled).length;
  const firstAttemptCompilationRate = totalPrompts > 0 ? (firstAttemptCompilationSuccesses / totalPrompts) * 100 : 0;

  const finalCompilationSuccesses = records.filter((r) => r.finalCompiled).length;
  const finalCompilationRate = totalPrompts > 0 ? (finalCompilationSuccesses / totalPrompts) * 100 : 0;

  // Prompts that needed repair: generation was attempted, but attempt 1 did not compile
  const promptsRequiringRepair = records.filter(
    (r) => !r.firstAttemptCompiled && r.attemptsMade > 1
  ).length;

  const successfulRepairs = records.filter(
    (r) => !r.firstAttemptCompiled && r.finalCompiled && r.attemptsMade > 1
  ).length;

  const failedRepairs = records.filter(
    (r) => !r.firstAttemptCompiled && !r.finalCompiled && r.attemptsMade > 1
  ).length;

  const repairSuccessRate =
    promptsRequiringRepair > 0 ? (successfulRepairs / promptsRequiringRepair) * 100 : 100;

  const renderSuccesses = records.filter((r) => r.rendered).length;
  const renderFailures = records.filter((r) => r.finalCompiled && !r.rendered).length;
  const renderSuccessRate = totalPrompts > 0 ? (renderSuccesses / totalPrompts) * 100 : 0;

  // Latencies
  const latencies = records.map((r) => r.latencyMs).sort((a, b) => a - b);
  const totalLatencyMs = latencies.reduce((acc, curr) => acc + curr, 0);
  const avgLatencyMs = totalPrompts > 0 ? totalLatencyMs / totalPrompts : 0;
  const minLatencyMs = latencies.length > 0 ? latencies[0] : 0;
  const maxLatencyMs = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
  const medianLatencyMs = calculatePercentile(latencies, 50);
  const p95LatencyMs = calculatePercentile(latencies, 95);

  const totalModelRequests = records.reduce((acc, r) => acc + r.totalRequests, 0);
  const requestsPerGeneration = totalPrompts > 0 ? totalModelRequests / totalPrompts : 0;

  // Group by category
  const categories: PromptCategory[] = [
    'simple-ui',
    'complex-layout',
    'responsive',
    'interactive-state',
    'forms-validation',
    'phrasing-variations',
    'ambiguous-incomplete',
    'edge-cases',
  ];

  const byCategory: Record<PromptCategory, CategoryMetrics> = {} as any;

  for (const cat of categories) {
    const catRecords = records.filter((r) => r.category === cat);
    const catTotal = catRecords.length;
    const catLatency = catRecords.reduce((sum, r) => sum + r.latencyMs, 0);

    byCategory[cat] = {
      total: catTotal,
      successful: catRecords.filter((r) => r.success).length,
      failed: catRecords.filter((r) => !r.success).length,
      firstAttemptCompiled: catRecords.filter((r) => r.firstAttemptCompiled).length,
      finalCompiled: catRecords.filter((r) => r.finalCompiled).length,
      rendered: catRecords.filter((r) => r.rendered).length,
      repairedCount: catRecords.filter((r) => !r.firstAttemptCompiled && r.finalCompiled).length,
      avgLatencyMs: catTotal > 0 ? catLatency / catTotal : 0,
    };
  }

  // Detailed failures
  const failureDetails: EvaluationReport['failureDetails'] = [];

  for (const r of records) {
    if (!r.success) {
      failureDetails.push({
        promptId: r.promptId,
        category: r.category,
        promptText: r.promptText,
        stage: 'generation',
        error: r.error || 'Generation failed',
      });
    } else if (!r.finalCompiled) {
      failureDetails.push({
        promptId: r.promptId,
        category: r.category,
        promptText: r.promptText,
        stage: 'compilation',
        error: r.error || 'Compilation failed',
      });
    } else if (!r.rendered) {
      failureDetails.push({
        promptId: r.promptId,
        category: r.category,
        promptText: r.promptText,
        stage: 'render',
        error: r.renderError || 'Render failed',
      });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    mode,
    model,
    configuration: {
      maxRepairs,
      timeoutMs,
    },
    totalPrompts,
    completedEvaluations,
    failedRequests,
    firstAttemptCompilationSuccesses,
    firstAttemptCompilationRate,
    finalCompilationSuccesses,
    finalCompilationRate,
    promptsRequiringRepair,
    successfulRepairs,
    failedRepairs,
    repairSuccessRate,
    renderSuccesses,
    renderFailures,
    renderSuccessRate,
    latency: {
      totalMs: totalLatencyMs,
      avgMs: avgLatencyMs,
      medianMs: medianLatencyMs,
      p95Ms: p95LatencyMs,
      minMs: minLatencyMs,
      maxMs: maxLatencyMs,
    },
    totalModelRequests,
    requestsPerGeneration,
    byCategory,
    failureDetails,
  };
};

export const formatSummaryReport = (report: EvaluationReport): string => {
  const lines: string[] = [
    '================================================================================',
    'AI COMPONENT BUILDER — GENERATION PIPELINE EVALUATION BENCHMARK',
    '================================================================================',
    `Timestamp:        ${report.timestamp}`,
    `Evaluation Mode:  ${report.mode.toUpperCase()} (${report.mode === 'live' ? 'Live Gemini API calls' : 'Mocked Responses'})`,
    `Model Evaluated:  ${report.model}`,
    `Total Prompts:    ${report.totalPrompts}`,
    `Completed Runs:   ${report.completedEvaluations}`,
    `Failed Runs:      ${report.failedRequests}`,
    '--------------------------------------------------------------------------------',
    '1. COMPILATION METRICS',
    '--------------------------------------------------------------------------------',
    `• First-Attempt Compilation Rate:  ${report.firstAttemptCompilationRate.toFixed(1)}% (${report.firstAttemptCompilationSuccesses}/${report.totalPrompts})`,
    `• Final Compilation Rate:          ${report.finalCompilationRate.toFixed(1)}% (${report.finalCompilationSuccesses}/${report.totalPrompts})`,
    `• Definition: Validated using TypeScript transpile AST diagnostics.`,
    '--------------------------------------------------------------------------------',
    '2. AUTOMATIC REPAIR METRICS',
    '--------------------------------------------------------------------------------',
    `• Prompts Requiring Repair:        ${report.promptsRequiringRepair}`,
    `• Successfully Repaired:           ${report.successfulRepairs}`,
    `• Exhausted Repairs (Failed):      ${report.failedRepairs}`,
    `• Repair Success Rate:             ${report.repairSuccessRate.toFixed(1)}%`,
    `• Definition: Self-correction recovery within bounded attempt limit (${report.configuration.maxRepairs} repairs).`,
    '--------------------------------------------------------------------------------',
    '3. RUNTIME RENDER METRICS (HEADLESS REACT EVALUATION)',
    '--------------------------------------------------------------------------------',
    `• Render Success Rate:             ${report.renderSuccessRate.toFixed(1)}% (${report.renderSuccesses}/${report.totalPrompts})`,
    `• Runtime Exceptions During Eval:  ${report.renderFailures}`,
    `• Definition: Verifies that transpiled JSX instantiates and executes without`,
    `  runtime ReferenceErrors or hook violations.`,
    `• Scope Limitation: Tests headless JS component instantiation; visual CSS`,
    `  Tailwind rendering and browser iframe layout are not measured in Node.`,
    '--------------------------------------------------------------------------------',
    '4. LATENCY & EFFICIENCY METRICS',
    '--------------------------------------------------------------------------------',
    `• Average Latency:                 ${report.latency.avgMs.toFixed(1)} ms`,
    `• Median Latency (p50):            ${report.latency.medianMs.toFixed(1)} ms`,
    `• 95th Percentile Latency (p95):   ${report.latency.p95Ms.toFixed(1)} ms`,
    `• Min / Max Latency:               ${report.latency.minMs.toFixed(1)} ms / ${report.latency.maxMs.toFixed(1)} ms`,
    `• Total Model Requests:            ${report.totalModelRequests}`,
    `• Average Requests / Generation:   ${report.requestsPerGeneration.toFixed(2)}`,
    '--------------------------------------------------------------------------------',
    '5. BREAKDOWN BY CATEGORY',
    '--------------------------------------------------------------------------------',
    'Category               Total   Compiled   Rendered   Repaired   Avg Latency',
    '--------------------------------------------------------------------------------',
  ];

  for (const [cat, data] of Object.entries(report.byCategory)) {
    const pad = (str: string, len: number) => str.padEnd(len);
    const catName = pad(cat, 22);
    const total = pad(String(data.total), 8);
    const comp = pad(`${data.finalCompiled}/${data.total}`, 11);
    const rend = pad(`${data.rendered}/${data.total}`, 11);
    const rep = pad(String(data.repairedCount), 11);
    const lat = `${data.avgLatencyMs.toFixed(1)} ms`;
    lines.push(`${catName} ${total}${comp}${rend}${rep}${lat}`);
  }

  lines.push('--------------------------------------------------------------------------------');

  if (report.failureDetails.length > 0) {
    lines.push('6. FAILURES & ANOMALIES RECORDED:');
    for (const f of report.failureDetails) {
      lines.push(`• [${f.stage.toUpperCase()}] ${f.promptId} ("${f.promptText.slice(0, 45)}..."):`);
      lines.push(`  Error: ${f.error}`);
    }
  } else {
    lines.push('6. FAILURES & ANOMALIES RECORDED: None');
  }

  lines.push('================================================================================');
  return lines.join('\n');
};
