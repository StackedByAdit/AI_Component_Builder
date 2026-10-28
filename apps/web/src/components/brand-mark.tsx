// purpose: shared ForgeAI mark and wordmark for the public site and the workspace

import { AppLink } from './app-link';

export const BrandMark = ({ className = 'h-8 w-8' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="6" fill="#1c1917" />
    <path fill="#f6f3ee" d="M5 8h22v3.5H5z" />
    <path fill="#f6f3ee" d="M11 11.5h10v8H11z" />
    <path fill="#c2410c" d="M8 19.5h16v3.5H8z" />
  </svg>
);

interface WordmarkProps {
  tone?: 'ink' | 'light';
  compact?: boolean;
}

export const Wordmark = ({ tone = 'ink', compact = false }: WordmarkProps) => (
  <AppLink
    href="/"
    className={`inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current ${
      tone === 'light' ? 'text-white' : 'text-forge-ink'
    }`}
  >
    <BrandMark className={compact ? 'h-7 w-7' : 'h-8 w-8'} />
    <span className={`font-serif tracking-tight ${compact ? 'text-[1.05rem]' : 'text-lg'} font-medium`}>
      ForgeAI
    </span>
  </AppLink>
);