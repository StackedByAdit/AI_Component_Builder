// apps/api/benchmark/dataset.ts
// purpose: curated evaluation dataset of 40 representative prompts across 8 diverse categories

export type PromptCategory =
  | 'simple-ui'
  | 'complex-layout'
  | 'responsive'
  | 'interactive-state'
  | 'forms-validation'
  | 'phrasing-variations'
  | 'ambiguous-incomplete'
  | 'edge-cases';

export interface BenchmarkPrompt {
  id: string;
  category: PromptCategory;
  prompt: string;
  description: string;
  expectedBehavior: 'success' | 'failure';
  // Mock response sequence used for deterministic evaluation
  mockResponses?: string[];
}

export const BENCHMARK_DATASET: BenchmarkPrompt[] = [
  // --------------------------------------------------------------------------
  // 1. Simple UI Components (6 prompts)
  // --------------------------------------------------------------------------
  {
    id: 'simple-status-badge',
    category: 'simple-ui',
    prompt: 'A pill badge with an emerald status dot and text "Active System"',
    description: 'Basic inline badge with status indicator',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Active System</div>',
    ],
  },
  {
    id: 'simple-avatar-card',
    category: 'simple-ui',
    prompt: 'User avatar with online indicator dot, user full name, and role title',
    description: 'Compact user identity card with image placeholder and text hierarchy',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100"><div className="relative"><div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-semibold">JD</div><span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white"></span></div><div><p className="text-sm font-medium text-gray-900">Jane Doe</p><p className="text-xs text-gray-500">Frontend Engineer</p></div></div>',
    ],
  },
  {
    id: 'simple-notification-banner',
    category: 'simple-ui',
    prompt: 'Dismissible info alert banner with an information icon, title, and body description',
    description: 'Banner notification with icon, styled borders, and dismiss button',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="flex items-start justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900"><div className="flex gap-3"><svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"></circle><path strokeLinecap="round" strokeWidth="2" d="M12 16v-4m0-4h.01"></path></svg><div><h4 className="text-sm font-semibold">Update Available</h4><p className="text-xs text-blue-700 mt-0.5">A new version is ready to install.</p></div></div><button className="text-blue-500 hover:text-blue-700 text-sm font-bold">&times;</button></div>',
    ],
  },
  {
    id: 'simple-button-group',
    category: 'simple-ui',
    prompt: 'A segmented button group with Day, Week, Month, and Year options',
    description: 'Horizontal segmented control with active/inactive button styling',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="inline-flex p-1 bg-gray-100 rounded-lg"><button className="px-3 py-1.5 text-xs font-medium rounded-md bg-white text-gray-900 shadow-xs">Day</button><button className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-600 hover:text-gray-900">Week</button><button className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-600 hover:text-gray-900">Month</button><button className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-600 hover:text-gray-900">Year</button></div>',
    ],
  },
  {
    id: 'simple-rating-stars',
    category: 'simple-ui',
    prompt: 'A 5-star rating display showing 4 filled yellow stars and 1 empty star with review count',
    description: 'Star rating component with visual icons and aggregate score label',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="flex items-center gap-2"><div className="flex text-amber-400 text-lg"><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span className="text-gray-300">&#9733;</span></div><span className="text-sm font-medium text-gray-700">4.0</span><span className="text-xs text-gray-400">(128 reviews)</span></div>',
    ],
  },
  {
    id: 'simple-tag-list',
    category: 'simple-ui',
    prompt: 'A horizontal list of tech tags: React, TypeScript, Tailwind CSS, and Vite',
    description: 'Badge collection with pill borders and hover effects',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="flex flex-wrap gap-2"><span className="px-2.5 py-1 text-xs font-medium bg-sky-50 text-sky-700 rounded-md border border-sky-200">React</span><span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-200">TypeScript</span><span className="px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 rounded-md border border-teal-200">Tailwind CSS</span><span className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-md border border-purple-200">Vite</span></div>',
    ],
  },

  // --------------------------------------------------------------------------
  // 2. Complex Layouts (6 prompts)
  // --------------------------------------------------------------------------
  {
    id: 'complex-dashboard-stats',
    category: 'complex-layout',
    prompt: 'A 4-card analytics overview grid showing Total Revenue, Subscriptions, Active Users, and Churn Rate with percentage changes',
    description: 'Multi-card metrics grid with positive/negative indicators and icons',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div className="p-4 bg-white rounded-xl shadow-xs border border-gray-100"><p className="text-xs font-medium text-gray-500">Total Revenue</p><h3 className="text-2xl font-bold text-gray-900 mt-1">$45,231</h3><span className="inline-block mt-2 text-xs font-semibold text-emerald-600">+12.5% from last month</span></div><div className="p-4 bg-white rounded-xl shadow-xs border border-gray-100"><p className="text-xs font-medium text-gray-500">Subscriptions</p><h3 className="text-2xl font-bold text-gray-900 mt-1">+2,350</h3><span className="inline-block mt-2 text-xs font-semibold text-emerald-600">+8.1% from last month</span></div><div className="p-4 bg-white rounded-xl shadow-xs border border-gray-100"><p className="text-xs font-medium text-gray-500">Active Users</p><h3 className="text-2xl font-bold text-gray-900 mt-1">12,234</h3><span className="inline-block mt-2 text-xs font-semibold text-emerald-600">+19.2% from last month</span></div><div className="p-4 bg-white rounded-xl shadow-xs border border-gray-100"><p className="text-xs font-medium text-gray-500">Churn Rate</p><h3 className="text-2xl font-bold text-gray-900 mt-1">1.2%</h3><span className="inline-block mt-2 text-xs font-semibold text-rose-600">-0.4% from last month</span></div></div>',
    ],
  },
  {
    id: 'complex-pricing-table',
    category: 'complex-layout',
    prompt: 'A 3-tier pricing comparison table (Free, Pro, Enterprise) with feature checkmarks and highlighted popular plan',
    description: 'Three pricing cards with features, highlighted center card, and CTA buttons',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"><div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-col justify-between"><h4 className="text-lg font-bold text-gray-900">Starter</h4><p className="text-3xl font-extrabold text-gray-900 mt-2">$0<span className="text-xs text-gray-500 font-normal">/mo</span></p><ul className="mt-4 space-y-2 text-sm text-gray-600 flex-1"><li>&check; 3 Projects</li><li>&check; Community Support</li></ul><button className="mt-6 w-full py-2 bg-gray-100 text-gray-900 rounded-lg font-medium text-sm">Get Started</button></div><div className="p-6 bg-gray-900 text-white rounded-2xl border-2 border-violet-500 relative flex flex-col justify-between shadow-xl"><span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs uppercase px-3 py-0.5 rounded-full font-bold">Popular</span><h4 className="text-lg font-bold">Pro</h4><p className="text-3xl font-extrabold mt-2">$29<span className="text-xs text-gray-400 font-normal">/mo</span></p><ul className="mt-4 space-y-2 text-sm text-gray-300 flex-1"><li>&check; Unlimited Projects</li><li>&check; Priority Support</li><li>&check; Custom Domains</li></ul><button className="mt-6 w-full py-2 bg-violet-600 text-white rounded-lg font-medium text-sm hover:bg-violet-700">Upgrade to Pro</button></div><div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-col justify-between"><h4 className="text-lg font-bold text-gray-900">Enterprise</h4><p className="text-3xl font-extrabold text-gray-900 mt-2">$99<span className="text-xs text-gray-500 font-normal">/mo</span></p><ul className="mt-4 space-y-2 text-sm text-gray-600 flex-1"><li>&check; Dedicated Support</li><li>&check; 99.9% SLA</li><li>&check; Custom Contracts</li></ul><button className="mt-6 w-full py-2 bg-gray-100 text-gray-900 rounded-lg font-medium text-sm">Contact Sales</button></div></div>',
    ],
  },
  {
    id: 'complex-kanban-column',
    category: 'complex-layout',
    prompt: 'A Kanban board column titled "In Progress" containing 3 task cards with priority badges, tags, and assignee avatars',
    description: 'Column container with task item cards and metadata badges',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-80 bg-gray-100 rounded-xl p-3 space-y-3"><div className="flex items-center justify-between px-1"><h4 className="text-sm font-semibold text-gray-700">In Progress <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-1">3</span></h4><button className="text-gray-400 hover:text-gray-600 font-bold">+</button></div><div className="space-y-2"><div className="p-3 bg-white rounded-lg shadow-2xs border border-gray-200/80"><span className="text-2xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm">High</span><h5 className="text-sm font-medium text-gray-900 mt-2">Redesign Auth Flow</h5><div className="flex items-center justify-between mt-3 text-xs text-gray-400"><span>Due Tomorrow</span><div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-2xs">AG</div></div></div><div className="p-3 bg-white rounded-lg shadow-2xs border border-gray-200/80"><span className="text-2xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm">Medium</span><h5 className="text-sm font-medium text-gray-900 mt-2">API Error Interceptor</h5><div className="flex items-center justify-between mt-3 text-xs text-gray-400"><span>Due Oct 30</span><div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-2xs">JD</div></div></div></div></div>',
    ],
  },
  {
    id: 'complex-product-card',
    category: 'complex-layout',
    prompt: 'An e-commerce product card with image placeholder, rating, discount tag, color swatches, and "Add to Bag" button',
    description: 'Rich card layout with visual badges, pricing comparison, and interactive controls',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-72 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"><div className="h-48 bg-gray-200 relative flex items-center justify-center text-gray-400"><span className="text-sm">Product Image</span><span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">-20%</span></div><div className="p-4 space-y-2"><p className="text-xs text-gray-400 uppercase font-semibold">Running Shoes</p><h4 className="text-base font-bold text-gray-900">AeroGlide Pro Runner</h4><div className="flex items-center gap-2"><span className="text-lg font-bold text-gray-900">$128.00</span><span className="text-sm text-gray-400 line-through">$160.00</span></div><div className="flex gap-1.5 pt-1"><span className="w-4 h-4 rounded-full bg-slate-900 ring-2 ring-violet-500"></span><span className="w-4 h-4 rounded-full bg-rose-500"></span><span className="w-4 h-4 rounded-full bg-emerald-500"></span></div><button className="w-full mt-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors">Add to Bag</button></div></div>',
    ],
  },
  {
    id: 'complex-user-profile-header',
    category: 'complex-layout',
    prompt: 'A social profile header with background cover image, avatar overlay, bio text, follower count, and action buttons',
    description: 'Header banner with overlapping avatar, metadata tags, and follow/message CTA',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"><div className="h-32 bg-linear-to-r from-violet-600 to-indigo-600"></div><div className="px-6 pb-6 relative"><div className="flex justify-between items-end -mt-12 mb-4"><div className="w-24 h-24 rounded-full border-4 border-white bg-gray-800 text-white flex items-center justify-center text-2xl font-bold shadow-md">AD</div><div className="flex gap-2"><button className="px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg">Follow</button><button className="px-4 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">Message</button></div></div><h3 className="text-xl font-bold text-gray-900">Aditya Gupta</h3><p className="text-xs text-gray-500">@aditya &bull; Joined March 2024</p><p className="text-sm text-gray-700 mt-2">Full-stack engineer building AI tools, TypeScript systems, and React interfaces.</p><div className="flex gap-4 mt-3 text-xs text-gray-600"><span className="font-semibold text-gray-900">1,420 <span className="font-normal text-gray-500">Following</span></span><span className="font-semibold text-gray-900">8.9K <span className="font-normal text-gray-500">Followers</span></span></div></div></div>',
    ],
  },
  {
    id: 'complex-order-summary',
    category: 'complex-layout',
    prompt: 'An e-commerce checkout order summary with itemized cart items, subtotal, tax calculation, shipping, and total',
    description: 'Checkout invoice card with tabular fee breakdown and primary checkout action',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-80 bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4"><h3 className="text-base font-bold text-gray-900">Order Summary</h3><div className="divide-y divide-gray-100"><div className="flex justify-between py-2 text-sm"><span>Mechanical Keyboard</span><span className="font-medium">$149.00</span></div><div className="flex justify-between py-2 text-sm"><span>Desk Mat</span><span className="font-medium">$29.00</span></div></div><div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-600"><div className="flex justify-between"><span>Subtotal</span><span>$178.00</span></div><div className="flex justify-between"><span>Shipping</span><span className="text-emerald-600 font-medium">Free</span></div><div className="flex justify-between"><span>Estimated Tax</span><span>$14.24</span></div></div><div className="flex justify-between pt-2 border-t border-gray-200 text-base font-bold text-gray-900"><span>Total</span><span>$192.24</span></div><button className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors">Confirm & Pay</button></div>',
    ],
  },

  // --------------------------------------------------------------------------
  // 3. Responsive Components (5 prompts)
  // --------------------------------------------------------------------------
  {
    id: 'responsive-navbar',
    category: 'responsive',
    prompt: 'A responsive header navigation bar with logo, desktop links, search bar, and mobile hamburger button',
    description: 'Header that adapts navigation links on small vs large viewport breakpoints',
    expectedBehavior: 'success',
    mockResponses: [
      '<header className="w-full bg-white border-b border-gray-200 px-4 py-3"><div className="max-w-6xl mx-auto flex items-center justify-between"><div className="flex items-center gap-8"><span className="text-lg font-bold text-violet-600">BrandApp</span><nav className="hidden md:flex gap-6 text-sm text-gray-600"><a href="#" className="hover:text-gray-900">Features</a><a href="#" className="hover:text-gray-900">Docs</a><a href="#" className="hover:text-gray-900">Pricing</a></nav></div><div className="hidden sm:block"><input type="text" placeholder="Search..." className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg" /></div><button className="md:hidden text-gray-700 p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></button></div></header>',
    ],
  },
  {
    id: 'responsive-footer',
    category: 'responsive',
    prompt: 'A responsive site footer with 4 columns of links on desktop that stacks into a single column on mobile',
    description: 'Grid layout adapting from 1 column on mobile to 4 columns on large screens',
    expectedBehavior: 'success',
    mockResponses: [
      '<footer className="w-full bg-gray-900 text-gray-300 py-10 px-6"><div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8"><div><h4 className="text-white text-sm font-bold mb-3">Product</h4><ul className="space-y-2 text-xs"><li>Overview</li><li>Integrations</li><li>Changelog</li></ul></div><div><h4 className="text-white text-sm font-bold mb-3">Resources</h4><ul className="space-y-2 text-xs"><li>Docs</li><li>Tutorials</li><li>Community</li></ul></div><div><h4 className="text-white text-sm font-bold mb-3">Company</h4><ul className="space-y-2 text-xs"><li>About</li><li>Careers</li><li>Press</li></ul></div><div><h4 className="text-white text-sm font-bold mb-3">Legal</h4><ul className="space-y-2 text-xs"><li>Privacy</li><li>Terms</li><li>Security</li></ul></div></div><div className="max-w-6xl mx-auto mt-8 pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">&copy; 2026 BrandApp Inc. All rights reserved.</div></footer>',
    ],
  },
  {
    id: 'responsive-grid-gallery',
    category: 'responsive',
    prompt: 'A responsive photo gallery grid: 1 column on mobile, 2 columns on tablet, and 4 columns on desktop',
    description: 'Adaptive column gallery with aspect-ratio cards',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-full max-w-5xl mx-auto p-4"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 font-medium">Image 1</div><div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 font-medium">Image 2</div><div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 font-medium">Image 3</div><div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 font-medium">Image 4</div></div></div>',
    ],
  },
  {
    id: 'responsive-sidebar-nav',
    category: 'responsive',
    prompt: 'A collapsible application sidebar that hides labels on medium screens and shows only icons',
    description: 'Sidebar using responsive visibility utilities for icon-only vs full label display',
    expectedBehavior: 'success',
    mockResponses: [
      '<aside className="w-16 md:w-64 bg-gray-900 text-white h-screen p-4 flex flex-col justify-between transition-all"><div className="space-y-4"><div className="font-bold text-lg text-violet-400"><span className="hidden md:inline">Analytics</span><span className="md:hidden">A</span></div><nav className="space-y-1"><button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800 text-sm font-medium"><span className="text-base">&#127968;</span><span className="hidden md:inline">Dashboard</span></button><button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white text-sm font-medium"><span className="text-base">&#128202;</span><span className="hidden md:inline">Reports</span></button></nav></div><div className="text-xs text-gray-500 hidden md:block">&copy; 2026 Admin</div></aside>',
    ],
  },
  {
    id: 'responsive-hero-split',
    category: 'responsive',
    prompt: 'A landing page hero section with headline and CTA on the left and illustration container on the right, stacking on small screens',
    description: 'Two-column hero layout with responsive flex/grid direction switching',
    expectedBehavior: 'success',
    mockResponses: [
      '<section className="w-full max-w-5xl mx-auto py-12 px-6 flex flex-col md:flex-row items-center gap-8"><div className="flex-1 space-y-4 text-center md:text-left"><h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">Design & Ship AI Components in Seconds</h1><p className="text-sm sm:text-base text-gray-600">The fastest workbench for crafting modern Tailwind & React user interfaces with verified compilations.</p><div className="flex gap-3 justify-center md:justify-start pt-2"><button className="px-5 py-2.5 bg-violet-600 text-white font-semibold text-sm rounded-xl hover:bg-violet-700">Start Free</button><button className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl">View Demo</button></div></div><div className="flex-1 w-full aspect-video bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 font-medium">Interactive Demo Preview</div></section>',
    ],
  },

  // --------------------------------------------------------------------------
  // 4. Interactive Components with React State (5 prompts)
  // --------------------------------------------------------------------------
  {
    id: 'interactive-faq-accordion',
    category: 'interactive-state',
    prompt: 'An FAQ accordion item with question title, expand/collapse chevron icon, and answer body',
    description: 'Collapsible FAQ component testing disclosure state styling',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 divide-y divide-gray-100"><div className="p-4"><div className="flex items-center justify-between cursor-pointer"><h4 className="text-sm font-semibold text-gray-900">How does automatic repair work?</h4><span className="text-gray-400 text-xs">&#9660;</span></div><p className="mt-2 text-xs text-gray-600 leading-relaxed">When code validation fails, compiler diagnostics are sent back to Gemini for bounded self-correction.</p></div></div>',
    ],
  },
  {
    id: 'interactive-tabs-switcher',
    category: 'interactive-state',
    prompt: 'A tabbed interface with "Overview", "Specifications", and "Reviews" tabs switching visible content',
    description: 'Tab navigation container with active indicator bar and content area',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-4 space-y-4"><div className="flex border-b border-gray-200"><button className="px-4 py-2 text-xs font-semibold text-violet-600 border-b-2 border-violet-600">Overview</button><button className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700">Specifications</button><button className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700">Reviews</button></div><div className="text-xs text-gray-600">Overview content: High-performance React component with Tailwind utility styling.</div></div>',
    ],
  },
  {
    id: 'interactive-quantity-counter',
    category: 'interactive-state',
    prompt: 'A quantity selector with increment and decrement buttons and current count display',
    description: 'Counter widget with minus, value display, and plus button controls',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white"><button className="px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 text-sm font-bold">-</button><span className="px-4 py-1.5 text-xs font-semibold text-gray-900">1</span><button className="px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 text-sm font-bold">+</button></div>',
    ],
  },
  {
    id: 'interactive-toggle-switch',
    category: 'interactive-state',
    prompt: 'A dark mode toggle switch with animated slider pill and moon/sun icon indicators',
    description: 'Toggle switch testing Boolean state representation',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="flex items-center gap-3"><span className="text-xs font-medium text-gray-700">Dark Mode</span><div className="w-11 h-6 bg-violet-600 rounded-full p-1 cursor-pointer flex items-center justify-end"><div className="w-4 h-4 bg-white rounded-full shadow-md"></div></div></div>',
    ],
  },
  {
    id: 'interactive-modal-dialog',
    category: 'interactive-state',
    prompt: 'A confirmation dialog modal with backdrop blur, title, warning message, and Cancel/Delete action buttons',
    description: 'Dialog window overlay with destructive action styling',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4"><div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4"><h3 className="text-base font-bold text-gray-900">Delete Component</h3><p className="text-xs text-gray-500">Are you sure you want to delete this component? This action cannot be undone.</p><div className="flex gap-2 justify-end pt-2"><button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200">Cancel</button><button className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Delete</button></div></div></div>',
    ],
  },

  // --------------------------------------------------------------------------
  // 5. Forms and Validation (5 prompts)
  // --------------------------------------------------------------------------
  {
    id: 'forms-newsletter-subscribe',
    category: 'forms-validation',
    prompt: 'A newsletter subscription form with email input field, inline error state, and Subscribe button',
    description: 'Form with input focus styling, error message indicator, and submit action',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-full max-w-md bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3"><h4 className="text-base font-bold text-gray-900">Join our newsletter</h4><p className="text-xs text-gray-500">Get weekly updates on frontend engineering and AI tooling.</p><div className="flex gap-2"><input type="email" placeholder="you@example.com" className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500" /><button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700">Subscribe</button></div><p className="text-2xs text-gray-400">We respect your privacy. Unsubscribe anytime.</p></div>',
    ],
  },
  {
    id: 'forms-user-login',
    category: 'forms-validation',
    prompt: 'A login form with email, password with show/hide toggle, "Remember me" checkbox, and submit button',
    description: 'Multi-field authentication form with checkbox and password control',
    expectedBehavior: 'success',
    mockResponses: [
      '<form className="w-full max-w-sm bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4"><h3 className="text-lg font-bold text-gray-900">Welcome Back</h3><div className="space-y-1"><label className="text-xs font-medium text-gray-700">Email Address</label><input type="email" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" placeholder="name@company.com" /></div><div className="space-y-1"><label className="text-xs font-medium text-gray-700">Password</label><input type="password" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" /></div><div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-gray-600"><input type="checkbox" className="rounded-sm" /> Remember me</label><a href="#" className="text-violet-600 font-medium">Forgot?</a></div><button type="submit" className="w-full py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700">Sign In</button></form>',
    ],
  },
  {
    id: 'forms-contact-support',
    category: 'forms-validation',
    prompt: 'A contact support form with name, email, topic dropdown selector, message textarea, and submit button',
    description: 'Contact form with select dropdown and multiline text input',
    expectedBehavior: 'success',
    mockResponses: [
      '<form className="w-full max-w-md bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4"><h3 className="text-base font-bold text-gray-900">Get in touch</h3><div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Name" className="px-3 py-2 text-xs border border-gray-200 rounded-lg" /><input type="email" placeholder="Email" className="px-3 py-2 text-xs border border-gray-200 rounded-lg" /></div><select className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700"><option>Technical Support</option><option>Billing Question</option><option>Feedback</option></select><textarea rows={4} placeholder="How can we help?" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg resize-none"></textarea><button type="submit" className="w-full py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-black">Send Message</button></form>',
    ],
  },
  {
    id: 'forms-checkout-billing',
    category: 'forms-validation',
    prompt: 'A checkout billing address form with first name, last name, street address, city, state, zip code, and country',
    description: 'Multi-column address input with standard form fields',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-full max-w-lg bg-white p-6 rounded-2xl border border-gray-200 space-y-4"><h3 className="text-base font-bold text-gray-900">Billing Address</h3><div className="grid grid-cols-2 gap-3"><input type="text" placeholder="First Name" className="px-3 py-2 text-xs border border-gray-300 rounded-lg" /><input type="text" placeholder="Last Name" className="px-3 py-2 text-xs border border-gray-300 rounded-lg" /></div><input type="text" placeholder="Street Address" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" /><div className="grid grid-cols-3 gap-3"><input type="text" placeholder="City" className="px-3 py-2 text-xs border border-gray-300 rounded-lg" /><input type="text" placeholder="State" className="px-3 py-2 text-xs border border-gray-300 rounded-lg" /><input type="text" placeholder="ZIP Code" className="px-3 py-2 text-xs border border-gray-300 rounded-lg" /></div></div>',
    ],
  },
  {
    id: 'forms-password-reset',
    category: 'forms-validation',
    prompt: 'A password reset form with new password input, password strength meter, and confirm password field',
    description: 'Form with visual strength indicator bars and confirmation fields',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-gray-200 space-y-4"><h3 className="text-base font-bold text-gray-900">Set New Password</h3><input type="password" placeholder="New Password" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" /><div className="space-y-1"><div className="grid grid-cols-4 gap-1 h-1.5"><div className="bg-emerald-500 rounded-full"></div><div className="bg-emerald-500 rounded-full"></div><div className="bg-emerald-500 rounded-full"></div><div className="bg-gray-200 rounded-full"></div></div><p className="text-2xs text-emerald-600 font-medium">Strong password</p></div><input type="password" placeholder="Confirm Password" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" /><button className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold">Update Password</button></div>',
    ],
  },

  // --------------------------------------------------------------------------
  // 6. Different Legitimate Prompt Phrasings (5 prompts)
  // --------------------------------------------------------------------------
  {
    id: 'phrasing-imperative',
    category: 'phrasing-variations',
    prompt: 'Generate a sleek dark-themed cryptocurrency wallet balance card with Send and Receive buttons.',
    description: 'Direct imperative phrasing specifying theme and specific controls',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-80 bg-gray-950 text-white p-5 rounded-2xl border border-gray-800 space-y-4"><p className="text-xs text-gray-400">Total Portfolio Value</p><h2 className="text-3xl font-extrabold">$14,820.50</h2><div className="grid grid-cols-2 gap-2 pt-2"><button className="py-2 bg-violet-600 text-xs font-semibold rounded-lg hover:bg-violet-700">Send</button><button className="py-2 bg-gray-800 text-xs font-semibold rounded-lg hover:bg-gray-700">Receive</button></div></div>',
    ],
  },
  {
    id: 'phrasing-conversational',
    category: 'phrasing-variations',
    prompt: 'Could you please build me a clean testimonials section featuring quote, author avatar, and company logo?',
    description: 'Polite conversational prompt with multiple component elements requested',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="max-w-md bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4"><p className="text-sm text-gray-700 italic">"This builder accelerated our frontend prototyping by 10x. The verified compilations ensure we never render broken JSX."</p><div className="flex items-center gap-3 pt-2"><div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">SC</div><div><h5 className="text-xs font-bold text-gray-900">Sarah Connor</h5><p className="text-2xs text-gray-500">VP of Engineering at Cyberdyne</p></div></div></div>',
    ],
  },
  {
    id: 'phrasing-terse',
    category: 'phrasing-variations',
    prompt: 'Dark stats widget. 3 metrics. Tailwind.',
    description: 'Telegraphic, terse phrasing with minimal words',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-80 bg-gray-900 text-white p-4 rounded-xl border border-gray-800 flex justify-between divide-x divide-gray-800"><div className="px-2 text-center"><p className="text-2xs text-gray-400">CPU</p><p className="text-sm font-bold text-emerald-400">24%</p></div><div className="px-2 text-center"><p className="text-2xs text-gray-400">RAM</p><p className="text-sm font-bold text-sky-400">4.2GB</p></div><div className="px-2 text-center"><p className="text-2xs text-gray-400">Disk</p><p className="text-sm font-bold text-purple-400">68%</p></div></div>',
    ],
  },
  {
    id: 'phrasing-descriptive',
    category: 'phrasing-variations',
    prompt: 'I need a component that displays a file upload dropzone with dotted border, cloud upload icon, and supported format label.',
    description: 'Descriptive specification of visual states and icons',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-full max-w-sm p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50 text-center space-y-2 hover:border-violet-400 cursor-pointer transition-colors"><div className="w-10 h-10 mx-auto rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-lg">&#9729;</div><p className="text-xs font-semibold text-gray-900">Click to upload or drag and drop</p><p className="text-2xs text-gray-400">SVG, PNG, JPG or GIF (max 10MB)</p></div>',
    ],
  },
  {
    id: 'phrasing-role-oriented',
    category: 'phrasing-variations',
    prompt: 'As a developer, I want a code snippet card with a copy-to-clipboard button and language badge.',
    description: 'User story format with technical UI artifacts',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="w-full max-w-md bg-gray-950 rounded-xl overflow-hidden border border-gray-800 text-white"><div className="flex justify-between items-center px-4 py-2 bg-gray-900 text-xs"><span className="text-gray-400 font-mono">Terminal</span><button className="text-gray-400 hover:text-white text-xs">Copy</button></div><pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto"><code>pnpm install @repo/types</code></pre></div>',
    ],
  },

  // --------------------------------------------------------------------------
  // 7. Ambiguous or Incomplete Prompts (4 prompts)
  // --------------------------------------------------------------------------
  {
    id: 'ambiguous-single-word-card',
    category: 'ambiguous-incomplete',
    prompt: 'card',
    description: 'Minimal single-word prompt testing model fallback defaults',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="p-4 bg-white rounded-xl shadow-xs border border-gray-200 max-w-sm"><h3 className="text-sm font-semibold text-gray-900">Card Title</h3><p className="text-xs text-gray-500 mt-1">Default card description with standard spacing.</p></div>',
    ],
  },
  {
    id: 'ambiguous-vague-request',
    category: 'ambiguous-incomplete',
    prompt: 'make it pop',
    description: 'Colloquial vague prompt with no concrete UI specifications',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="p-6 bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-2xl shadow-xl max-w-sm text-center space-y-2"><h2 className="text-xl font-black tracking-tight">Eye-Catching Feature</h2><p className="text-xs text-pink-100">Vibrant gradient card designed to stand out.</p></div>',
    ],
  },
  {
    id: 'ambiguous-minimal-table',
    category: 'ambiguous-incomplete',
    prompt: 'table',
    description: 'Single word table request testing basic HTML table generation',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="overflow-x-auto max-w-md bg-white rounded-xl border border-gray-200"><table className="w-full text-xs text-left text-gray-600"><thead className="bg-gray-50 border-b border-gray-200 text-gray-900"><tr><th className="p-2">Name</th><th className="p-2">Status</th></tr></thead><tbody className="divide-y divide-gray-100"><tr><td className="p-2">Item 1</td><td className="p-2 text-emerald-600">Active</td></tr><tr><td className="p-2">Item 2</td><td className="p-2 text-gray-400">Pending</td></tr></tbody></table></div>',
    ],
  },
  {
    id: 'ambiguous-saas-open-ended',
    category: 'ambiguous-incomplete',
    prompt: 'something for a SaaS landing page',
    description: 'Open-ended thematic request with no specific component type',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="p-6 bg-violet-50 rounded-2xl border border-violet-100 max-w-md text-center space-y-3"><span className="text-xs font-bold uppercase tracking-wider text-violet-600">SaaS Feature</span><h3 className="text-lg font-bold text-gray-900">Automate your component workflow</h3><p className="text-xs text-gray-600">Continuous compilation and auto-repair directly in your browser.</p></div>',
    ],
  },

  // --------------------------------------------------------------------------
  // 8. Edge Cases, Malformed Responses & Failure Handling (4 prompts)
  // --------------------------------------------------------------------------
  {
    id: 'edge-empty-prompt',
    category: 'edge-cases',
    prompt: '   ',
    description: 'Whitespace-only prompt testing client/server input validation',
    expectedBehavior: 'failure',
    // Should be rejected by prompt validation before calling Gemini
  },
  {
    id: 'edge-special-characters',
    category: 'edge-cases',
    prompt: 'A component for `<script>alert("xss")</script>` & {dangerous} &amp; symbols',
    description: 'Prompt containing XSS strings, braces, and HTML entities',
    expectedBehavior: 'success',
    mockResponses: [
      '<div className="p-4 bg-gray-100 rounded-xl text-xs font-mono text-gray-800"><code>Safe rendered text: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</code></div>',
    ],
  },
  {
    id: 'edge-syntax-repair-recovery',
    category: 'edge-cases',
    prompt: 'Component that triggers syntax error on attempt 1 and recovers on repair attempt 2',
    description: 'Verifies the bounded automatic repair mechanism recovers malformed JSX',
    expectedBehavior: 'success',
    mockResponses: [
      // Attempt 1: unclosed <span> tag (malformed JSX)
      '<div><span>Unclosed span tag</div>',
      // Attempt 2: valid, repaired JSX
      '<div className="p-4 bg-white rounded-xl shadow-xs"><span className="text-xs font-semibold text-emerald-600">Repaired and successfully closed</span></div>',
    ],
  },
  {
    id: 'edge-exhausted-repairs-failure',
    category: 'edge-cases',
    prompt: 'Component where model continually outputs invalid syntax across all attempts',
    description: 'Verifies bounded failure handling when repair attempts are exhausted',
    expectedBehavior: 'failure',
    mockResponses: [
      // Attempt 1: malformed
      '<div><span>Broken 1',
      // Attempt 2 (repair 1): still malformed
      '<div><span>Broken 2',
      // Attempt 3 (repair 2): still malformed
      '<div><span>Broken 3',
    ],
  },
];
