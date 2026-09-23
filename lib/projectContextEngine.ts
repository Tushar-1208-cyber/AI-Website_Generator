import { SelectedElementInfo } from "./elementInspector";

export interface ProjectFile {
  path: string;
  type: "html" | "css" | "js" | "jsx" | "tsx" | "json" | "other";
  linesCount: number;
  sizeBytes: number;
}

export interface ProjectPage {
  path: string;
  route: string;
  title: string;
  hasNavbar: boolean;
  hasFooter: boolean;
  hasForm: boolean;
}

export interface ProjectComponent {
  id: string;
  name: string;
  type: "navbar" | "hero" | "features" | "pricing" | "footer" | "form" | "card" | "modal" | "generic";
  filePath: string;
  tags: string[];
}

export interface DesignTokens {
  primaryColors: string[];
  fontFamilies: string[];
  isDarkMode: boolean;
  hasTailwind: boolean;
  hasFlowbite: boolean;
  hasFontAwesome: boolean;
  hasChartJs: boolean;
  borderRadius: string;
}

export interface ProjectIndex {
  files: ProjectFile[];
  pages: ProjectPage[];
  components: ProjectComponent[];
  designTokens: DesignTokens;
  totalSizeFormatted: string;
  lastIndexedAt: string;
}

export interface SmartContextPayload {
  summary: string;
  relevantFilePaths: string[];
  relevantFilesContent: Record<string, string>;
  designTokens: DesignTokens;
  selectedElementContext?: string;
  activeFile?: string;
}

/**
 * Helper to format byte sizes into readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Detect file type based on extension
 */
function getFileType(path: string): ProjectFile["type"] {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "css") return "css";
  if (ext === "js") return "js";
  if (ext === "jsx") return "jsx";
  if (ext === "tsx" || ext === "ts") return "tsx";
  if (ext === "json") return "json";
  return "other";
}

/**
 * Extract design system tokens (colors, fonts, dark mode state, frameworks)
 */
export function extractDesignTokens(filesMap: Record<string, string>): DesignTokens {
  const combinedCode = Object.values(filesMap).join("\n");

  // Colors extraction from Tailwind or inline styles
  const colorMatches = combinedCode.match(/(?:bg|text|border)-(?:blue|indigo|purple|emerald|slate|gray|rose|amber|sky|violet)-\d{2,3}/g) || [];
  const uniqueColors = Array.from(new Set(colorMatches)).slice(0, 8);

  // Dark mode detection
  const isDarkMode = /dark|bg-slate-900|bg-slate-950|bg-gray-900|bg-black/i.test(combinedCode);

  // CDN Framework detection
  const hasTailwind = /tailwindcss|cdn\.tailwindcss/i.test(combinedCode);
  const hasFlowbite = /flowbite/i.test(combinedCode);
  const hasFontAwesome = /fontawesome|font-awesome/i.test(combinedCode);
  const hasChartJs = /chart\.js/i.test(combinedCode);

  // Font extraction
  const fontMatches = combinedCode.match(/font-[a-z0-9-]+/gi) || [];
  const uniqueFonts = Array.from(new Set(fontMatches)).slice(0, 4);

  return {
    primaryColors: uniqueColors.length > 0 ? uniqueColors : ["bg-blue-600", "text-slate-900"],
    fontFamilies: uniqueFonts.length > 0 ? uniqueFonts : ["font-sans"],
    isDarkMode,
    hasTailwind,
    hasFlowbite,
    hasFontAwesome,
    hasChartJs,
    borderRadius: "rounded-xl",
  };
}

/**
 * Index pages and routes
 */
export function extractPages(filesMap: Record<string, string>): ProjectPage[] {
  const pages: ProjectPage[] = [];

  for (const [path, content] of Object.entries(filesMap)) {
    if (path.endsWith(".html") || path.endsWith(".htm") || path.includes("/page.")) {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      let route = cleanPath.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
      if (route === "") route = "/";

      // Extract title if present
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : path.replace(/\.[^/.]+$/, "");

      const hasNavbar = /<nav|class="[^"]*nav/i.test(content);
      const hasFooter = /<footer|class="[^"]*footer/i.test(content);
      const hasForm = /<form|input/i.test(content);

      pages.push({
        path,
        route,
        title,
        hasNavbar,
        hasFooter,
        hasForm,
      });
    }
  }

  return pages;
}

/**
 * Extract UI sections & components
 */
export function extractComponents(filesMap: Record<string, string>): ProjectComponent[] {
  const components: ProjectComponent[] = [];

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (/<nav/i.test(content)) {
      components.push({ id: `${filePath}-nav`, name: "Navbar", type: "navbar", filePath, tags: ["nav", "header"] });
    }
    if (/class="[^"]*hero|<section[^>]*hero/i.test(content)) {
      components.push({ id: `${filePath}-hero`, name: "Hero Section", type: "hero", filePath, tags: ["section", "hero"] });
    }
    if (/class="[^"]*feature|<section[^>]*feature/i.test(content)) {
      components.push({ id: `${filePath}-features`, name: "Features Grid", type: "features", filePath, tags: ["section", "grid"] });
    }
    if (/class="[^"]*pricing|<section[^>]*pricing/i.test(content)) {
      components.push({ id: `${filePath}-pricing`, name: "Pricing Table", type: "pricing", filePath, tags: ["section", "table"] });
    }
    if (/<footer/i.test(content)) {
      components.push({ id: `${filePath}-footer`, name: "Footer", type: "footer", filePath, tags: ["footer"] });
    }
    if (/<form/i.test(content)) {
      components.push({ id: `${filePath}-form`, name: "Contact/Input Form", type: "form", filePath, tags: ["form", "input"] });
    }
  }

  return components;
}

/**
 * Build complete Project Index
 */
export function indexProject(filesMap: Record<string, string>): ProjectIndex {
  const files: ProjectFile[] = [];
  let totalBytes = 0;

  for (const [path, content] of Object.entries(filesMap)) {
    const linesCount = content.split("\n").length;
    const sizeBytes = new Blob([content]).size;
    totalBytes += sizeBytes;

    files.push({
      path,
      type: getFileType(path),
      linesCount,
      sizeBytes,
    });
  }

  const pages = extractPages(filesMap);
  const components = extractComponents(filesMap);
  const designTokens = extractDesignTokens(filesMap);

  return {
    files,
    pages,
    components,
    designTokens,
    totalSizeFormatted: formatBytes(totalBytes),
    lastIndexedAt: new Date().toLocaleTimeString(),
  };
}

/**
 * Smart Context Retrieval Engine: Retrieves ONLY relevant context for Gemini AI
 */
export function getRelevantContext(
  prompt: string,
  index: ProjectIndex,
  filesMap: Record<string, string>,
  selectedElement?: SelectedElementInfo | null,
  activeFile?: string
): SmartContextPayload {
  const promptLower = prompt.toLowerCase();
  const relevantPaths = new Set<string>();

  // Always include index.html or active file
  if (activeFile && filesMap[activeFile]) {
    relevantPaths.add(activeFile);
  } else if (filesMap["index.html"]) {
    relevantPaths.add("index.html");
  }

  // Keyword matching for specific files
  for (const page of index.pages) {
    const pageName = page.title.toLowerCase();
    const pathClean = page.path.toLowerCase();
    if (promptLower.includes(pageName) || promptLower.includes(pathClean.replace(".html", ""))) {
      relevantPaths.add(page.path);
    }
  }

  // Stylesheet & scripts
  for (const file of index.files) {
    if (file.type === "css" || file.type === "js") {
      relevantPaths.add(file.path);
    }
  }

  // Build relevant files object
  const relevantFilesContent: Record<string, string> = {};
  for (const path of Array.from(relevantPaths)) {
    if (filesMap[path]) {
      relevantFilesContent[path] = filesMap[path];
    }
  }

  // Element context snippet if element inspector is active
  let selectedElementContext: string | undefined = undefined;
  if (selectedElement) {
    selectedElementContext = `Target Element: <${selectedElement.tagName}${selectedElement.id ? ` id="${selectedElement.id}"` : ""}${selectedElement.className ? ` class="${selectedElement.className}"` : ""}> with text content "${selectedElement.textSnippet}"`;
  }

  const summary = `Project Indexed: ${index.files.length} files (${index.totalSizeFormatted}), ${index.pages.length} pages, ${index.components.length} components. DarkMode: ${index.designTokens.isDarkMode ? "Active" : "Inactive"}.`;

  return {
    summary,
    relevantFilePaths: Array.from(relevantPaths),
    relevantFilesContent,
    designTokens: index.designTokens,
    selectedElementContext,
    activeFile,
  };
}
