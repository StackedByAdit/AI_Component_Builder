// purpose: static illustrations of the ForgeAI workspace — not a second generator

import { BrandMark } from '../brand-mark';

const EXAMPLE_PROMPT =
  'Create a pricing card with three plans, a highlighted recommended plan, and a monthly/yearly toggle.';

const EXAMPLE_CODE = `export function PricingPlans() {
  const [yearly, setYearly] = useState(true);

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <article
          key={plan.name}
          className={plan.featured ? "ring-1 ring-stone-900" : ""}
        >
          <h3>{plan.name}</h3>
          <p>{yearly ? plan.yearly : plan.monthly}</p>
        </article>
      ))}
    </section>
  );
}`;

const PricingSample = () => (
  <div className="bg-white p-4 sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500">Pricing</p>
      <div className="flex border border-stone-200 text-[11px]">
        <span className="px-2 py-1 text-stone-400">Monthly</span>
        <span className="bg-stone-900 px-2 py-1 text-white">Yearly</span>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[
        { name: 'Starter', price: '$15', featured: false },
        { name: 'Pro', price: '$29', featured: true },
        { name: 'Team', price: '$59', featured: false },
      ].map((plan) => (
        <div
          key={plan.name}
          className={`border px-2 py-3 ${
            plan.featured ? 'border-stone-900 bg-stone-50' : 'border-stone-200'
          }`}
        >
          <p className="text-[10px] uppercase tracking-wide text-stone-500">{plan.name}</p>
          <p className="mt-1 font-serif text-lg leading-none text-stone-900">{plan.price}</p>
          <p className="mt-1 text-[10px] text-stone-500">{plan.featured ? 'Recommended' : 'per month'}</p>
        </div>
      ))}
    </div>
  </div>
);

export const HeroPreview = () => (
  <figure className="min-w-0">
    <div className="overflow-hidden border border-stone-300 bg-stone-950 text-white shadow-[0_18px_40px_-28px_rgba(28,25,23,0.45)]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <BrandMark className="h-4 w-4" />
          <span className="text-xs font-medium tracking-tight">ForgeAI</span>
        </div>
        <div className="flex gap-3 text-[11px] text-stone-400">
          <span className="text-white">Preview</span>
          <span>Code</span>
        </div>
      </div>
      <div className="grid md:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
        <div className="border-b border-white/10 p-3 md:border-b-0 md:border-r">
          <p className="text-[10px] uppercase tracking-[0.14em] text-stone-500">Prompt</p>
          <p className="mt-2 min-h-24 border border-white/10 bg-white/5 p-2.5 text-[12px] leading-relaxed text-stone-300">
            {EXAMPLE_PROMPT}
          </p>
          <div className="mt-2 bg-white px-3 py-2 text-center text-[12px] font-medium text-stone-950">
            Generate Component
          </div>
        </div>
        <PricingSample />
      </div>
    </div>
    <figcaption className="mt-3 text-xs leading-relaxed text-forge-faint">
      Static illustration of the workspace. It shows the prompt, preview, and actions that exist in the app.
    </figcaption>
  </figure>
);

export const WorkflowExample = () => (
  <div className="grid gap-6 lg:grid-cols-3">
    <figure className="min-w-0 border border-forge-line bg-forge-paper">
      <figcaption className="border-b border-forge-line px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-forge-faint">
        Prompt
      </figcaption>
      <p className="px-4 py-4 text-sm leading-relaxed text-forge-ink">{EXAMPLE_PROMPT}</p>
    </figure>
    <figure className="min-w-0 border border-forge-line bg-white">
      <figcaption className="border-b border-forge-line px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-forge-faint">
        Preview
      </figcaption>
      <PricingSample />
    </figure>
    <figure className="min-w-0 border border-forge-line bg-[#1c1917] text-stone-200">
      <figcaption className="border-b border-white/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">
        Code
      </figcaption>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[11px] leading-relaxed">
        <code>{EXAMPLE_CODE}</code>
      </pre>
    </figure>
  </div>
);
