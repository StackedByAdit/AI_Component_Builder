// apps/api/benchmark/run.ts
// purpose: CLI entry point for running the component generation benchmark

try {
  process.loadEnvFile?.();
} catch {}

import fs from 'node:fs';
import path from 'node:path';
import { runBenchmark } from './runner.js';
import { formatSummaryReport } from './metrics.js';

const main = async () => {
  const args = process.argv.slice(2);
  const isLive = args.includes('--live');
  const isJsonOnly = args.includes('--json');
  const outIndex = args.indexOf('--out');
  const outPath = outIndex !== -1 && args[outIndex + 1] ? args[outIndex + 1] : null;

  const mode = isLive ? 'live' : 'deterministic';

  if (isLive && !process.env.GEMINI_API_KEY) {
    console.error(
      '\n[BENCHMARK NOTICE] Live evaluation was requested with --live, but GEMINI_API_KEY is not configured.\n' +
      'Please ensure GEMINI_API_KEY is set in your environment or in apps/api/.env.\n' +
      'To run the reproducible deterministic benchmark without credentials, run without the --live flag:\n' +
      '  pnpm --filter api benchmark\n'
    );
    process.exit(1);
  }

  if (!isJsonOnly) {
    console.log(`\nStarting AI Component Builder Benchmark in [${mode.toUpperCase()}] mode...`);
    console.log(`Total prompts to evaluate: 40\n`);
  }

  const report = await runBenchmark({
    mode,
    onProgress: (current, total, item, record) => {
      if (!isJsonOnly) {
        const statusIcon = record.rendered
          ? '✓ [RENDERED]'
          : record.finalCompiled
          ? '• [COMPILED]'
          : '✗ [FAILED]';
        const repairTag = record.attemptsMade > 1 && record.finalCompiled ? ' (Repaired)' : '';
        console.log(
          `[${String(current).padStart(2)}/${total}] ${statusIcon} ${item.id.padEnd(32)} (${record.latencyMs}ms)${repairTag}`
        );
      }
    },
  });

  const formattedSummary = formatSummaryReport(report);

  if (outPath) {
    const resolvedPath = path.resolve(process.cwd(), outPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, JSON.stringify(report, null, 2), 'utf-8');
    if (!isJsonOnly) {
      console.log(`\nMachine-readable benchmark report saved to: ${resolvedPath}`);
    }
  }

  if (isJsonOnly) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('\n' + formattedSummary + '\n');
  }
};

main().catch((err) => {
  console.error('\nBenchmark execution failed:', err);
  process.exit(1);
});
