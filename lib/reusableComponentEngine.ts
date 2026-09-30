export interface ComponentLibraryItem {
  id: string;
  name: string;
  category:
    | "navigation"
    | "hero"
    | "card"
    | "pricing"
    | "footer"
    | "form"
    | "modal"
    | "features"
    | "testimonials"
    | "cta"
    | "stats"
    | "team"
    | "faq"
    | "banner"
    | "sidebar"
    | "custom";
  snippet: string;
  usedInPages: string[];
  usageCount: number;
  tags: string[];
}

export const PRESET_STARTER_COMPONENTS: ComponentLibraryItem[] = [
  {
    id: "starter-hero",
    name: "SaaS Hero Gradient",
    category: "hero",
    snippet: `<section className="py-20 px-6 text-center bg-slate-950 text-slate-100">\n  <div className="max-w-4xl mx-auto space-y-6">\n    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold uppercase">Next Gen AI Platform</span>\n    <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Build SaaS Apps at Lightning Speed</h1>\n    <p className="text-slate-400 text-lg max-w-2xl mx-auto">Empower your workflow with AI-driven component generation and real-time visual editing.</p>\n    <div className="flex justify-center gap-4">\n      <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-white transition-all shadow-lg shadow-blue-500/20">Get Started Free</button>\n      <button className="px-6 py-3 bg-slate-900 border border-slate-800 font-bold rounded-xl text-slate-300 hover:text-white">Documentation</button>\n    </div>\n  </div>\n</section>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["hero", "saas", "gradient"],
  },
  {
    id: "starter-features",
    name: "Feature Grid 3-Col",
    category: "features",
    snippet: `<section className="py-16 px-6 bg-slate-900 text-slate-100">\n  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">\n    <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">\n      <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center font-bold">⚡</div>\n      <h3 className="font-bold text-lg">Instant Generation</h3>\n      <p className="text-sm text-slate-400">Generate fully functional HTML/Tailwind web pages in seconds.</p>\n    </div>\n    <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">\n      <div className="w-10 h-10 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center font-bold">🎨</div>\n      <h3 className="font-bold text-lg">Visual Builder</h3>\n      <p className="text-sm text-slate-400">Point, click, and visually tweak computed styles with real-time feedback.</p>\n    </div>\n    <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">\n      <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold">🚀</div>\n      <h3 className="font-bold text-lg">1-Click Export</h3>\n      <p className="text-sm text-slate-400">Export clean ZIP archives or push directly to GitHub repositories.</p>\n    </div>\n  </div>\n</section>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["features", "grid", "cards"],
  },
  {
    id: "starter-cta",
    name: "Call-to-Action Banner",
    category: "cta",
    snippet: `<section className="py-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl my-12 max-w-5xl mx-auto shadow-2xl shadow-blue-500/20">\n  <div className="flex flex-col md:flex-row items-center justify-between gap-6">\n    <div className="space-y-2 text-center md:text-left">\n      <h2 className="text-3xl font-extrabold">Ready to transform your site?</h2>\n      <p className="text-blue-100 text-sm">Join thousands of developers building modern websites effortlessly.</p>\n    </div>\n    <button className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-md shrink-0">Start Building Now</button>\n  </div>\n</section>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["cta", "banner", "gradient"],
  },
  {
    id: "starter-testimonials",
    name: "Testimonial Cards",
    category: "testimonials",
    snippet: `<section className="py-16 px-6 bg-slate-950 text-slate-100">\n  <div className="max-w-4xl mx-auto text-center space-y-8">\n    <h2 className="text-3xl font-bold">Loved by Creators Worldwide</h2>\n    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">\n      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">\n        <p className="text-slate-300 text-sm">"This AI builder transformed our product landing pages. We launched 5x faster!"</p>\n        <div className="flex items-center gap-3">\n          <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center font-bold text-white text-xs">JD</div>\n          <div>\n            <span className="font-bold text-xs block">Jane Doe</span>\n            <span className="text-[10px] text-slate-400">Founder @ TechFlow</span>\n          </div>\n        </div>\n      </div>\n      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">\n        <p className="text-slate-300 text-sm">"The visual element editor plus prompt engine gives us total control."</p>\n        <div className="flex items-center gap-3">\n          <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-xs">AS</div>\n          <div>\n            <span className="font-bold text-xs block">Alex Smith</span>\n            <span className="text-[10px] text-slate-400">Design Lead @ Pixel</span>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</section>`,
    usedInPages: [],
    usageCount: 0,
    tags: ["testimonials", "social-proof", "reviews"],
  },
];

/**
 * Reusable Component Engine: Extracts UI components and manages component instances
 */
export function extractLibraryComponents(filesMap: Record<string, string>): ComponentLibraryItem[] {
  const libraryMap = new Map<string, ComponentLibraryItem>();
  const htmlFilePaths = Object.keys(filesMap).filter((p) => /\.(html|htm|jsx|tsx|vue|svelte)$/i.test(p));

  // Load starter presets into map first
  PRESET_STARTER_COMPONENTS.forEach((item) => {
    libraryMap.set(item.id, { ...item });
  });

  // Extract from project code files
  for (const path of htmlFilePaths) {
    const content = filesMap[path] || "";

    // 1. Navbar
    const navMatch = content.match(/<nav[\s\S]*?<\/nav>/i);
    if (navMatch) {
      const existing = libraryMap.get("comp-navbar");
      const pages = existing ? [...existing.usedInPages, path] : [path];
      libraryMap.set("comp-navbar", {
        id: "comp-navbar",
        name: "Global Navbar",
        category: "navigation",
        snippet: navMatch[0].trim(),
        usedInPages: Array.from(new Set(pages)),
        usageCount: Array.from(new Set(pages)).length,
        tags: ["nav", "header", "brand"],
      });
    }

    // 2. Hero Section
    const heroMatch = content.match(/<section[^>]*hero[\s\S]*?<\/section>/i) || content.match(/<div[^>]*hero[\s\S]*?<\/div>/i);
    if (heroMatch) {
      const existing = libraryMap.get("comp-hero");
      const pages = existing ? [...existing.usedInPages, path] : [path];
      libraryMap.set("comp-hero", {
        id: "comp-hero",
        name: "Hero Section",
        category: "hero",
        snippet: heroMatch[0].trim(),
        usedInPages: Array.from(new Set(pages)),
        usageCount: Array.from(new Set(pages)).length,
        tags: ["hero", "headline", "cta"],
      });
    }

    // 3. Pricing Table
    const pricingMatch = content.match(/<section[^>]*pricing[\s\S]*?<\/section>/i) || content.match(/<div[^>]*pricing[\s\S]*?<\/div>/i);
    if (pricingMatch) {
      const existing = libraryMap.get("comp-pricing");
      const pages = existing ? [...existing.usedInPages, path] : [path];
      libraryMap.set("comp-pricing", {
        id: "comp-pricing",
        name: "Pricing Cards Grid",
        category: "pricing",
        snippet: pricingMatch[0].trim(),
        usedInPages: Array.from(new Set(pages)),
        usageCount: Array.from(new Set(pages)).length,
        tags: ["pricing", "table", "plans"],
      });
    }

    // 4. Footer
    const footerMatch = content.match(/<footer[\s\S]*?<\/footer>/i);
    if (footerMatch) {
      const existing = libraryMap.get("comp-footer");
      const pages = existing ? [...existing.usedInPages, path] : [path];
      libraryMap.set("comp-footer", {
        id: "comp-footer",
        name: "Global Footer",
        category: "footer",
        snippet: footerMatch[0].trim(),
        usedInPages: Array.from(new Set(pages)),
        usageCount: Array.from(new Set(pages)).length,
        tags: ["footer", "links", "copyright"],
      });
    }
  }

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
