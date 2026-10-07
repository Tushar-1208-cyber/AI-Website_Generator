export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primaryBg: string; // e.g. bg-blue-600
  primaryHoverBg: string; // e.g. bg-blue-500
  primaryText: string; // e.g. text-blue-400
  backgroundColor: string; // e.g. bg-slate-950
  cardBg: string; // e.g. bg-slate-900
  borderRadius: string; // e.g. rounded-xl
  fontFamily: string; // e.g. font-sans
  borderStyle: string; // e.g. border-slate-800
  accentColor: string; // hex or name representation
}

export const PRESET_THEMES: ThemePreset[] = [
  {
    id: "clean-light-saas",
    name: "Clean Light SaaS",
    description: "Crisp blue accent with clean white & light slate background",
    primaryBg: "bg-blue-600",
    primaryHoverBg: "hover:bg-blue-700",
    primaryText: "text-blue-600",
    backgroundColor: "bg-slate-50",
    cardBg: "bg-white",
    borderRadius: "rounded-xl",
    fontFamily: "font-sans",
    borderStyle: "border-slate-200",
    accentColor: "#2563eb",
  },
  {
    id: "dark-saas",
    name: "Modern Dark SaaS",
    description: "Sleek blue accent with dark slate background (v0 & Framer style)",
    primaryBg: "bg-blue-600",
    primaryHoverBg: "hover:bg-blue-500",
    primaryText: "text-blue-400",
    backgroundColor: "bg-slate-950",
    cardBg: "bg-slate-900",
    borderRadius: "rounded-xl",
    fontFamily: "font-sans",
    borderStyle: "border-slate-800",
    accentColor: "#3b82f6",
  },
  {
    id: "emerald-corp",
    name: "Emerald Eco Corporate",
    description: "Clean emerald green branding with rounded modern cards",
    primaryBg: "bg-emerald-600",
    primaryHoverBg: "hover:bg-emerald-500",
    primaryText: "text-emerald-400",
    backgroundColor: "bg-slate-950",
    cardBg: "bg-slate-900",
    borderRadius: "rounded-2xl",
    fontFamily: "font-sans",
    borderStyle: "border-emerald-900/40",
    accentColor: "#10b981",
  },
  {
    id: "indigo-tech",
    name: "Indigo Premium Tech",
    description: "Deep indigo & purple gradient theme with high contrast",
    primaryBg: "bg-indigo-600",
    primaryHoverBg: "hover:bg-indigo-500",
    primaryText: "text-indigo-400",
    backgroundColor: "bg-slate-950",
    cardBg: "bg-slate-900",
    borderRadius: "rounded-2xl",
    fontFamily: "font-sans",
    borderStyle: "border-indigo-900/40",
    accentColor: "#6366f1",
  },
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk Neon",
    description: "Vibrant purple & neon accents on pitch black background",
    primaryBg: "bg-purple-600",
    primaryHoverBg: "hover:bg-purple-500",
    primaryText: "text-purple-400",
    backgroundColor: "bg-black",
    cardBg: "bg-zinc-950",
    borderRadius: "rounded-lg",
    fontFamily: "font-mono",
    borderStyle: "border-purple-500/30",
    accentColor: "#a855f7",
  },
  {
    id: "amber-luxury",
    name: "Amber Gold Luxury",
    description: "Rich warm gold & amber highlights with high elegance",
    primaryBg: "bg-amber-600",
    primaryHoverBg: "hover:bg-amber-500",
    primaryText: "text-amber-400",
    backgroundColor: "bg-neutral-950",
    cardBg: "bg-neutral-900",
    borderRadius: "rounded-xl",
    fontFamily: "font-serif",
    borderStyle: "border-amber-900/40",
    accentColor: "#f59e0b",
  },
  {
    id: "sunset-rose",
    name: "Sunset Rose Pink",
    description: "Vibrant rose pink accent with modern creative aesthetic",
    primaryBg: "bg-rose-600",
    primaryHoverBg: "hover:bg-rose-500",
    primaryText: "text-rose-400",
    backgroundColor: "bg-stone-950",
    cardBg: "bg-stone-900",
    borderRadius: "rounded-2xl",
    fontFamily: "font-sans",
    borderStyle: "border-rose-900/40",
    accentColor: "#f43f5e",
  },
];

/**
 * Extract active design system tokens from project code
 */
export function extractDesignSystem(filesMap: Record<string, string>): ThemePreset {
  const combinedCode = Object.values(filesMap).join("\n");

  if (/bg-emerald-600/i.test(combinedCode)) {
    return PRESET_THEMES[1];
  } else if (/bg-indigo-600/i.test(combinedCode)) {
    return PRESET_THEMES[2];
  } else if (/bg-purple-600/i.test(combinedCode)) {
    return PRESET_THEMES[3];
  } else if (/bg-amber-600/i.test(combinedCode)) {
    return PRESET_THEMES[4];
  } else if (/bg-rose-600/i.test(combinedCode)) {
    return PRESET_THEMES[5];
  }

  return PRESET_THEMES[0]; // Default Modern Dark SaaS
}

/**
 * Apply design system theme globally across all project pages
 */
export function applyDesignSystemToCode(
  filesMap: Record<string, string>,
  targetTheme: ThemePreset
): Record<string, string> {
  const updatedFilesMap: Record<string, string> = { ...filesMap };

  for (const [filePath, content] of Object.entries(filesMap)) {
    const isCodeFile = /\.(html|htm|jsx|tsx|vue|svelte|js|ts)$/i.test(filePath);
    if (!isCodeFile) continue;

    let modified = content;

    // Replace primary background button/badge colors
    modified = modified.replace(/\bbg-(blue|indigo|purple|emerald|amber|red|rose)-600\b/g, targetTheme.primaryBg);
    modified = modified.replace(/\bhover:bg-(blue|indigo|purple|emerald|amber|red|rose)-500\b/g, targetTheme.primaryHoverBg);
    modified = modified.replace(/\btext-(blue|indigo|purple|emerald|amber|red|rose)-400\b/g, targetTheme.primaryText);

    // Replace border radiuses
    modified = modified.replace(/\brounded-(none|sm|md|lg|xl|2xl|3xl)\b/g, targetTheme.borderRadius);

    updatedFilesMap[filePath] = modified;
  }

  return updatedFilesMap;
}
