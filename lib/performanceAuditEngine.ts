export interface AuditIssue {
  id: string;
  category: "performance" | "accessibility" | "best_practices" | "seo";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  fixSuggestion: string;
  filePath?: string;
  lineNumber?: number;
  evidence?: string;
}

export interface PerformanceMetrics {
  totalTransferSizeKB: number;
  totalResourceCount: number;
  imageCount: number;
  scriptCount: number;
  stylesheetCount: number;
  largeInlineAssetsCount: number;
  unmeasuredMetrics: string[]; // e.g. ["Largest Contentful Paint (LCP)", "Cumulative Layout Shift (CLS)"]
}

export interface AuditScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  overall: number;
  metrics?: PerformanceMetrics;
  issues: AuditIssue[];
}

function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split("\n").length;
}

/**
 * Real Performance Audit Engine: Analyzes asset payload, script deferral, image lazy loading & inline bloat
 */
export function runPerformanceAudit(htmlContent: string, filePath?: string): AuditScores {
  const issues: AuditIssue[] = [];

  if (!htmlContent || !htmlContent.trim()) {
    return {
      performance: 100,
      accessibility: 100,
      bestPractices: 100,
      seo: 100,
      overall: 100,
      issues: [],
    };
  }

  // 1. Render-blocking External Scripts
  const unoptimizedScripts = Array.from(
    htmlContent.matchAll(/<script(?![^>]*\b(async|defer)\b)[^>]*src=["']([^"']+)["'][^>]*>/gi)
  );

  for (const match of unoptimizedScripts) {
    const lineNum = getLineNumber(htmlContent, match.index ?? 0);
    issues.push({
      id: `perf-script-defer-${lineNum}`,
      category: "performance",
      title: "Render-blocking external script detected",
      description: `Script tag at line ${lineNum} is loaded without defer or async attribute.`,
      severity: "medium",
      fixSuggestion: 'Add `defer` or `async` attribute to <script src="...">.',
      filePath,
      lineNumber: lineNum,
      evidence: match[0].slice(0, 60),
    });
  }

  // 2. Missing loading="lazy" on images
  const nonLazyImages = Array.from(
    htmlContent.matchAll(/<img(?![^>]*\bloading=["']lazy["'])[^>]*>/gi)
  );

  if (nonLazyImages.length > 2) {
    const firstMatch = nonLazyImages[0];
    const lineNum = getLineNumber(htmlContent, firstMatch.index ?? 0);
    issues.push({
      id: `perf-img-lazy-${lineNum}`,
      category: "performance",
      title: "Images missing loading=\"lazy\" attribute",
      description: `Found ${nonLazyImages.length} image(s) loaded eagerly. Offscreen images should be lazy-loaded.`,
      severity: "medium",
      fixSuggestion: 'Add loading="lazy" to images below the fold.',
      filePath,
      lineNumber: lineNum,
      evidence: `<img loading="lazy" ...>`,
    });
  }

  // 3. Large inline Base64 graphics/images
  const base64Matches = Array.from(htmlContent.matchAll(/data:image\/[a-zA-Z]+;base64,([a-zA-Z0-9+/=]{1000,})/g));
  for (const match of base64Matches) {
    const lineNum = getLineNumber(htmlContent, match.index ?? 0);
    const sizeKB = Math.round((match[1].length * 0.75) / 1024);
    if (sizeKB > 50) {
      issues.push({
        id: `perf-base64-bloat-${lineNum}`,
        category: "performance",
        title: "Large inline Base64 image payload",
        description: `Inline base64 image at line ${lineNum} adds ~${sizeKB}KB to document payload.`,
        severity: "high",
        fixSuggestion: "Extract base64 data into an external image URL (WebP/SVG).",
        filePath,
        lineNumber: lineNum,
        evidence: `Base64 image size: ~${sizeKB}KB`,
      });
    }
  }

  // 4. Large inline <style> blocks (> 5KB)
  const inlineStyleMatches = Array.from(htmlContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi));
  for (const match of inlineStyleMatches) {
    const cssText = match[1];
    const lineNum = getLineNumber(htmlContent, match.index ?? 0);
    const cssSizeKB = Math.round(cssText.length / 1024);

    if (cssSizeKB > 5) {
      issues.push({
        id: `perf-style-bloat-${lineNum}`,
        category: "performance",
        title: "Large inline stylesheet block",
        description: `Inline <style> block at line ${lineNum} is ${cssSizeKB}KB in size.`,
        severity: "medium",
        fixSuggestion: "Move large CSS rules into external stylesheet file (style.css).",
        filePath,
        lineNumber: lineNum,
        evidence: `<style> length: ${cssText.length} bytes`,
      });
    }
  }

  // Deduce scores
  const perfIssues = issues.filter((i) => i.category === "performance").length;
  const performance = Math.max(40, 100 - perfIssues * 15);

  return {
    performance,
    accessibility: 100,
    bestPractices: 100,
    seo: 100,
    overall: performance,
    issues,
  };
}

/**
 * Run audit across all files in the project and calculate real payload metrics
 */
export function runProjectPerformanceAudit(filesMap: Record<string, string>): AuditScores {
  const allIssues: AuditIssue[] = [];
  let totalBytes = 0;
  let totalResourceCount = 0;
  let imageCount = 0;
  let scriptCount = 0;
  let stylesheetCount = 0;
  let largeInlineAssetsCount = 0;

  for (const [fp, content] of Object.entries(filesMap)) {
    totalBytes += content.length;
    totalResourceCount++;

    if (fp.endsWith(".html") || fp.endsWith(".htm")) {
      const res = runPerformanceAudit(content, fp);
      allIssues.push(...res.issues);

      // Count sub-resources
      imageCount += (content.match(/<img[\s>]/gi) || []).length;
      scriptCount += (content.match(/<script[\s>]/gi) || []).length;
      stylesheetCount += (content.match(/<link\s+[^>]*rel=["']stylesheet["']/gi) || []).length;
      largeInlineAssetsCount += (content.match(/data:image\/[a-zA-Z]+;base64/gi) || []).length;
    } else if (fp.endsWith(".js") || fp.endsWith(".ts")) {
      scriptCount++;
    } else if (fp.endsWith(".css")) {
      stylesheetCount++;
    }
  }

  const perfIssuesCount = allIssues.length;
  const performanceScore = Math.max(30, Math.min(100, 100 - perfIssuesCount * 12));

  const metrics: PerformanceMetrics = {
    totalTransferSizeKB: Math.round((totalBytes / 1024) * 10) / 10,
    totalResourceCount,
    imageCount,
    scriptCount,
    stylesheetCount,
    largeInlineAssetsCount,
    unmeasuredMetrics: [
      "Largest Contentful Paint (LCP) - requires live browser session",
      "Cumulative Layout Shift (CLS) - requires live browser session",
      "First Input Delay (FID) - requires live browser session",
    ],
  };

  return {
    performance: performanceScore,
    accessibility: 100,
    bestPractices: 100,
    seo: 100,
    overall: performanceScore,
    metrics,
    issues: allIssues,
  };
}

/**
 * Automatically applies fixes across filesMap for performance issues
 */
export function autoFixProjectAuditIssues(filesMap: Record<string, string>): {
  updatedFilesMap: Record<string, string>;
  fixesApplied: string[];
} {
  const updatedFilesMap = { ...filesMap };
  const fixesApplied: string[] = [];

  for (const [fp, content] of Object.entries(filesMap)) {
    if (!/\.(html|htm)$/i.test(fp)) continue;
    let fixed = content;

    // Fix 1: Add defer to script tags
    if (/<script\s+(?![^>]*\b(async|defer)\b)[^>]*src=/i.test(fixed)) {
      fixed = fixed.replace(/(<script\s+(?![^>]*\b(async|defer)\b)[^>]*src=["'][^"']+["'])/gi, '$1 defer');
      fixesApplied.push(`[${fp}] Added \`defer\` attribute to external script tags`);
    }

    // Fix 2: Add loading="lazy" to <img> elements
    if (/<img(?![^>]*\bloading=)[^>]*>/i.test(fixed)) {
      fixed = fixed.replace(/<img(?![^>]*\bloading=)([^>]*)>/gi, '<img loading="lazy"$1>');
      fixesApplied.push(`[${fp}] Added \`loading="lazy"\` attribute to image elements`);
    }

    updatedFilesMap[fp] = fixed;
  }

  return {
    updatedFilesMap,
    fixesApplied,
  };
}
