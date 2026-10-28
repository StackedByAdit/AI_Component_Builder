// purpose: history-based routes for the public site, auth screens, and workspace

export type AppRoute = 'home' | 'login' | 'signup' | 'workspace';

export function pathToRoute(pathname: string): AppRoute {
  switch (pathname) {
    case '/login':
      return 'login';
    case '/signup':
      return 'signup';
    case '/workspace':
      return 'workspace';
    default:
      return 'home';
  }
}

export const ROUTE_TITLES: Record<AppRoute, string> = {
  home: 'ForgeAI — Turn Ideas into React Components',
  login: 'Log in — ForgeAI',
  signup: 'Create account — ForgeAI',
  workspace: 'Workspace — ForgeAI',
};

export function navigate(path: string) {
  if (typeof window === 'undefined') return;
  const next = new URL(path, window.location.href);
  const current = window.location.pathname + window.location.search + window.location.hash;
  const target = next.pathname + next.search + next.hash;
  if (current === target) return;
  window.history.pushState(null, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
