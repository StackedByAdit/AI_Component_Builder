# ForgeAI

ForgeAI is an AI-powered React component builder. Describe a UI in plain language, generate React code with Gemini, preview it in a sandboxed browser view, and save components to your account.

The app includes real-time sandboxed preview, TypeScript AST validation, bounded self-repair, and a per-user component library. Package names and API routes are unchanged from the original repository layout.

---

## System Architecture

The project is structured as a pnpm monorepo managed with Turborepo:

```text
├── apps/
│   ├── api/          # Backend API (Hono, Prisma, SQLite, Gemini SDK, Benchmark)
│   └── web/          # Frontend Web App (React 19, Vite, Tailwind CSS, Prism)
└── packages/
    └── types/        # Shared TypeScript interfaces, contracts, and discriminated unions
```

### Application Flow
1. **Authentication**: Users register or sign in via `POST /auth/signup` and `POST /auth/signin`. Registration validates password requirements (minimum 8 characters, password confirmation match, and valid email format). Passwords are securely hashed with bcrypt (10 salt rounds). Sessions use verified JWT tokens with automatic session verification on initialization via `GET /auth/me`, clean session invalidation via `POST /auth/signout`, and brute-force protection with rate limiting (max 5 failed attempts per 5 minutes).
2. **Generation**: Authenticated users submit UI descriptions to `POST /generate`. The backend prompts Gemini with structured JSON output requirements (`{ jsx: string }`).
3. **Validation & Bounded Repair**: Generated code is parsed and validated using the TypeScript compiler AST (`validateJsx`). If syntax errors are found, the error details and faulty code are fed back into Gemini for automatic correction (bounded at at most 2 repair attempts).
4. **Sandboxed Preview**: The validated component is rendered inside an isolated browser iframe (`sandbox="allow-scripts"` without `allow-same-origin`) protected by a strict Content Security Policy.
5. **Component Library**: Users can save components (`POST /components`), browse their library (`GET /components`), reopen any component in the preview and code editor, or delete components (`DELETE /components/:id`).

---

## Prerequisites

- **Node.js**: v20 or newer
- **pnpm**: v9 or newer

---

## Local Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables

**Backend (`apps/api/.env`)**:
```env
PORT=3001
JWT_SECRET=your_development_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL="file:./dev.db"
CORS_ORIGIN=http://localhost:5173
```
*(Multiple Gemini keys can be provided for rate-limit rotation via comma-separated `GEMINI_API_KEYS`)*.

**Frontend (`apps/web/.env`)**:
```env
VITE_API_URL=http://localhost:3001
```

### 3. Initialize SQLite Database
```bash
cd apps/api
pnpm exec prisma db push
cd ../..
```

### 4. Run Development Servers
```bash
pnpm dev
```
- Frontend: `http://localhost:5173` — public landing page. Sign-in is `/login`, sign-up is `/signup`, and the component workspace is `/workspace`.
- Backend API: `http://localhost:3001`

---

## Running Tests & Type Checks

All automated tests use Node's native test runner (`node:test` via `tsx`) and Turborepo orchestration:

```bash
# Run full monorepo test suite (122 tests across web and api)
pnpm test

# Run linter across all workspaces
pnpm lint

# Build all packages
pnpm build
```

---

## AI Generation Evaluation Benchmark

The repository includes a curated benchmark dataset of 40 representative prompts across 8 categories (`simple-ui`, `complex-layout`, `responsive`, `interactive-state`, `forms-validation`, `phrasing-variations`, `ambiguous-incomplete`, `edge-cases`).

### Deterministic Evaluation (No API Key Required)
Runs without external network calls using deterministic mock sequences:
```bash
pnpm benchmark
```

### Live Evaluation (Requires Gemini API Key)
Runs against live Gemini models:
```bash
pnpm benchmark:live
```

### Measured Metrics
- **First-Attempt Compilation Rate**: Percentage of components compiling on attempt 1.
- **Final Compilation Rate**: Percentage of components compiling after bounded self-repair.
- **Render Success Rate**: Verified via headless React runtime instantiation catching runtime `ReferenceError`s and invalid hook usages.
- **Repair Success Rate**: Recovery rate of initially failing prompts within 2 repairs.
- **Latency & Efficiency**: Median (p50), 95th percentile (p95), and average API requests per generation.

---

## Preview Security Boundary & Known Limitations

### Security Protections
- **Execution Isolation**: The preview runs in an `<iframe>` with `sandbox="allow-scripts"` and strictly **omits** `allow-same-origin`. This forces an opaque `null` origin, preventing generated scripts from accessing `window.parent.document`, parent cookies, or auth tokens in `localStorage`.
- **Content Security Policy (CSP)**:
  - `connect-src 'none'`: Blocks outbound `fetch`, `XMLHttpRequest`, and `WebSocket` calls.
  - `frame-src 'none'`, `object-src 'none'`: Blocks nested framing and plugins.
  - `base-uri 'none'`, `form-action 'none'`: Prevents base tag hijacking and form submissions.
- **Script Breakout Prevention**: JSX input is JSON-serialized and escapes all `</script` sequences as `<\/script`, preventing parser breakout attacks.
- **Safe DOM Error Display**: Errors are inserted via `textContent` rather than `innerHTML`, eliminating DOM-based XSS in error banners.
- **Credential Scrubbing**: API keys and Authorization Bearer headers are redacted from error traces.

### Known Browser Limitations
- **Thread Preemption**: JavaScript running on the main UI thread cannot be preempted with a CPU quota by the parent window. A synchronous infinite loop (e.g., `while(true) {}`) will lock that tab's UI thread until the user navigates away or the iframe is destroyed.
- **CSP Scope**: CSP provides defense-in-depth resource restriction, but execution context isolation relies on the browser's iframe sandbox implementation.
