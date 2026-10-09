export interface DesignTokens {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardBackgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingScale: "sm" | "md" | "lg" | "xl";
  spacingScale: "compact" | "normal" | "spacious";
  borderRadius: string;
  shadowStyle: "none" | "soft" | "medium" | "hard" | "glow";
  buttonStyle: "solid" | "gradient" | "pill" | "outline";
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  tokens: DesignTokens;
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  backgroundColor: string;
  cardBg: string;
  borderRadius: string;
  fontFamily: string;
  borderStyle: string;
  accentColor: string;
}

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  primaryColor: "#2563eb",
  secondaryColor: "#4f46e5",
  backgroundColor: "#020617",
  cardBackgroundColor: "#0f172a",
  textColor: "#f8fafc",
  fontFamily: "Inter, sans-serif",
  headingScale: "md",
  spacingScale: "normal",
  borderRadius: "0.75rem",
  shadowStyle: "medium",
  buttonStyle: "gradient",
};

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
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      primaryColor: "#2563eb",
      secondaryColor: "#3b82f6",
      backgroundColor: "#f8fafc",
      cardBackgroundColor: "#ffffff",
      textColor: "#0f172a",
      borderRadius: "0.75rem",
    },
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
    tokens: { ...DEFAULT_DESIGN_TOKENS },
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
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      primaryColor: "#10b981",
      secondaryColor: "#059669",
      borderRadius: "1rem",
    },
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
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      borderRadius: "1rem",
    },
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
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      primaryColor: "#a855f7",
      secondaryColor: "#ec4899",
      backgroundColor: "#000000",
      cardBackgroundColor: "#09090b",
      fontFamily: "ui-monospace, monospace",
      borderRadius: "0.5rem",
    },
  },
];

/**
 * Generates CSS custom properties declaration block for project design tokens
 */
export function generateCssVariables(tokens: DesignTokens): string {
  return `:root {
  --primary-color: ${tokens.primaryColor};
  --secondary-color: ${tokens.secondaryColor};
  --bg-color: ${tokens.backgroundColor};
  --card-bg-color: ${tokens.cardBackgroundColor};
  --text-color: ${tokens.textColor};
  --font-family: ${tokens.fontFamily};
  --border-radius: ${tokens.borderRadius};
  --shadow-style: ${
    tokens.shadowStyle === "glow"
      ? `0 0 25px ${tokens.primaryColor}40`
      : tokens.shadowStyle === "hard"
      ? "0 10px 30px rgba(0,0,0,0.5)"
      : "0 4px 12px rgba(0,0,0,0.15)"
  };
}`;
}

/**
 * Extract active design system tokens from project code
 */
export function extractDesignSystem(filesMap: Record<string, string>): ThemePreset {
  const combinedCode = Object.values(filesMap).join("\n");

  if (/bg-emerald-600/i.test(combinedCode)) {
    return PRESET_THEMES[2];
  } else if (/bg-indigo-600/i.test(combinedCode)) {
    return PRESET_THEMES[3];
  } else if (/bg-purple-600/i.test(combinedCode)) {
    return PRESET_THEMES[4];
  }

  return PRESET_THEMES[1]; // Modern Dark SaaS
}

/**
 * Apply design system theme & tokens globally across all project pages & style sheets
 */
export function applyDesignSystemToCode(
  filesMap: Record<string, string>,
  targetTheme: ThemePreset | DesignTokens
): Record<string, string> {
  const updatedFilesMap: Record<string, string> = { ...filesMap };
  const tokens: DesignTokens = "tokens" in targetTheme ? targetTheme.tokens : targetTheme;
  const cssVars = generateCssVariables(tokens);

  // Update or inject style.css
  let styleCss = updatedFilesMap["style.css"] || updatedFilesMap["styles.css"] || "";
  if (styleCss.includes(":root {")) {
    styleCss = styleCss.replace(/:root\s*\{[\s\S]*?\}/, cssVars);
  } else {
    styleCss = `${cssVars}\n\n${styleCss}`;
  }
  updatedFilesMap["style.css"] = styleCss;

  // Apply Tailwind & inline replacements across HTML/JSX pages
  for (const [filePath, content] of Object.entries(filesMap)) {
    const isCodeFile = /\.(html|htm|jsx|tsx|js|ts)$/i.test(filePath);
    if (!isCodeFile) continue;

    let modified = content;

    // Inject style.css reference in <head> if missing
    if (filePath.endsWith(".html") && !modified.includes("style.css")) {
      modified = modified.replace(
        "</head>",
        '  <link rel="stylesheet" href="style.css">\n</head>'
      );
    }

    if ("primaryBg" in targetTheme) {
      const theme = targetTheme as ThemePreset;
      modified = modified.replace(/\bbg-(blue|indigo|purple|emerald|amber|red|rose)-600\b/g, theme.primaryBg);
      modified = modified.replace(/\bhover:bg-(blue|indigo|purple|emerald|amber|red|rose)-500\b/g, theme.primaryHoverBg);
      modified = modified.replace(/\btext-(blue|indigo|purple|emerald|amber|red|rose)-400\b/g, theme.primaryText);
      modified = modified.replace(/\brounded-(none|sm|md|lg|xl|2xl|3xl)\b/g, theme.borderRadius);
    }

    updatedFilesMap[filePath] = modified;
  }

  return updatedFilesMap;
}
