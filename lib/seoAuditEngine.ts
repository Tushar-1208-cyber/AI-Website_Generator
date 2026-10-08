import { detectHtmlPages } from "./pageNavigator";

export type AuditSeverity = "critical" | "warning" | "info";

export interface SeoFinding {
  id: string;
  category: "seo";
  severity: AuditSeverity;
  filePath: string;
  lineNumber?: number;
  evidence: string;
  recommendation: string;
  suggestedFix?: string;
}

export interface SeoAuditReport {
  scorePercent: number;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  findings: SeoFinding[];
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
}

function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split("\n").length;
}

/**
 * AI SEO Audit Engine: Audits filesMap for title, meta tags, heading hierarchy, OG/Twitter tags & sitemap
 */
export function runSeoAudit(filesMap: Record<string, string>): SeoAuditReport {
  const findings: SeoFinding[] = [];
  const htmlPages = detectHtmlPages(filesMap);
  const titlesSeen = new Map<string, string>(); // title -> filePath
  const metaDescSeen = new Map<string, string>(); // desc -> filePath

  let totalChecks = 0;
  let passedCount = 0;

  const hasSitemap = Object.keys(filesMap).some((f) => f.toLowerCase() === "sitemap.xml");
  const hasRobotsTxt = Object.keys(filesMap).some((f) => f.toLowerCase() === "robots.txt");

  totalChecks += 2;
  if (hasSitemap) passedCount++;
  else {
    findings.push({
      id: "seo-sitemap-missing",
      category: "seo",
      severity: "info",
      filePath: "sitemap.xml",
      evidence: "sitemap.xml file was not found in project root directory.",
      recommendation: "Create a sitemap.xml file listing all public page URLs to improve search engine indexing.",
      suggestedFix: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n  <url><loc>https://example.com/</loc></url>\n</urlset>",
    });
  }

  if (hasRobotsTxt) passedCount++;
  else {
    findings.push({
      id: "seo-robots-missing",
      category: "seo",
      severity: "info",
      filePath: "robots.txt",
      evidence: "robots.txt file was not found in project root directory.",
      recommendation: "Create a robots.txt file to guide search engine crawlers.",
      suggestedFix: "User-agent: *\nAllow: /",
    });
  }

  for (const [filePath, content] of Object.entries(filesMap)) {
    if (!filePath.endsWith(".html") && !filePath.endsWith(".htm")) continue;

    // 1. Check <title> element
    totalChecks++;
    const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
    if (!titleMatch) {
      findings.push({
        id: `${filePath}-missing-title`,
        category: "seo",
        severity: "critical",
        filePath,
        lineNumber: 1,
        evidence: `Page ${filePath} is missing a <title> element inside <head>.`,
        recommendation: "Add a descriptive <title> tag between 30 to 60 characters long.",
        suggestedFix: "<title>Descriptive Page Title - Brand Name</title>",
      });
    } else {
      const titleText = titleMatch[1].trim();
      const matchIndex = titleMatch.index ?? 0;
      const lineNum = getLineNumber(content, matchIndex);

      if (!titleText) {
        findings.push({
          id: `${filePath}-empty-title`,
          category: "seo",
          severity: "critical",
          filePath,
          lineNumber: lineNum,
          evidence: `<title> tag in ${filePath} is empty.`,
          recommendation: "Provide unique, keywords-relevant title content.",
        });
      } else if (titleText.length > 60) {
        findings.push({
          id: `${filePath}-long-title`,
          category: "seo",
          severity: "warning",
          filePath,
          lineNumber: lineNum,
          evidence: `<title> length (${titleText.length} chars) exceeds recommended limit of 60 characters.`,
          recommendation: "Shorten title tag to prevent truncation in search engine snippet results.",
        });
      } else {
        passedCount++;
      }

      // Check duplicate title
      if (titlesSeen.has(titleText.toLowerCase())) {
        findings.push({
          id: `${filePath}-dup-title`,
          category: "seo",
          severity: "warning",
          filePath,
          lineNumber: lineNum,
          evidence: `Duplicate <title> "${titleText}" shared with ${titlesSeen.get(titleText.toLowerCase())}.`,
          recommendation: "Ensure each HTML page has a unique title.",
        });
      } else {
        titlesSeen.set(titleText.toLowerCase(), filePath);
      }
    }

    // 2. Check meta description
    totalChecks++;
    const metaDescMatch = content.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
      content.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);

    if (!metaDescMatch) {
      findings.push({
        id: `${filePath}-missing-meta-desc`,
        category: "seo",
        severity: "critical",
        filePath,
        lineNumber: 1,
        evidence: `Page ${filePath} is missing <meta name="description"> tag.`,
        recommendation: "Add meta description summarizing page value in 120-160 characters.",
        suggestedFix: '<meta name="description" content="Concise summary of this web page for search engine results.">',
      });
    } else {
      const descText = metaDescMatch[1].trim();
      const lineNum = getLineNumber(content, metaDescMatch.index ?? 0);

      if (!descText) {
        findings.push({
          id: `${filePath}-empty-meta-desc`,
          category: "seo",
          severity: "warning",
          filePath,
          lineNumber: lineNum,
          evidence: `Meta description in ${filePath} has empty content attribute.`,
          recommendation: "Add descriptive text to content attribute.",
        });
      } else if (descText.length > 160) {
        findings.push({
          id: `${filePath}-long-meta-desc`,
          category: "seo",
          severity: "info",
          filePath,
          lineNumber: lineNum,
          evidence: `Meta description length (${descText.length} chars) exceeds 160 characters.`,
          recommendation: "Keep meta descriptions between 120 to 160 characters.",
        });
      } else {
        passedCount++;
      }

      if (metaDescSeen.has(descText.toLowerCase())) {
        findings.push({
          id: `${filePath}-dup-meta-desc`,
          category: "seo",
          severity: "warning",
          filePath,
          lineNumber: lineNum,
          evidence: `Duplicate meta description shared with ${metaDescSeen.get(descText.toLowerCase())}.`,
          recommendation: "Provide unique meta descriptions for each page.",
        });
      } else {
        metaDescSeen.set(descText.toLowerCase(), filePath);
      }
    }

    // 3. Check Viewport Meta Tag
    totalChecks++;
    if (!/name=["']viewport["']/i.test(content)) {
      findings.push({
        id: `${filePath}-missing-viewport`,
        category: "seo",
        severity: "critical",
        filePath,
        lineNumber: 1,
        evidence: `Page ${filePath} is missing <meta name="viewport">.`,
        recommendation: "Add viewport meta tag for mobile responsiveness and SEO indexation.",
        suggestedFix: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      });
    } else {
      passedCount++;
    }

    // 4. Check Open Graph & Twitter Cards
    totalChecks++;
    const hasOgTitle = /property=["']og:title["']/i.test(content);
    const hasOgImage = /property=["']og:image["']/i.test(content);
    if (!hasOgTitle || !hasOgImage) {
      findings.push({
        id: `${filePath}-missing-og-tags`,
        category: "seo",
        severity: "info",
        filePath,
        lineNumber: 1,
        evidence: `Page ${filePath} lacks complete Open Graph social tags (og:title / og:image).`,
        recommendation: "Add og:title, og:description, and og:image tags for rich social media sharing.",
        suggestedFix: '<meta property="og:title" content="Page Title">\n<meta property="og:image" content="https://example.com/og-image.png">',
      });
    } else {
      passedCount++;
    }

    // 5. Check Canonical Link Tag
    totalChecks++;
    if (!/rel=["']canonical["']/i.test(content)) {
      findings.push({
        id: `${filePath}-missing-canonical`,
        category: "seo",
        severity: "info",
        filePath,
        lineNumber: 1,
        evidence: `Page ${filePath} does not include a canonical link tag (<link rel="canonical">).`,
        recommendation: "Add canonical link to prevent duplicate content indexing penalties.",
        suggestedFix: `<link rel="canonical" href="https://example.com/${filePath}">`,
      });
    } else {
      passedCount++;
    }

    // 6. Check Heading Hierarchy (H1 count)
    totalChecks++;
    const h1Matches = Array.from(content.matchAll(/<h1[\s>]/gi));
    if (h1Matches.length === 0) {
      findings.push({
        id: `${filePath}-missing-h1`,
        category: "seo",
        severity: "warning",
        filePath,
        lineNumber: 1,
        evidence: `Page ${filePath} does not contain any <h1> heading element.`,
        recommendation: "Include exactly one main <h1> heading summarizing the main page topic.",
      });
    } else if (h1Matches.length > 1) {
      findings.push({
        id: `${filePath}-multiple-h1`,
        category: "seo",
        severity: "warning",
        filePath,
        lineNumber: getLineNumber(content, h1Matches[1].index ?? 0),
        evidence: `Found ${h1Matches.length} <h1> tags in ${filePath}. Best practice recommends 1 main H1 per page.`,
        recommendation: "Change secondary <h1> headings to <h2> or <h3>.",
      });
    } else {
      passedCount++;
    }

    // 7. Check Semantic HTML structure
    totalChecks++;
    const hasSemanticTag = /<(main|header|footer|nav|article|section)[\s>]/i.test(content);
    if (!hasSemanticTag) {
      findings.push({
        id: `${filePath}-missing-semantic-html`,
        category: "seo",
        severity: "warning",
        filePath,
        lineNumber: 1,
        evidence: `Page ${filePath} relies purely on generic <div> elements without semantic HTML landmarks (<main>, <header>, <nav>).`,
        recommendation: "Wrap primary layout regions in semantic HTML5 tags.",
      });
    } else {
      passedCount++;
    }
  }

  const scorePercent = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 100;

  return {
    scorePercent: Math.min(100, Math.max(0, scorePercent)),
    totalChecks,
    passedCount,
    failedCount: totalChecks - passedCount,
    findings,
    hasSitemap,
    hasRobotsTxt,
  };
}
