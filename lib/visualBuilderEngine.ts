export interface VisualElementStyles {
  fontSize: string; // text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl
  fontWeight: string; // font-normal, font-medium, font-semibold, font-bold, font-extrabold
  textAlign: string; // text-left, text-center, text-right
  textColor: string; // text-slate-100, text-blue-500, text-indigo-400, text-white, etc.
  bgColor: string; // bg-slate-900, bg-blue-600, bg-indigo-600, bg-emerald-600, etc.
  borderRadius: string; // rounded-none, rounded-md, rounded-xl, rounded-2xl, rounded-full
  padding: string; // p-2, p-4, p-6, px-4 py-2
  margin: string; // m-0, m-2, m-4, my-4
  shadow: string; // shadow-none, shadow-sm, shadow-md, shadow-lg, shadow-2xl
  display: string; // block, flex, grid, inline-block
  flexDirection: string; // flex-row, flex-col
  alignItems: string; // items-start, items-center, items-end, items-stretch
  justifyContent: string; // justify-start, justify-center, justify-between, justify-end
  gap: string; // gap-2, gap-4, gap-6
  border: string; // border-none, border, border-2
  borderColor: string; // border-slate-800, border-blue-500, border-transparent
  opacity: string; // opacity-100, opacity-80, opacity-50
}

export const DEFAULT_VISUAL_STYLES: VisualElementStyles = {
  fontSize: "text-base",
  fontWeight: "font-normal",
  textAlign: "text-left",
  textColor: "text-slate-100",
  bgColor: "bg-slate-900",
  borderRadius: "rounded-xl",
  padding: "p-4",
  margin: "m-0",
  shadow: "shadow-md",
  display: "block",
  flexDirection: "flex-col",
  alignItems: "items-start",
  justifyContent: "justify-start",
  gap: "gap-4",
  border: "border-none",
  borderColor: "border-slate-800",
  opacity: "opacity-100",
};

/**
 * Parse existing Tailwind class string into visual style properties
 */
export function parseElementStyles(classNames: string = ""): VisualElementStyles {
  const styles = { ...DEFAULT_VISUAL_STYLES };
  const classes = classNames.split(/\s+/);

  for (const cls of classes) {
    if (/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)$/.test(cls)) styles.fontSize = cls;
    else if (/^font-(thin|normal|medium|semibold|bold|extrabold)$/.test(cls)) styles.fontWeight = cls;
    else if (/^text-(left|center|right|justify)$/.test(cls)) styles.textAlign = cls;
    else if (/^text-(slate|gray|blue|indigo|purple|emerald|amber|red|white)(-\d{2,3})?$/.test(cls) || cls === "text-white") styles.textColor = cls;
    else if (/^bg-(slate|gray|blue|indigo|purple|emerald|amber|red|white|black|transparent)(-\d{2,3})?$/.test(cls)) styles.bgColor = cls;
    else if (/^rounded-(none|sm|md|lg|xl|2xl|3xl|full)$/.test(cls)) styles.borderRadius = cls;
    else if (/^p[xyabtlr]?-\d+$/.test(cls)) styles.padding = cls;
    else if (/^m[xyabtlr]?-\d+$/.test(cls)) styles.margin = cls;
    else if (/^shadow-(none|sm|md|lg|xl|2xl)$/.test(cls)) styles.shadow = cls;
    else if (/^(block|flex|grid|inline-block|hidden)$/.test(cls)) styles.display = cls;
    else if (/^flex-(row|col)$/.test(cls)) styles.flexDirection = cls;
    else if (/^items-(start|center|end|stretch)$/.test(cls)) styles.alignItems = cls;
    else if (/^justify-(start|center|end|between|around|evenly)$/.test(cls)) styles.justifyContent = cls;
    else if (/^gap-\d+$/.test(cls)) styles.gap = cls;
    else if (/^border(-0|-2|-4|-8)?$/.test(cls)) styles.border = cls;
    else if (/^border-(slate|gray|blue|indigo|purple|emerald|amber|red|transparent)(-\d{2,3})?$/.test(cls)) styles.borderColor = cls;
    else if (/^opacity-\d+$/.test(cls)) styles.opacity = cls;
  }

  return styles;
}

/**
 * Build Tailwind CSS class string from visual style properties
 */
export function buildTailwindClasses(styles: VisualElementStyles, existingClassNames: string = ""): string {
  const currentClasses = existingClassNames.split(/\s+/).filter((c) => {
    return !/^(text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|left|center|right)|font-(normal|medium|semibold|bold|extrabold)|bg-[a-z0-9-]+|rounded-[a-z0-9-]+|p[xyabtlr]?-\d+|m[xyabtlr]?-\d+|shadow-[a-z0-9-]+|flex-(row|col)|items-[a-z]+|justify-[a-z]+|gap-\d+|border(-0|-2|-4|-8)?|border-[a-z0-9-]+|opacity-\d+)$/.test(c);
  });

  const updatedList = [
    ...currentClasses,
    styles.fontSize,
    styles.fontWeight,
    styles.textAlign,
    styles.textColor,
    styles.bgColor,
    styles.borderRadius,
    styles.padding,
    styles.margin,
    styles.shadow,
    styles.display,
    styles.border !== "border-none" ? styles.border : "",
    styles.border !== "border-none" ? styles.borderColor : "",
    styles.opacity !== "opacity-100" ? styles.opacity : "",
  ];

  if (styles.display === "flex") {
    updatedList.push(styles.flexDirection);
    updatedList.push(styles.alignItems);
    updatedList.push(styles.justifyContent);
    updatedList.push(styles.gap);
  }

  return Array.from(new Set(updatedList.filter(Boolean))).join(" ");
}

/**
 * Two-Way Code Updater: Modifies element classes in source code filesMap
 */
export function applyVisualStylesToCode(
  filesMap: Record<string, string>,
  targetPath: string,
  tagName: string,
  textSnippet: string,
  updatedStyles: VisualElementStyles
): Record<string, string> {
  const updatedFilesMap = { ...filesMap };
  const content = updatedFilesMap[targetPath];
  if (!content) return filesMap;

  const newClasses = buildTailwindClasses(updatedStyles);

  // Find target element by tag and text snippet or class
  const tagRegex = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  let modifiedContent = content;

  modifiedContent = modifiedContent.replace(tagRegex, (match) => {
    if (match.includes(`class="`)) {
      return match.replace(/class="[^"]*"/, `class="${newClasses}"`);
    } else if (match.includes(`className="`)) {
      return match.replace(/className="[^"]*"/, `className="${newClasses}"`);
    } else {
      return match.replace(`<${tagName}`, `<${tagName} className="${newClasses}"`);
    }
  });

  updatedFilesMap[targetPath] = modifiedContent;
  return updatedFilesMap;
}
