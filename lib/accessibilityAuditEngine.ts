export type AccessibilityStatus = "PASS" | "WARNING" | "FAIL" | "MANUAL REVIEW REQUIRED";
export type AccessibilitySeverity = "critical" | "warning" | "info";

export interface AccessibilityFinding {
  id: string;
  category: "accessibility";
  status: AccessibilityStatus;
  severity: AccessibilitySeverity;
  filePath: string;
  lineNumber?: number;
  wcagRule: string; // e.g. WCAG 1.1.1 Non-text Content
  evidence: string;
  recommendation: string;
  suggestedFix?: string;
}

export interface AccessibilityAuditReport {
  scorePercent: number;
  totalChecks: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  manualReviewCount: number;
  findings: AccessibilityFinding[];
}

function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split("\n").length;
}

/**
 * AI Accessibility Audit Engine: Performs WCAG 2.1 AA compliant checks
 */
export function runAccessibilityAudit(filesMap: Record<string, string>): AccessibilityAuditReport {
  const findings: AccessibilityFinding[] = [];
  let totalChecks = 0;
  let passedCount = 0;
  let warningCount = 0;
  let failedCount = 0;
  let manualReviewCount = 0;

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (!filePath.endsWith(".html") && !filePath.endsWith(".htm")) continue;

    // 1. Check <html lang="..."> (WCAG 3.1.1 Language of Page)
    totalChecks++;
    if (!/<html\s+[^>]*\blang=["']([a-z]{2}(-[A-Z]{2})?)["'][^>]*>/i.test(content)) {
      failedCount++;
      findings.push({
        id: `${filePath}-missing-lang`,
        category: "accessibility",
        status: "FAIL",
        severity: "critical",
        filePath,
        lineNumber: 1,
        wcagRule: "WCAG 3.1.1 Language of Page (Level A)",
        evidence: `<html> element in ${filePath} is missing a valid lang attribute.`,
        recommendation: 'Add lang="en" to the top-level <html> element for screen reader pronunciation.',
        suggestedFix: '<html lang="en">',
      });
    } else {
      passedCount++;
    }

    // 2. Check <img> alt attributes (WCAG 1.1.1 Non-text Content)
    const imgMatches = Array.from(content.matchAll(/<img\s+([^>]*)\/?>/gi));
    for (const match of imgMatches) {
      totalChecks++;
      const tag = match[0];
      const lineNum = getLineNumber(content, match.index ?? 0);

      if (!/alt=["']/i.test(tag)) {
        failedCount++;
        findings.push({
          id: `${filePath}-img-alt-${lineNum}`,
          category: "accessibility",
          status: "FAIL",
          severity: "critical",
          filePath,
          lineNumber: lineNum,
          wcagRule: "WCAG 1.1.1 Non-text Content (Level A)",
          evidence: `Image tag missing alt attribute: ${tag.slice(0, 50)}`,
          recommendation: 'Add a descriptive alt="Text explanation" attribute, or alt="" if purely decorative.',
          suggestedFix: tag.replace("<img ", '<img alt="Descriptive graphic text" '),
        });
      } else {
        passedCount++;
      }
    }

    // 3. Check Buttons Accessible Name (WCAG 4.1.2 Name, Role, Value)
    const buttonMatches = Array.from(content.matchAll(/<button\s*([^>]*)>([\s\S]*?)<\/button>/gi));
    for (const match of buttonMatches) {
      totalChecks++;
      const attrs = match[1];
      const innerText = match[2].replace(/<[^>]*>/g, "").trim();
      const hasAriaLabel = /aria-label=["']([^"']+)["']/i.test(attrs) || /aria-labelledby=["']/i.test(attrs);
      const lineNum = getLineNumber(content, match.index ?? 0);

      if (!innerText && !hasAriaLabel) {
        failedCount++;
        findings.push({
          id: `${filePath}-button-name-${lineNum}`,
          category: "accessibility",
          status: "FAIL",
          severity: "critical",
          filePath,
          lineNumber: lineNum,
          wcagRule: "WCAG 4.1.2 Name, Role, Value (Level A)",
          evidence: `<button> element has no inner text or aria-label attribute.`,
          recommendation: 'Provide readable button text or add an aria-label="Action name" attribute.',
          suggestedFix: `<button ${attrs} aria-label="Submit action">`,
        });
      } else {
        passedCount++;
      }
    }

    // 4. Check Form Input Labels (WCAG 1.3.1 Info and Relationships / 3.3.2 Labels or Instructions)
    const inputMatches = Array.from(content.matchAll(/<input\s+([^>]*)\/?>/gi));
    for (const match of inputMatches) {
      const attrs = match[1];
      const lineNum = getLineNumber(content, match.index ?? 0);
      const inputIdMatch = attrs.match(/id=["']([^"']+)["']/i);
      const inputId = inputIdMatch ? inputIdMatch[1] : null;

      // Skip hidden, submit, button, reset inputs
      if (/type=["'](hidden|submit|button|reset|image)["']/i.test(attrs)) continue;

      totalChecks++;
      const hasAriaLabel = /aria-label=["']([^"']+)["']/i.test(attrs) || /aria-labelledby=["']/i.test(attrs);
      const hasAssociatedLabel = inputId ? new RegExp(`<label\\s+[^>]*for=["']${inputId}["']`, "i").test(content) : false;

      if (!hasAriaLabel && !hasAssociatedLabel) {
        warningCount++;
        findings.push({
          id: `${filePath}-input-label-${lineNum}`,
          category: "accessibility",
          status: "WARNING",
          severity: "warning",
          filePath,
          lineNumber: lineNum,
          wcagRule: "WCAG 3.3.2 Labels or Instructions (Level A)",
          evidence: `<input> element is missing a connected <label for="..."> or aria-label attribute.`,
          recommendation: "Ensure every form input has an accessible label for screen readers.",
          suggestedFix: inputId
            ? `<label for="${inputId}">Input Label</label>`
            : `<input ${attrs} aria-label="Form Input">`,
        });
      } else {
        passedCount++;
      }
    }

    // 5. Check Non-Descriptive Link Text (WCAG 2.4.4 Link Purpose)
    const linkMatches = Array.from(content.matchAll(/<a\s+[^>]*>([\s\S]*?)<\/a>/gi));
    for (const match of linkMatches) {
      const linkText = match[1].replace(/<[^>]*>/g, "").trim().toLowerCase();
      const lineNum = getLineNumber(content, match.index ?? 0);

      if (["click here", "read more", "more", "link", "here", "learn more"].includes(linkText)) {
        totalChecks++;
        warningCount++;
        findings.push({
          id: `${filePath}-generic-link-${lineNum}`,
          category: "accessibility",
          status: "WARNING",
          severity: "warning",
          filePath,
          lineNumber: lineNum,
          wcagRule: "WCAG 2.4.4 Link Purpose (In Context) (Level A)",
          evidence: `Link uses generic anchor text "${linkText}".`,
          recommendation: "Use meaningful link text describing the target destination.",
        });
      }
    }

    // 6. Check Duplicate IDs (WCAG 4.1.1 Parsing)
    const idMatches = Array.from(content.matchAll(/id=["']([^"']+)["']/gi));
    const seenIds = new Map<string, number>();
    for (const match of idMatches) {
      const idVal = match[1];
      const lineNum = getLineNumber(content, match.index ?? 0);
      if (seenIds.has(idVal)) {
        totalChecks++;
        failedCount++;
        findings.push({
          id: `${filePath}-dup-id-${idVal}`,
          category: "accessibility",
          status: "FAIL",
          severity: "critical",
          filePath,
          lineNumber: lineNum,
          wcagRule: "WCAG 4.1.1 Parsing (Level A)",
          evidence: `Duplicate HTML id="${idVal}" found at line ${lineNum} (first seen at line ${seenIds.get(idVal)}).`,
          recommendation: "HTML id attributes must be unique across the document.",
        });
      } else {
        seenIds.set(idVal, lineNum);
      }
    }

    // 7. Check <iframe> missing title (WCAG 4.1.2)
    const iframeMatches = Array.from(content.matchAll(/<iframe\s+([^>]*)\/?>/gi));
    for (const match of iframeMatches) {
      totalChecks++;
      const attrs = match[1];
      const lineNum = getLineNumber(content, match.index ?? 0);
      if (!/title=["']/i.test(attrs)) {
        failedCount++;
        findings.push({
          id: `${filePath}-iframe-title-${lineNum}`,
          category: "accessibility",
          status: "FAIL",
          severity: "critical",
          filePath,
          lineNumber: lineNum,
          wcagRule: "WCAG 4.1.2 Name, Role, Value (Level A)",
          evidence: `<iframe> element is missing a title attribute.`,
          recommendation: 'Add a title="Descriptive frame content" attribute to all <iframe> tags.',
          suggestedFix: `<iframe ${attrs} title="Embedded content">`,
        });
      } else {
        passedCount++;
      }
    }

    // 8. Check Positive Tabindex (WCAG 2.4.3 Focus Order)
    const tabindexMatches = Array.from(content.matchAll(/tabindex=["']([1-9]\d*)["']/gi));
    for (const match of tabindexMatches) {
      totalChecks++;
      const val = match[1];
      const lineNum = getLineNumber(content, match.index ?? 0);
      warningCount++;
      findings.push({
        id: `${filePath}-positive-tabindex-${lineNum}`,
        category: "accessibility",
        status: "WARNING",
        severity: "warning",
        filePath,
        lineNumber: lineNum,
        wcagRule: "WCAG 2.4.3 Focus Order (Level A)",
        evidence: `Element uses positive tabindex="${val}". Positive tabindex disrupts natural DOM tab order.`,
        recommendation: 'Avoid positive tabindex values; use tabindex="0" or "-1" instead.',
      });
    }

    // 9. Manual Review Check: Color Contrast & Keyboard Traps
    totalChecks++;
    manualReviewCount++;
    findings.push({
      id: `${filePath}-manual-contrast-review`,
      category: "accessibility",
      status: "MANUAL REVIEW REQUIRED",
      severity: "info",
      filePath,
      lineNumber: 1,
      wcagRule: "WCAG 1.4.3 Contrast (Minimum) (Level AA)",
      evidence: "Visual color contrast ratios (text vs background) require visual rendering measurement.",
      recommendation: "Ensure text color achieves at least 4.5:1 contrast ratio against background color.",
    });
  }

  const scorePercent = totalChecks > 0 ? Math.round(((passedCount + warningCount * 0.5) / totalChecks) * 100) : 100;

  return {
    scorePercent: Math.min(100, Math.max(0, scorePercent)),
    totalChecks,
    passedCount,
    warningCount,
    failedCount,
    manualReviewCount,
    findings,
  };
}
