export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primaryBg: string; // e.g. bg-blue-600
  primaryText: string; // e.g. text-blue-400
  backgroundColor: string; // e.g. bg-slate-950
  cardBg: string; // e.g. bg-slate-900
  borderRadius: string; // e.g. rounded-xl
  fontFamily: string; // e.g. font-sans
  borderStyle: string; // e.g. border-slate-800
}

export const PRESET_THEMES: ThemePreset[] = [
  {
    id: "dark-saas",
    name: "Modern Dark SaaS",
    description: "Sleek blue accent with dark slate background (v0 & Framer style)",
    primaryBg: "bg-blue-600",
    primaryText: "text-blue-400",
    backgroundColor: "bg-slate-950",
    cardBg: "bg-slate-900",
    borderRadius: "rounded-xl",
    fontFamily: "font-sans",
    borderStyle: "border-slate-800",
  },
  {
    id: "emerald-corp",
    name: "Emerald Eco Corporate",
    description: "Clean emerald green branding with rounded modern cards",
    primaryBg: "bg-emerald-600",
    primaryText: "text-emerald-400",
    backgroundColor: "bg-slate-950",
    cardBg: "bg-slate-900",
    borderRadius: "rounded-2xl",
    fontFamily: "font-sans",
    borderStyle: "border-emerald-900/40",
  },
  {
    id: "indigo-tech",
    name: "Indigo Premium Tech",
    description: "Deep indigo & purple gradient theme with high contrast",
    primaryBg: "bg-indigo-600",
    primaryText: "text-indigo-400",
    backgroundColor: "bg-slate-950",
    cardBg: "bg-slate-900",
    borderRadius: "rounded-2xl",
    fontFamily: "font-sans",
    borderStyle: "border-indigo-900/40",
  },
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk Neon",
    description: "Vibrant purple & neon accents on pitch black background",
    primaryBg: "bg-purple-600",
    primaryText: "text-purple-400",
    backgroundColor: "bg-black",
    cardBg: "bg-zinc-950",
    borderRadius: "rounded-lg",
    fontFamily: "font-mono",
    borderStyle: "border-purple-500/30",
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
    if (!filePath.endsWith(".html") && !filePath.endsWith(".htm")) continue;

    let modified = content;

    // Replace primary background button/badge colors
    modified = modified.replace(/\bbg-(blue|indigo|purple|emerald|amber|red)-600\b/g, targetTheme.primaryBg);
    modified = modified.replace(/\btext-(blue|indigo|purple|emerald|amber|red)-400\b/g, targetTheme.primaryText);

    // Replace border radiuses
    modified = modified.replace(/\brounded-(none|sm|md|lg|xl|2xl|3xl)\b/g, targetTheme.borderRadius);

    updatedFilesMap[filePath] = modified;
  }

  return updatedFilesMap;
}
