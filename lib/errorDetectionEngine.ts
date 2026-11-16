import { detectHtmlPages } from "./pageNavigator";

export type DetectedIssueSeverity = "critical" | "warning" | "info";

export interface DetectedIssue {
  id: string;
  filePath: string;
  type:
    | "broken_link"
    | "unclosed_tag"
    | "missing_alt"
    | "invalid_script"
    | "empty_src"
    | "json_syntax"
    | "css_syntax"
    | "missing_root";
  message: string;
  severity: DetectedIssueSeverity;
  lineNumber?: number;
  columnNumber?: number;
  snippet?: string;
  recommendation?: string;
}

export interface AutoFixResult {
  fixedFilesMap: Record<string, string>;
  fixedCount: number;
  repairLogs: string[];
}

function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split("\n").length;
}

/**
 * Masks comments, script blocks, and style blocks with whitespace to avoid false positives while preserving line numbers.
 */
function maskCommentsAndScripts(content: string): string {
  const noComments = content.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));
  const noScripts = noComments.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (m, body) =>
    m.replace(body, body.replace(/[^\n]/g, " "))
  );
  return noScripts.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (m, body) =>
    m.replace(body, body.replace(/[^\n]/g, " "))
  );
}

/**
 * AI Error Detection Engine: Deep static analysis scanner for syntax, structure, JSON, CSS & links
 */
export function detectErrors(filesMap: Record<string, string>): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const htmlPages = detectHtmlPages(filesMap);
  const validRoutes = new Set(htmlPages.map((p) => p.path.toLowerCase()));

  // 0. Check for missing root index.html
  const hasIndex = Object.keys(filesMap).some((f) => f.toLowerCase() === "index.html");
  if (!hasIndex && Object.keys(filesMap).length > 0) {
    issues.push({
      id: "root-missing-index",
      filePath: "index.html",
      type: "missing_root",
      message: "Root index.html is missing. Every website project requires an index.html entrypoint.",
      severity: "critical",
      lineNumber: 1,
      recommendation: "Create an index.html file to serve as the homepage entry point.",
    });
  }

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (!content) continue;

    // 1. JSON Syntax Validation
    if (filePath.endsWith(".json")) {
      try {
        JSON.parse(content);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Invalid JSON syntax";
        issues.push({
          id: `${filePath}-json-error`,
          filePath,
          type: "json_syntax",
          message: `JSON Syntax Error: ${errorMsg}`,
          severity: "critical",
          lineNumber: 1,
          snippet: content.slice(0, 100),
          recommendation: "Fix malformed JSON syntax (check trailing commas, quotes, and braces).",
        });
      }
      continue;
    }

    // 2. CSS Syntax Validation
    if (filePath.endsWith(".css")) {
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        issues.push({
          id: `${filePath}-css-braces`,
          filePath,
          type: "css_syntax",
          message: `CSS syntax error: Unbalanced curly braces (Found ${openBraces} '{' vs ${closeBraces} '}').`,
          severity: "critical",
          lineNumber: 1,
          recommendation: "Ensure all CSS rules have matching opening and closing curly braces.",
        });
      }
      continue;
    }

    if (!filePath.endsWith(".html") && !filePath.endsWith(".htm")) continue;

    // 3. Check for broken internal page links (<a href="...">)
    const aTagMatches = content.matchAll(/<a\s+[^>]*\bhref=["']([^"']+)["'][^>]*>/gi);
    for (const match of aTagMatches) {
      const href = match[1];
      const matchIndex = match.index ?? 0;
      const lineNum = getLineNumber(content, matchIndex);

      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        href.startsWith("data:")
      ) {
        continue;
      }

      const cleanHref = href.startsWith("/") ? href.slice(1) : href;
      if (cleanHref && !validRoutes.has(cleanHref.toLowerCase())) {
        issues.push({
          id: `${filePath}-link-${lineNum}-${href}`,
          filePath,
          type: "broken_link",
          message: `Broken internal link: href="${href}" points to a non-existent page.`,
          severity: "warning",
          lineNumber: lineNum,
          snippet: match[0],
          recommendation: `Update href="${href}" to point to a valid relative route like "index.html".`,
        });
      }
    }

    // 4. Check for missing image alt text (<img src="..." /> without alt)
    const imgMatches = content.matchAll(/<img\s+([^>]*)\/?>/gi);
    for (const match of imgMatches) {
      const imgTag = match[0];
      const matchIndex = match.index ?? 0;
      const lineNum = getLineNumber(content, matchIndex);

      if (!/alt=["']/i.test(imgTag)) {
        issues.push({
          id: `${filePath}-img-alt-${lineNum}`,
          filePath,
          type: "missing_alt",
          message: "Accessibility warning: <img> tag is missing an alt attribute.",
          severity: "info",
          lineNumber: lineNum,
          snippet: imgTag.slice(0, 60),
          recommendation: 'Add descriptive alt text to the <img> tag (e.g., alt="Product preview").',
        });
      }

      // Check for empty src
      if (/src=["']\s*["']/i.test(imgTag)) {
        issues.push({
          id: `${filePath}-img-empty-src-${lineNum}`,
          filePath,
          type: "empty_src",
          message: "Image asset error: <img> tag has an empty src attribute.",
          severity: "warning",
          lineNumber: lineNum,
          snippet: imgTag.slice(0, 60),
          recommendation: "Provide a valid image URL or placeholder image source.",
        });
      }
    }

    // 5. Check for missing script or stylesheet references
    const scriptSrcMatches = content.matchAll(/<script\s+[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi);
    for (const match of scriptSrcMatches) {
      const src = match[1];
      const matchIndex = match.index ?? 0;
      const lineNum = getLineNumber(content, matchIndex);

      if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) continue;

      const cleanSrc = src.startsWith("/") ? src.slice(1) : src;
      if (!filesMap[cleanSrc] && !filesMap[cleanSrc.toLowerCase()]) {
        issues.push({
          id: `${filePath}-script-${lineNum}-${src}`,
          filePath,
          type: "invalid_script",
          message: `Script reference error: <script src="${src}"> points to a missing local script file.`,
          severity: "critical",
          lineNumber: lineNum,
          snippet: match[0],
          recommendation: `Ensure local JavaScript file "${src}" exists in the project workspace.`,
        });
      }
    }

    // 6. Check for truncated tags and unclosed structural HTML tags
    const sanitizedHtml = maskCommentsAndScripts(content);

    // 6a. Check if generation cut off mid-tag at the end of the file
    const trailingTruncatedMatch = content.trim().match(/<([a-z0-9-]+)(?:\s+[^>]*)?$/i);
    if (trailingTruncatedMatch) {
      const rawTag = trailingTruncatedMatch[0];
      const tagName = trailingTruncatedMatch[1].toLowerCase();
      const lineNum = getLineNumber(content, content.lastIndexOf(rawTag));

      issues.push({
        id: `${filePath}-truncated-tag`,
        filePath,
        type: "unclosed_tag",
        message: `HTML syntax error: Incomplete or truncated <${tagName}> tag at end of file.`,
        severity: "critical",
        lineNumber: lineNum,
        snippet: rawTag.slice(0, 60),
        recommendation: `Complete and close the truncated <${tagName}> element.`,
      });
    }

    // 6b. Check structural tags with comments/scripts masked to prevent false positives
    const structuralTags = [
      "div",
      "section",
      "article",
      "main",
      "nav",
      "header",
      "footer",
      "form",
      "aside",
      "table",
      "ul",
      "ol",
    ];
    for (const tag of structuralTags) {
      const openMatches = Array.from(sanitizedHtml.matchAll(new RegExp(`<${tag}[\\s>]`, "gi")));
      const closeMatches = Array.from(sanitizedHtml.matchAll(new RegExp(`</${tag}>`, "gi")));

      if (openMatches.length > closeMatches.length) {
        const diff = openMatches.length - closeMatches.length;
        const lastOpen = openMatches[openMatches.length - 1];
        const lineNum = lastOpen ? getLineNumber(content, lastOpen.index ?? 0) : 1;

        issues.push({
          id: `${filePath}-tag-${tag}`,
          filePath,
          type: "unclosed_tag",
          message: `HTML structure error: Found ${openMatches.length} open <${tag}> tags but only ${closeMatches.length} closing </${tag}> tags (${diff} unclosed).`,
          severity: "critical",
          lineNumber: lineNum,
          snippet: lastOpen ? lastOpen[0] : `<${tag}>`,
          recommendation: `Add ${diff} missing closing </${tag}> tag(s) to properly close element(s).`,
        });
      }
    }
  }

  return issues;
}

/**
 * AI Auto-Fix Engine: Automatically repairs detected static issues
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

    if (issue.type === "missing_root") {
      fixedFilesMap["index.html"] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-8">
  <h1 class="text-3xl font-bold">Welcome to Generated Site</h1>
</body>
</html>`;
      repairLogs.push("Generated missing root index.html entrypoint file.");
      fixedCount++;
      continue;
    }

    if (!content) continue;

    if (issue.type === "broken_link" && issue.snippet) {
      const targetHref = Object.keys(filesMap).find((k) => k.endsWith(".html")) || "index.html";
      content = content.replace(issue.snippet, issue.snippet.replace(/href=["'][^"']+["']/i, `href="${targetHref}"`));
      repairLogs.push(`Repaired broken link in ${issue.filePath} at line ${issue.lineNumber || 1} -> redirected to "${targetHref}"`);
      fixedCount++;
    } else if (issue.type === "missing_alt") {
      content = content.replace(/<img\s+((?!alt=)[^>])*\/?>/gi, (match) => {
        if (match.includes("alt=")) return match;
        return match.replace("<img ", '<img alt="Visual content illustration" ');
      });
      repairLogs.push(`Added alt="Visual content illustration" attribute to <img> in ${issue.filePath}`);
      fixedCount++;
    } else if (issue.type === "unclosed_tag") {
      // 1. Repair truncated tag at EOF if present
      const trailingTruncatedMatch = content.trim().match(/<([a-z0-9-]+)(?:\s+[^>]*)?$/i);
      if (trailingTruncatedMatch) {
        const rawTag = trailingTruncatedMatch[0];
        const tagName = trailingTruncatedMatch[1].toLowerCase();
        let fixedTag = rawTag;
        const quoteCount = (fixedTag.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
          fixedTag += '"';
        }
        fixedTag += `></${tagName}>`;
        content = content.replace(rawTag, fixedTag);
        repairLogs.push(`Repaired truncated <${tagName}> tag in ${issue.filePath}`);
        fixedCount++;
      }

      // 2. Extract tag name from issue message or scan structural tags
      const tagMatch = issue.message.match(/<([a-z0-9-]+)>/i);
      const targetTags = tagMatch
        ? [tagMatch[1].toLowerCase()]
        : ["div", "section", "article", "main", "nav", "header", "footer", "form", "aside", "table", "ul", "ol"];

      for (const tagName of targetTags) {
        const sanitized = maskCommentsAndScripts(content);
        const openCount = (sanitized.match(new RegExp(`<${tagName}[\\s>]`, "gi")) || []).length;
        const closeCount = (sanitized.match(new RegExp(`</${tagName}>`, "gi")) || []).length;
        const diff = openCount - closeCount;

        if (diff > 0) {
          const closingTags = Array(diff).fill(`</${tagName}>`).join("\n");
          if (content.includes("</body>")) {
            content = content.replace("</body>", `${closingTags}\n</body>`);
          } else {
            content = content + "\n" + closingTags;
          }
          repairLogs.push(`Appended ${diff} missing closing </${tagName}> tag(s) in ${issue.filePath}`);
          fixedCount += diff;
        }
      }

      // 3. Ensure </body> and </html> exist if <!DOCTYPE or <html is present
      if (/<html[\s>]/i.test(content) && !/<\/body>/i.test(content)) {
        content += "\n</body>";
        repairLogs.push(`Added missing </body> tag in ${issue.filePath}`);
        fixedCount++;
      }
      if (/<html[\s>]/i.test(content) && !/<\/html>/i.test(content)) {
        content += "\n</html>";
        repairLogs.push(`Added missing </html> tag in ${issue.filePath}`);
        fixedCount++;
      }
    } else if (issue.type === "css_syntax") {
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        content += "\n" + "}".repeat(openBraces - closeBraces);
        repairLogs.push(`Added ${openBraces - closeBraces} missing closing brace(s) to ${issue.filePath}`);
        fixedCount++;
      }
    }

    fixedFilesMap[issue.filePath] = content;
  }

  return {
    fixedFilesMap,
    fixedCount,
    repairLogs,
  };
}
