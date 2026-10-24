// apps/web/src/lib/api.ts
// purpose: centralized API base URL configured via environment variable with local fallback

const getEnvVar = (key: string): string | undefined => {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string> };
    if (meta.env && typeof meta.env[key] === 'string') {
      return meta.env[key];
    }
  } catch {
    void 0;
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key];
      if (typeof val === 'string') return val;
    }
  } catch {
    void 0;
  }

  return undefined;
};

export const API_BASE_URL =
  getEnvVar('VITE_API_URL')?.replace(/\/+$/, '') || 'http://localhost:3001';
