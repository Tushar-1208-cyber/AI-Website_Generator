/**
 * AI Component & Template Marketplace Engine
 * Provides a curated marketplace for 1-click installing full-stack SaaS templates,
 * visual UI blocks, backend services, and design presets.
 */

export interface MarketplaceItem {
  id: string;
  title: string;
  author: string;
  category: 'template' | 'component' | 'backend' | 'theme';
  rating: number;
  downloads: number;
  description: string;
  codeMap: Record<string, string>;
}

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: 'tpl-saas-master',
    title: 'AI SaaS Master Template',
    author: 'Antigravity Studio',
    category: 'template',
    rating: 4.9,
    downloads: 1240,
    description: 'Complete SaaS landing page with responsive hero, feature grid, interactive pricing tiers, and contact form.',
    codeMap: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI SaaS Master</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen">
  <nav class="flex justify-between items-center px-8 py-4 border-b border-slate-800">
    <span class="font-bold text-lg text-indigo-400">AI SaaS Master</span>
    <button class="px-4 py-2 bg-indigo-600 rounded-lg text-xs font-semibold">Get Started</button>
  </nav>
  <header class="text-center py-20 px-6 space-y-4">
    <h1 class="text-5xl font-extrabold">Next-Gen AI Website Builder</h1>
    <p class="text-slate-400 max-w-xl mx-auto">Build, deploy, and scale web software with autonomous AI agents.</p>
  </header>
</body>
</html>`,
    },
  },
  {
    id: 'tpl-ecommerce',
    title: 'E-Commerce Storefront Pro',
    author: 'Veloce Design',
    category: 'template',
    rating: 4.8,
    downloads: 890,
    description: 'Modern storefront with product grid, search filter, and floating shopping cart drawer.',
    codeMap: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Storefront Pro</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-8">
  <h1 class="text-3xl font-bold mb-6">Featured Products</h1>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
      <div class="h-40 bg-slate-800 rounded-lg"></div>
      <h3 class="font-semibold text-sm">Smart Watch Ultra</h3>
      <span class="text-xs text-indigo-400 font-bold">$299.00</span>
    </div>
  </div>
</body>
</html>`,
    },
  },
  {
    id: 'comp-pricing-table',
    title: 'Interactive SaaS Pricing Cards',
    author: 'UI Lab',
    category: 'component',
    rating: 4.95,
    downloads: 2150,
    description: 'Monthly/Annual billing toggle pricing table with highlight badges and checkout trigger buttons.',
    codeMap: {
      'components/PricingSection.html': `<div class="py-12 bg-slate-950 text-center">
  <h2 class="text-3xl font-bold text-white mb-8">Flexible Pricing Plans</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
    <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
      <h3 class="font-bold text-lg text-white">Starter</h3>
      <div class="text-3xl font-extrabold text-indigo-400">$19<span class="text-xs text-slate-400">/mo</span></div>
      <button class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl">Choose Starter</button>
    </div>
  </div>
</div>`,
    },
  },
];

/**
 * Installs a marketplace item into project filesMap
 */
export function installMarketplaceItem(
  filesMap: Record<string, string>,
  item: MarketplaceItem
): Record<string, string> {
  return {
    ...filesMap,
    ...item.codeMap,
  };
}
