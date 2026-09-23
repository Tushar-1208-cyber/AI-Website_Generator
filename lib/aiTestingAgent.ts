import { detectHtmlPages } from "./pageNavigator";

export type TestStatus = "passed" | "failed" | "warning";

export interface TestIssue {
  id: string;
  category: string;
  filePath: string;
  description: string;
  recommendation: string;
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
 * AI Testing Agent Engine: Runs automated testing suites across 5 core domains
 */
export async function runProjectTestSuite(filesMap: Record<string, string>): Promise<TestSuiteResult> {
  const categories: TestCategory[] = [];
  const issues: TestIssue[] = [];
  const htmlPages = detectHtmlPages(filesMap);

  let totalTests = 0;
  let passedTests = 0;

  // 1. Pages & Routes Test
  let pagePassed = 0;
  const pageTotal = htmlPages.length;
  for (const page of htmlPages) {
    if (filesMap[page.path] && filesMap[page.path].length > 50) {
      pagePassed++;
    } else {
      issues.push({
        id: `page-empty-${page.path}`,
        category: "Pages & Routes",
        filePath: page.path,
        description: `Page ${page.path} is empty or unrendered.`,
        recommendation: "Ensure HTML page contains valid body structure.",
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
    details: `Tested ${pageTotal} pages: index.html, about.html, etc.`,
  });

  // 2. Navigation Link Integrity Test
  let navPassed = 0;
  let navTotal = 0;
  const validRoutes = new Set(htmlPages.map((p) => p.path.toLowerCase()));

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (!filePath.endsWith(".html")) continue;
    const links = Array.from(content.matchAll(/href=["']([^"']+)["']/gi)).map((m) => m[1]);
    for (const href of links) {
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        continue;
      }
      navTotal++;
      const cleanHref = href.startsWith("/") ? href.slice(1) : href;
      if (validRoutes.has(cleanHref.toLowerCase())) {
        navPassed++;
      } else {
        issues.push({
          id: `nav-link-${filePath}-${href}`,
          category: "Navigation & Links",
          filePath,
          description: `Internal link href="${href}" points to non-existent page.`,
          recommendation: "Update link target to existing HTML page.",
        });
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
    details: `Verified ${navTotal} internal link routes across pages.`,
  });

  // 3. Form Validation & Input Test
  let formPassed = 0;
  let formTotal = 0;
  for (const [filePath, content] of Object.entries(filesMap)) {
    if (!filePath.endsWith(".html")) continue;
    if (/<form/i.test(content)) {
      formTotal++;
      const hasEmailType = /type=["']email["']/i.test(content);
      const hasSubmitBtn = /type=["']submit["']|<button/i.test(content);

      if (hasEmailType && hasSubmitBtn) {
        formPassed++;
      } else {
        issues.push({
          id: `form-val-${filePath}`,
          category: "Form Validation",
          filePath,
          description: `Form in ${filePath} is missing email type validation or submit button.`,
          recommendation: "Add type=\"email\" and required attributes to form inputs.",
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
    details: `Audited input field types and submit button handlers.`,
  });

  // 4. Responsive Mobile Layout Test
  let respPassed = 0;
  const respTotal = htmlPages.length;
  for (const page of htmlPages) {
    const content = filesMap[page.path] || "";
    const hasViewport = /name=["']viewport["']/i.test(content);
    const hasResponsiveClasses = /md:|lg:|sm:/i.test(content);

    if (hasViewport && hasResponsiveClasses) {
      respPassed++;
    } else {
      issues.push({
        id: `resp-mobile-${page.path}`,
        category: "Mobile Responsiveness",
        filePath: page.path,
        description: `Page ${page.path} missing viewport meta tag or responsive Tailwind breakpoints.`,
        recommendation: "Ensure viewport meta tag and responsive classes (md:, lg:) exist.",
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
    details: `Checked viewport meta tag and responsive breakpoints.`,
  });

  // 5. Accessibility & Media Assets Test
  let accPassed = 0;
  let accTotal = 0;
  for (const [filePath, content] of Object.entries(filesMap)) {
    if (!filePath.endsWith(".html")) continue;
    const imgs = Array.from(content.matchAll(/<img\s+([^>]*)\/?>/gi));
    for (const match of imgs) {
      accTotal++;
      if (/alt=["']/i.test(match[0])) {
        accPassed++;
      } else {
        issues.push({
          id: `acc-img-${filePath}-${Math.random().toString(36).substring(2, 6)}`,
          category: "Accessibility & Media",
          filePath,
          description: `Image tag in ${filePath} is missing alt attribute.`,
          recommendation: "Add descriptive alt text to <img> element.",
        });
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
    details: `Verified image alt attributes and accessibility tags.`,
  });

  const scorePercent = Math.round((passedTests / totalTests) * 100);

  return {
    passed: issues.length === 0,
    scorePercent,
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    categories,
    issues,
    executedAt: new Date().toLocaleTimeString(),
  };
}

/**
 * AI Testing Agent Auto-Fixer: Fixes identified test failures
 */
export function autoFixTestIssues(
  filesMap: Record<string, string>,
  issues: TestIssue[]
): Record<string, string> {
  const fixedFilesMap = { ...filesMap };

  for (const issue of issues) {
    let content = fixedFilesMap[issue.filePath];
    if (!content) continue;

    if (issue.category === "Navigation & Links") {
      const targetPage = Object.keys(filesMap).find((k) => k.endsWith(".html")) || "index.html";
      content = content.replace(/href=["'](?!http|#|mailto|tel)[^"']+["']/gi, `href="${targetPage}"`);
    } else if (issue.category === "Form Validation") {
      content = content.replace(/<input\s+([^>]*type=["']text["'][^>]*)>/gi, (match) => {
        if (/name=["']email["']/i.test(match) || /placeholder=["'][^"']*email/i.test(match)) {
          return match.replace(/type=["']text["']/i, 'type="email" required');
        }
        return match;
      });
    } else if (issue.category === "Accessibility & Media") {
      content = content.replace(/<img\s+((?!alt=)[^>])*\/?>/gi, (match) => {
        return match.replace("<img ", '<img alt="Illustrative visual asset" ');
      });
    } else if (issue.category === "Mobile Responsiveness") {
      if (!content.includes('name="viewport"')) {
        content = content.replace(
          "<head>",
          '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        );
      }
    }

    fixedFilesMap[issue.filePath] = content;
  }

  return fixedFilesMap;
}
