// purpose: public ForgeAI landing page

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth';
import { AppLink } from '../app-link';
import { Wordmark } from '../brand-mark';
import { HeroPreview, WorkflowExample } from './product-preview';

const NAV_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
] as const;

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-ink';

const primaryLink = `inline-flex items-center justify-center bg-forge-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black ${focusRing}`;

const secondaryLink = `inline-flex items-center justify-center border border-forge-line bg-transparent px-4 py-2 text-sm font-medium text-forge-ink transition-colors hover:bg-forge-paper ${focusRing}`;

const PRODUCT_POINTS = [
  {
    title: 'Build interfaces from ideas',
    body: 'Describe the component the way you would explain it to another developer. Start from that description instead of an empty file.',
  },
  {
    title: 'See the result before you use it',
    body: 'ForgeAI renders the generated component in a sandboxed browser preview so you can look at the layout before copying it. The preview is a check, not a promise that every result is correct.',
  },
  {
    title: 'Keep the code',
    body: 'Open the generated JSX, copy it, and save the component. Saved items store the prompt and the code on your account, and you can reopen or delete them later.',
  },
  {
    title: 'Stay in your flow',
    body: 'Use it to prototype a screen or to get a first pass at a familiar UI pattern. You still decide what is correct and what ships.',
  },
] as const;

const STEPS = [
  {
    n: '1',
    title: 'Describe',
    body: 'Write the interface you want. For example: “Create a pricing card with three plans, a highlighted recommended plan, and a monthly/yearly toggle.”',
  },
  {
    n: '2',
    title: 'Generate and preview',
    body: 'ForgeAI sends the description to Gemini, checks the JSX, and renders a preview in the workspace. If validation fails, it tries up to two repairs. Review the result — it can still be wrong.',
  },
  {
    n: '3',
    title: 'Inspect and save',
    body: 'Read the code, copy it, or generate again from a clearer description. Save the component to your library when you want to keep it. There is no visual editor and no deploy step.',
  },
] as const;

const FEATURES = [
  {
    title: 'Natural-language generation',
    body: 'Describe the UI in plain language. ForgeAI uses Google’s Gemini API to return React component code.',
  },
  {
    title: 'Live component preview',
    body: 'The workspace renders the component in an isolated preview so you can inspect the visual result before using the code.',
  },
  {
    title: 'Code inspection',
    body: 'Switch to the code view for syntax-highlighted JSX and copy it. The implementation is visible, not hidden behind the preview.',
  },
  {
    title: 'Component library',
    body: 'Save a result, then reopen or delete it later. Each saved component keeps the prompt alongside the code.',
  },
  {
    title: 'Personal workspace',
    body: 'Generation and the library require a signed-in session. The library loads only the components saved to your account.',
  },
  {
    title: 'Validation and repair',
    body: 'Generated JSX is checked with the TypeScript compiler. Syntax problems can trigger up to two repair attempts. That reduces broken output; it does not guarantee a correct component.',
  },
] as const;

const AUDIENCE = [
  {
    title: 'Frontend developers',
    body: 'Prototype a component before you commit to the structure and styling.',
  },
  {
    title: 'Full-stack developers',
    body: 'Start an interface while the rest of the application is still in progress.',
  },
  {
    title: 'Indie hackers',
    body: 'Turn a product idea into a component you can look at the same day.',
  },
  {
    title: 'Founders',
    body: 'Check whether a screen concept holds together before spending a day implementing it.',
  },
] as const;

export const LandingPage = () => {
  const { auth } = useAuth();
  const signedIn = auth.status === 'authenticated';
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryHref = signedIn ? '/workspace' : '/signup';
  const primaryLabel = signedIn ? 'Open workspace' : 'Get started';
  const heroLabel = signedIn ? 'Open workspace' : 'Start building';

  useEffect(() => {
    document.documentElement.classList.add('landing-active');
    return () => document.documentElement.classList.remove('landing-active');
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-page min-h-screen bg-forge-bg text-forge-ink">
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-forge-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white ${focusRing}`}
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-forge-line bg-forge-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Wordmark />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Page">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm text-forge-muted transition-colors hover:text-forge-ink ${focusRing}`}
              >
                {link.label}
              </a>
            ))}
            {signedIn ? (
              <AppLink href="/workspace" className={primaryLink}>
                Open workspace
              </AppLink>
            ) : (
              <>
                <AppLink href="/login" className={`text-sm text-forge-ink ${focusRing}`}>
                  Log in
                </AppLink>
                <AppLink href="/signup" className={primaryLink}>
                  Get started
                </AppLink>
              </>
            )}
          </nav>
          <button
            type="button"
            className={`inline-flex items-center justify-center border border-forge-line px-3 py-2 text-sm md:hidden ${focusRing}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-nav" className="border-t border-forge-line px-5 py-3 md:hidden" aria-label="Page">
            <div className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`py-2.5 text-sm text-forge-ink ${focusRing}`}
                >
                  {link.label}
                </a>
              ))}
              {signedIn ? (
                <AppLink href="/workspace" onNavigate={closeMenu} className={`${primaryLink} mt-3`}>
                  Open workspace
                </AppLink>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  <AppLink href="/login" onNavigate={closeMenu} className={secondaryLink}>
                    Log in
                  </AppLink>
                  <AppLink href="/signup" onNavigate={closeMenu} className={primaryLink}>
                    Get started
                  </AppLink>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>

      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16 lg:py-24">
          <div>
            <p className="text-sm font-medium text-forge-muted">AI-assisted React components</p>
            <h1 className="mt-3 max-w-[16ch] font-serif text-4xl leading-[1.12] font-medium tracking-tight sm:text-5xl">
              Turn your ideas into React components.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-forge-muted sm:text-lg">
              Describe a UI in ordinary language. ForgeAI generates React code, previews it in the browser, and lets you inspect and save the result.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AppLink href={primaryHref} className={`${primaryLink} px-5 py-2.5`}>
                {heroLabel}
              </AppLink>
              <a href="#how-it-works" className={`${secondaryLink} px-5 py-2.5`}>
                Explore how it works
              </a>
            </div>
          </div>
          <HeroPreview />
        </section>

        <section id="product" className="border-t border-forge-line">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">What ForgeAI does</h2>
              <p className="mt-4 text-base leading-relaxed text-forge-muted">
                ForgeAI is a workspace for generating React UI components. It is not a chatbot, a website builder, or a substitute for reviewing the code yourself.
              </p>
            </div>
            <div className="mt-12 grid gap-10 sm:grid-cols-2">
              {PRODUCT_POINTS.map((point) => (
                <div key={point.title} className="border-t border-forge-line pt-5">
                  <h3 className="font-serif text-xl font-medium">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-forge-muted">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-forge-line">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-forge-muted">
              Three steps, from a description to a component you can preview and keep.
            </p>
            <div className="relative mt-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-4 right-[8%] left-[8%] hidden h-px bg-forge-line md:block"
              />
              <ol className="grid gap-10 md:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.n} className="relative">
                  <span className="relative z-10 inline-flex h-8 w-8 items-center justify-center border border-forge-line bg-forge-bg text-sm font-medium">
                    {step.n}
                  </span>
                  <h3 className="mt-4 font-serif text-xl font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-forge-muted">{step.body}</p>
                </li>
              ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-forge-line">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">What you can do in the workspace</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-forge-muted">
              These are the capabilities in the current application.
            </p>
            <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title}>
                  <h3 className="text-base font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-forge-muted">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-forge-line" aria-labelledby="workflow-heading">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 id="workflow-heading" className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              From a prompt to a component
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-forge-muted">
              A description goes in. You get a preview to look at and JSX to read. This example is a static illustration of that path, using the same kind of prompt the workspace accepts.
            </p>
            <div className="mt-10">
              <WorkflowExample />
            </div>
          </div>
        </section>

        <section className="border-t border-forge-line" aria-labelledby="audience-heading">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 id="audience-heading" className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              Who it is for
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-forge-muted">
              ForgeAI fits people who already write software and want a faster first version of a React interface.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {AUDIENCE.map((item) => (
                <div key={item.title} className="border-t border-forge-line pt-4">
                  <h3 className="text-base font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-forge-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-forge-line">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <h2 className="max-w-[18ch] font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              Your next component starts with an idea.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-forge-muted">
              {signedIn
                ? 'You are signed in. Open the workspace and describe the interface you want to build.'
                : 'Begin by describing the interface you want to build. If you already have an account, log in.'}
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <AppLink href={primaryHref} className={`${primaryLink} px-5 py-2.5`}>
                {primaryLabel}
              </AppLink>
              {!signedIn && (
                <AppLink href="/login" className={`text-sm text-forge-ink underline underline-offset-4 ${focusRing}`}>
                  Log in
                </AppLink>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-forge-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-3 text-sm leading-relaxed text-forge-muted">
              AI-assisted React component generation. Describe a UI, preview it, and keep the code.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-6 text-sm">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className={`text-forge-muted hover:text-forge-ink ${focusRing}`}>
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {signedIn ? (
                <AppLink href="/workspace" className={`text-forge-muted hover:text-forge-ink ${focusRing}`}>
                  Open workspace
                </AppLink>
              ) : (
                <>
                  <AppLink href="/login" className={`text-forge-muted hover:text-forge-ink ${focusRing}`}>
                    Log in
                  </AppLink>
                  <AppLink href="/signup" className={`text-forge-muted hover:text-forge-ink ${focusRing}`}>
                    Get started
                  </AppLink>
                </>
              )}
              <a
                href="https://github.com/StackedByAdit/AI_Component_Builder"
                className={`text-forge-muted hover:text-forge-ink ${focusRing}`}
              >
                Repository
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
          <p className="text-xs text-forge-faint">© {new Date().getFullYear()} ForgeAI</p>
        </div>
      </footer>
    </div>
  );
};
