import { detectHtmlPages } from "./pageNavigator";
import { detectErrors, autoFixErrors, DetectedIssue } from "./errorDetectionEngine";

export type TestStatus = "passed" | "failed" | "warning";

export interface TestIssue {
  id: string;
  category: string;
  filePath: string;
  description: string;
  recommendation: string;
  lineNumber?: number;
  snippet?: string;
  severity?: "critical" | "warning" | "info";
}

export interface TestCategory {
  id: string;
  name: string;
  status: TestStatus;
  passedCount: number;
  totalCount: number;
  details: string;
}

export interface TestSuiteResult {
  passed: boolean;
  scorePercent: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  categories: TestCategory[];
  issues: TestIssue[];
  executedAt: string;
}

/**
 * AI Testing Agent Engine: Runs automated QA testing suites across 6 core domains
 */
export async function runProjectTestSuite(filesMap: Record<string, string>): Promise<TestSuiteResult> {
  const categories: TestCategory[] = [];
  const issues: TestIssue[] = [];
  const htmlPages = detectHtmlPages(filesMap);

  let totalTests = 0;
  let passedTests = 0;

  // 1. Static Code Analysis & Syntax Audit
  const staticErrors: DetectedIssue[] = detectErrors(filesMap);
  const syntaxFailures = staticErrors.filter(
    (e) => e.type === "json_syntax" || e.type === "css_syntax" || e.type === "unclosed_tag" || e.type === "missing_root"
  );
  
  for (const err of staticErrors) {
    issues.push({
      id: err.id,
      category: "Code Syntax & HTML Structure",
      filePath: err.filePath,
      description: err.message,
      recommendation: err.recommendation || "Fix code syntax error.",
      lineNumber: err.lineNumber,
      snippet: err.snippet,
      severity: err.severity,
    });
  }

  const syntaxTotal = Math.max(1, Object.keys(filesMap).length);
  const syntaxPassed = Math.max(0, syntaxTotal - syntaxFailures.length);
  totalTests += syntaxTotal;
  passedTests += syntaxPassed;

  categories.push({
    id: "syntax",
    name: "Code Syntax & Structure",
    status: syntaxFailures.length === 0 ? "passed" : "failed",
    passedCount: syntaxPassed,
    totalCount: syntaxTotal,
    details: `Scanned ${syntaxTotal} files for JSON/CSS syntax & HTML tags.`,
  });

  // 2. Pages & Routes Audit
  let pagePassed = 0;
  const pageTotal = Math.max(1, htmlPages.length);
  for (const page of htmlPages) {
    if (filesMap[page.path] && filesMap[page.path].trim().length > 50) {
      pagePassed++;
    } else {
      issues.push({
        id: `page-empty-${page.path}`,
        category: "Pages & Routes",
        filePath: page.path,
        description: `Page ${page.path} is empty or unrendered (< 50 bytes).`,
        recommendation: "Ensure HTML page contains valid body structure and content.",
        lineNumber: 1,
        severity: "warning",
      });
    }
  }
  totalTests += pageTotal;
  passedTests += pagePassed;
  categories.push({
    id: "pages",
    name: "Pages & Routes Audit",
    status: pagePassed === pageTotal ? "passed" : "failed",
    passedCount: pagePassed,
    totalCount: pageTotal,
    details: `Tested ${htmlPages.length} registered HTML page routes.`,
  });

  // 3. Navigation Link Integrity Test
  let navPassed = 0;
  let navTotal = 0;
  const validRoutes = new Set(htmlPages.map((p) => p.path.toLowerCase()));

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (!filePath.endsWith(".html") && !filePath.endsWith(".htm")) continue;
    const matches = Array.from(content.matchAll(/<a\s+[^>]*\bhref=["']([^"']+)["'][^>]*>/gi));
    for (const match of matches) {
      const href = match[1];
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        continue;
      }
      navTotal++;
      const cleanHref = href.startsWith("/") ? href.slice(1) : href;
      if (validRoutes.has(cleanHref.toLowerCase())) {
        navPassed++;
      }
    }
  }

  if (navTotal === 0) {
    navTotal = 1;
    navPassed = 1;
  }
  totalTests += navTotal;
  passedTests += navPassed;
  categories.push({
    id: "navigation",
    name: "Navigation & Link Integrity",
    status: navPassed === navTotal ? "passed" : "warning",
    passedCount: navPassed,
    totalCount: navTotal,
    details: `Verified ${navTotal} internal navigation link targets.`,
  });

  // 4. Form Validation & Input Test
  let formPassed = 0;
  let formTotal = 0;
  for (const [filePath, content] of Object.entries(filesMap)) {
    if (!filePath.endsWith(".html") && !filePath.endsWith(".htm")) continue;
    if (/<form/i.test(content)) {
      formTotal++;
      const hasSubmitBtn = /type=["']submit["']|<button/i.test(content);

      if (hasSubmitBtn) {
        formPassed++;
      } else {
        issues.push({
          id: `form-val-${filePath}`,
          category: "Form Validation",
          filePath,
          description: `Form element in ${filePath} is missing a submit button or submit input.`,
          recommendation: "Add a <button type=\"submit\"> to process form submissions.",
          lineNumber: 1,
          severity: "warning",
        });
      }
    }
  }

  if (formTotal === 0) {
    formTotal = 1;
    formPassed = 1;
  }
  totalTests += formTotal;
  passedTests += formPassed;
  categories.push({
    id: "forms",
    name: "Form Validation & Inputs",
    status: formPassed === formTotal ? "passed" : "warning",
    passedCount: formPassed,
    totalCount: formTotal,
    details: `Audited ${formTotal} form element inputs & submission buttons.`,
  });

  // 5. Responsive Mobile Layout Test
  let respPassed = 0;
  const respTotal = Math.max(1, htmlPages.length);
  for (const page of htmlPages) {
    const content = filesMap[page.path] || "";
    const hasViewport = /name=["']viewport["']/i.test(content);
    const hasResponsiveClasses = /md:|lg:|sm:|grid|flex/i.test(content);

    if (hasViewport && hasResponsiveClasses) {
      respPassed++;
    } else {
      issues.push({
        id: `resp-mobile-${page.path}`,
        category: "Mobile Responsiveness",
        filePath: page.path,
        description: `Page ${page.path} is missing viewport meta tag or responsive layout utilities.`,
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> in <head>.',
        lineNumber: 1,
        severity: "warning",
      });
    }
  }

  totalTests += respTotal;
  passedTests += respPassed;
  categories.push({
    id: "responsive",
    name: "Mobile Responsiveness Audit",
    status: respPassed === respTotal ? "passed" : "failed",
    passedCount: respPassed,
    totalCount: respTotal,
    details: `Checked viewport meta tags & mobile layout rules.`,
  });

  // 6. Accessibility & Media Assets Test
  let accPassed = 0;
  let accTotal = 0;
  for (const [filePath, content] of Object.entries(filesMap)) {
    if (!filePath.endsWith(".html") && !filePath.endsWith(".htm")) continue;
    const imgs = Array.from(content.matchAll(/<img\s+([^>]*)\/?>/gi));
    for (const match of imgs) {
      accTotal++;
      if (/alt=["']/i.test(match[0])) {
        accPassed++;
      }
    }
  }

  if (accTotal === 0) {
    accTotal = 1;
    accPassed = 1;
  }
  totalTests += accTotal;
  passedTests += accPassed;
  categories.push({
    id: "accessibility",
    name: "Accessibility & Media Audit",
    status: accPassed === accTotal ? "passed" : "warning",
    passedCount: accPassed,
    totalCount: accTotal,
    details: `Verified ${accTotal} image alt tags and accessibility features.`,
  });

  // Deduplicate issues by ID
  const uniqueIssuesMap = new Map<string, TestIssue>();
  for (const issue of issues) {
    if (!uniqueIssuesMap.has(issue.id)) {
      uniqueIssuesMap.set(issue.id, issue);
    }
  }
  const finalIssues = Array.from(uniqueIssuesMap.values());

  const scorePercent = Math.round((passedTests / totalTests) * 100);

  return {
    passed: finalIssues.length === 0,
    scorePercent: Math.min(100, Math.max(0, scorePercent)),
    totalTests,
    passedTests,
    failedTests: Math.max(0, totalTests - passedTests),
    categories,
    issues: finalIssues,
    executedAt: new Date().toLocaleTimeString(),
  };
}

/**
 * AI Testing Agent Auto-Fixer: Fixes identified test failures using static autoFix + smart repair heuristics
 */
export function autoFixTestIssues(
  filesMap: Record<string, string>,
  issues: TestIssue[]
): Record<string, string> {
  // Convert TestIssue to DetectedIssue for autoFixErrors engine
  const detectedIssues: DetectedIssue[] = issues.map((i) => ({
    id: i.id,
    filePath: i.filePath,
    type: i.category === "Navigation & Links"
      ? "broken_link"
      : i.category === "Accessibility & Media"
      ? "missing_alt"
      : i.category === "Code Syntax & HTML Structure"
      ? "unclosed_tag"
      : "broken_link",
    message: i.description,
    severity: i.severity || "warning",
    lineNumber: i.lineNumber,
    snippet: i.snippet,
  }));

  const { fixedFilesMap } = autoFixErrors(filesMap, detectedIssues);
  const updatedMap = { ...fixedFilesMap };

  for (const issue of issues) {
    let content = updatedMap[issue.filePath];
    if (!content) continue;

    if (issue.category === "Mobile Responsiveness") {
      if (!content.includes('name="viewport"')) {
        content = content.replace(
          /<head>/i,
          '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
        );
      }
    } else if (issue.category === "Form Validation") {
      if (/<form/i.test(content) && !/type=["']submit["']|<button/i.test(content)) {
        content = content.replace(
          /<\/form>/i,
          '  <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit</button>\n</form>'
        );
      }
    }

    updatedMap[issue.filePath] = content;
  }

  return updatedMap;
}
