export interface ComponentLibraryItem {
  id: string;
  name: string;
  category: "navigation" | "hero" | "card" | "pricing" | "footer" | "form" | "modal" | "custom";
  snippet: string;
  usedInPages: string[];
  usageCount: number;
  tags: string[];
}

/**
 * Reusable Component Engine: Extracts UI components and manages component instances
 */
export function extractLibraryComponents(filesMap: Record<string, string>): ComponentLibraryItem[] {
  const libraryMap = new Map<string, ComponentLibraryItem>();
  const htmlFilePaths = Object.keys(filesMap).filter((p) => p.endsWith(".html") || p.endsWith(".htm"));

  // 1. Extract Navbar Component
  for (const path of htmlFilePaths) {
    const content = filesMap[path] || "";
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

    // 2. Extract Hero Section Component
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

    // 3. Extract Pricing Table Component
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

    // 4. Extract Footer Component
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
