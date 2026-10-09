export interface ComponentLibraryItem {
  id: string;
  name: string;
  category:
    | "navigation"
    | "hero"
    | "features"
    | "buttons"
    | "cards"
    | "pricing"
    | "testimonials"
    | "faq"
    | "footer"
    | "contact"
    | "login"
    | "dashboard"
    | "tables"
    | "modal"
    | "cta"
    | "custom";
  variant?: string;
  snippet: string;
  usedInPages: string[];
  usageCount: number;
  tags: string[];
}

export const PRESET_STARTER_COMPONENTS: ComponentLibraryItem[] = [
  // 1. Navigation
  {
    id: "nav-dark",
    name: "Navbar - Dark",
    category: "navigation",
    variant: "dark",
    snippet: `<nav class="bg-slate-950 border-b border-slate-800 py-4 px-6 text-slate-100 flex items-center justify-between">
  <div class="flex items-center gap-2 font-bold text-lg text-white">
    <span class="size-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold">🚀</span>
    BrandName
  </div>
  <div class="hidden md:flex items-center gap-6 text-sm text-slate-300">
    <a href="index.html" class="hover:text-white transition">Home</a>
    <a href="features.html" class="hover:text-white transition">Features</a>
    <a href="pricing.html" class="hover:text-white transition">Pricing</a>
    <a href="contact.html" class="hover:text-white transition">Contact</a>
  </div>
  <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20">Get Started</button>
</nav>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["navigation", "navbar", "dark"],
  },
  {
    id: "nav-transparent",
    name: "Navbar - Transparent",
    category: "navigation",
    variant: "transparent",
    snippet: `<nav class="bg-transparent py-4 px-6 text-slate-100 flex items-center justify-between absolute top-0 left-0 right-0 z-50">
  <div class="font-extrabold text-xl tracking-tight text-white">LogoMark</div>
  <div class="flex items-center gap-4">
    <a href="pricing.html" class="text-xs font-semibold text-slate-300 hover:text-white">Pricing</a>
    <button class="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md">Sign In</button>
  </div>
</nav>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["navigation", "navbar", "transparent"],
  },

  // 2. Hero
  {
    id: "starter-hero",
    name: "SaaS Hero Gradient",
    category: "hero",
    variant: "gradient",
    snippet: `<section class="py-24 px-6 text-center bg-slate-950 text-slate-100">
  <div class="max-w-4xl mx-auto space-y-6">
    <span class="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold uppercase">Next Gen AI Platform</span>
    <h1 class="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Build SaaS Apps at Lightning Speed</h1>
    <p class="text-slate-400 text-lg max-w-2xl mx-auto">Empower your workflow with AI-driven component generation and real-time visual editing.</p>
    <div class="flex justify-center gap-4">
      <button class="px-6 py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-white transition-all shadow-lg shadow-blue-500/20">Get Started Free</button>
      <button class="px-6 py-3 bg-slate-900 border border-slate-800 font-bold rounded-xl text-slate-300 hover:text-white">Documentation</button>
    </div>
  </div>
</section>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["hero", "saas", "gradient"],
  },

  // 3. Buttons (Variants: Primary, Secondary, Outline, Ghost, Destructive)
  {
    id: "btn-primary",
    name: "Button - Primary Solid",
    category: "buttons",
    variant: "primary",
    snippet: `<button class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all">Primary Action</button>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["button", "primary"],
  },
  {
    id: "btn-outline",
    name: "Button - Outline",
    category: "buttons",
    variant: "outline",
    snippet: `<button class="px-5 py-2.5 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-200 font-bold text-xs rounded-xl transition-all">Secondary Outline</button>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["button", "outline"],
  },
  {
    id: "btn-destructive",
    name: "Button - Destructive",
    category: "buttons",
    variant: "destructive",
    snippet: `<button class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all">Delete Item</button>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["button", "destructive", "danger"],
  },

  // 4. Cards (Variants: Default, Bordered, Elevated)
  {
    id: "card-bordered",
    name: "Card - Bordered Container",
    category: "cards",
    variant: "bordered",
    snippet: `<div class="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
  <h3 class="font-bold text-lg text-slate-100">Card Header Title</h3>
  <p class="text-xs text-slate-400">Card description content summarizing main features and details.</p>
  <button class="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl hover:bg-slate-800">Action Link</button>
</div>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["card", "bordered"],
  },

  // 5. Pricing Section
  {
    id: "comp-pricing-grid",
    name: "Pricing Cards (3-Tier)",
    category: "pricing",
    snippet: `<section class="py-16 px-6 bg-slate-950 text-slate-100">
  <div class="max-w-6xl mx-auto space-y-8 text-center">
    <h2 class="text-3xl font-extrabold">Flexible Pricing Plans</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <span class="text-xs font-bold text-slate-400 uppercase">Free Plan</span>
        <div class="text-3xl font-extrabold">$0 <span class="text-xs text-slate-500 font-normal">/mo</span></div>
        <p class="text-xs text-slate-400">Ideal for personal side projects.</p>
        <button class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl">Get Started</button>
      </div>
      <div class="p-6 bg-slate-900 border-2 border-blue-500 rounded-2xl space-y-4 relative shadow-xl shadow-blue-500/10">
        <span class="absolute -top-3 right-4 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">POPULAR</span>
        <span class="text-xs font-bold text-blue-400 uppercase">Pro SaaS</span>
        <div class="text-3xl font-extrabold">$29 <span class="text-xs text-slate-500 font-normal">/mo</span></div>
        <p class="text-xs text-slate-400">For professional developers & startups.</p>
        <button class="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20">Upgrade to Pro</button>
      </div>
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <span class="text-xs font-bold text-slate-400 uppercase">Enterprise</span>
        <div class="text-3xl font-extrabold">$99 <span class="text-xs text-slate-500 font-normal">/mo</span></div>
        <p class="text-xs text-slate-400">Dedicated infrastructure & support.</p>
        <button class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl">Contact Sales</button>
      </div>
    </div>
  </div>
</section>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["pricing", "plans", "cards"],
  },

  // 6. Contact Form
  {
    id: "form-contact",
    name: "Contact Form",
    category: "contact",
    snippet: `<section class="py-16 px-6 bg-slate-950 text-slate-100">
  <div class="max-w-xl mx-auto p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-5">
    <h2 class="text-2xl font-bold text-center">Get in Touch</h2>
    <form class="space-y-4" onsubmit="event.preventDefault()">
      <div>
        <label class="block text-xs font-semibold text-slate-400 mb-1">Your Name</label>
        <input type="text" placeholder="John Doe" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500" required />
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
        <input type="email" placeholder="john@example.com" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500" required />
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-400 mb-1">Message</label>
        <textarea rows="4" placeholder="How can we help?" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500" required></textarea>
      </div>
      <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-500/20">Send Message</button>
    </form>
  </div>
</section>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["contact", "form", "input"],
  },

  // 7. Footer
  {
    id: "footer-multi-col",
    name: "Global Multi-column Footer",
    category: "footer",
    snippet: `<footer class="py-12 px-6 bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
  <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
    <div class="space-y-3">
      <span class="font-extrabold text-white text-base">BrandName</span>
      <p class="text-[11px] text-slate-500">AI-powered visual website development platform.</p>
    </div>
    <div>
      <h4 class="font-bold text-slate-200 mb-2">Product</h4>
      <ul class="space-y-1 text-slate-400">
        <li><a href="features.html" class="hover:text-white">Features</a></li>
        <li><a href="pricing.html" class="hover:text-white">Pricing</a></li>
      </ul>
    </div>
    <div>
      <h4 class="font-bold text-slate-200 mb-2">Company</h4>
      <ul class="space-y-1 text-slate-400">
        <li><a href="about.html" class="hover:text-white">About Us</a></li>
        <li><a href="contact.html" class="hover:text-white">Contact</a></li>
      </ul>
    </div>
    <div>
      <h4 class="font-bold text-slate-200 mb-2">Legal</h4>
      <p class="text-[11px] text-slate-500">© 2026 BrandName. All rights reserved.</p>
    </div>
  </div>
</footer>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["footer", "navigation", "links"],
  },
];

/**
 * Extract component library items from project code files
 */
export function extractLibraryComponents(filesMap: Record<string, string>): ComponentLibraryItem[] {
  const libraryMap = new Map<string, ComponentLibraryItem>();

  PRESET_STARTER_COMPONENTS.forEach((item) => {
    libraryMap.set(item.id, { ...item });
  });

  return Array.from(libraryMap.values());
}

/**
 * Save custom element snippet as a reusable component
 */
export function saveAsReusableComponent(
  filesMap: Record<string, string>,
  name: string,
  category: ComponentLibraryItem["category"],
  snippet: string
): { updatedFilesMap: Record<string, string>; newComponent: ComponentLibraryItem } {
  const compId = `comp-custom-${Date.now()}`;
  const newComponent: ComponentLibraryItem = {
    id: compId,
    name,
    category,
    snippet,
    usedInPages: ["index.html"],
    usageCount: 1,
    tags: ["custom", category],
  };

  return {
    updatedFilesMap: filesMap,
    newComponent,
  };
}

/**
 * Insert component instance into a target HTML page
 */
export function insertComponentInstance(
  filesMap: Record<string, string>,
  targetPage: string,
  snippet: string
): Record<string, string> {
  const updatedFilesMap = { ...filesMap };
  const content = updatedFilesMap[targetPage];
  if (!content) return filesMap;

  let modified = content;
  if (modified.includes("</main>")) {
    modified = modified.replace("</main>", `\n${snippet}\n</main>`);
  } else if (modified.includes("</body>")) {
    modified = modified.replace("</body>", `\n${snippet}\n</body>`);
  } else {
    modified += `\n${snippet}`;
  }

  updatedFilesMap[targetPage] = modified;
  return updatedFilesMap;
}
