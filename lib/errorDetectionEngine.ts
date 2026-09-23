import { detectHtmlPages } from "./pageNavigator";

export type DetectedIssueSeverity = "critical" | "warning" | "info";

export interface DetectedIssue {
  id: string;
  filePath: string;
  type: "broken_link" | "unclosed_tag" | "missing_alt" | "invalid_script" | "empty_src";
  message: string;
  severity: DetectedIssueSeverity;
  lineNumber?: number;
  snippet?: string;
}

export interface AutoFixResult {
  fixedFilesMap: Record<string, string>;
  fixedCount: number;
  repairLogs: string[];
}

/**
 * AI Error Detection Engine: Scans project filesMap for syntax, link & asset issues
 */
export function detectErrors(filesMap: Record<string, string>): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const htmlPages = detectHtmlPages(filesMap);
  const validRoutes = new Set(htmlPages.map((p) => p.path.toLowerCase()));

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (!filePath.endsWith(".html") && !filePath.endsWith(".htm")) continue;

    // 1. Check for broken internal links (<a href="something.html">)
    const hrefMatches = content.matchAll(/href=["']([^"']+)["']/gi);
    for (const match of hrefMatches) {
      const href = match[1];
      // Skip external links, anchors (#), mailto, tel, javascript
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        continue;
      }

      const cleanHref = href.startsWith("/") ? href.slice(1) : href;
      if (cleanHref && !validRoutes.has(cleanHref.toLowerCase())) {
        issues.push({
          id: `${filePath}-link-${href}`,
          filePath,
          type: "broken_link",
          message: `Broken internal link detected: href="${href}" points to a non-existent page.`,
          severity: "warning",
          snippet: match[0],
        });
      }
    }

    // 2. Check for missing image alt text (<img src="..." /> without alt)
    const imgMatches = content.matchAll(/<img\s+([^>]*)\/?>/gi);
    for (const match of imgMatches) {
      const imgTag = match[0];
      if (!/alt=["']/i.test(imgTag)) {
        issues.push({
          id: `${filePath}-img-alt-${Math.random().toString(36).substring(2, 6)}`,
          filePath,
          type: "missing_alt",
          message: "Accessibility warning: <img> element is missing an alt attribute.",
          severity: "info",
          snippet: imgTag.slice(0, 40),
        });
      }
    }

    // 3. Check for unclosed HTML tags (simple count check for main structural tags)
    const structuralTags = ["div", "section", "article", "main", "nav"];
    for (const tag of structuralTags) {
      const openCount = (content.match(new RegExp(`<${tag}[\\s>]`, "gi")) || []).length;
      const closeCount = (content.match(new RegExp(`</${tag}>`, "gi")) || []).length;
      if (openCount > closeCount) {
        issues.push({
          id: `${filePath}-tag-${tag}`,
          filePath,
          type: "unclosed_tag",
          message: `HTML syntax warning: Found ${openCount} open <${tag}> tags but only ${closeCount} closing </${tag}> tags.`,
          severity: "critical",
        });
      }
    }
  }

  return issues;
}

/**
 * AI Auto-Fix Engine: Automatically repairs detected issues
 */
export function autoFixErrors(
  filesMap: Record<string, string>,
  issues: DetectedIssue[]
): AutoFixResult {
  const fixedFilesMap: Record<string, string> = { ...filesMap };
  const repairLogs: string[] = [];
  let fixedCount = 0;

  for (const issue of issues) {
    let content = fixedFilesMap[issue.filePath];
    if (!content) continue;

    if (issue.type === "broken_link" && issue.snippet) {
      // Fix broken link by redirecting to index.html or #
      const targetHref = Object.keys(filesMap).find((k) => k.endsWith(".html")) || "index.html";
      content = content.replace(issue.snippet, `href="${targetHref}"`);
      repairLogs.push(`Repaired broken link in ${issue.filePath} -> redirected to "${targetHref}"`);
      fixedCount++;
    } else if (issue.type === "missing_alt") {
      // Add alt="Image description" to <img> tags lacking alt
      content = content.replace(/<img\s+((?!alt=)[^>])*\/?>/gi, (match) => {
        if (match.includes("alt=")) return match;
        return match.replace("<img ", '<img alt="Illustrative image" ');
      });
      repairLogs.push(`Added alt="Illustrative image" attribute to <img> in ${issue.filePath}`);
      fixedCount++;
    } else if (issue.type === "unclosed_tag") {
      // Fix unclosed tag by appending closing tag before </body> or end of file
      const tagMatch = issue.message.match(/<([a-z0-9]+)>/i);
      const tagName = tagMatch ? tagMatch[1] : "div";

      if (content.includes("</body>")) {
        content = content.replace("</body>", `</${tagName}>\n</body>`);
      } else {
        content += `\n</${tagName}>`;
      }
      repairLogs.push(`Appended missing closing </${tagName}> tag in ${issue.filePath}`);
      fixedCount++;
    }

    fixedFilesMap[issue.filePath] = content;
  }

  return {
    fixedFilesMap,
    fixedCount,
    repairLogs,
  };
}
