/**
 * Real-Time Performance & Accessibility Audit Engine
 * Performs Lighthouse-grade audits on generated web code for Performance,
 * WCAG 2.1 Accessibility, Best Practices, and SEO.
 * Generates 1-click auto-remediations (alt tags, ARIA attributes, SEO meta).
 */

export interface AuditIssue {
  id: string;
  category: 'performance' | 'accessibility' | 'best_practices' | 'seo';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  fixSuggestion: string;
}

export interface AuditScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  overall: number;
  issues: AuditIssue[];
}

/**
 * Audits HTML code for performance, accessibility, best practices, and SEO.
 */
export function runPerformanceAudit(htmlContent: string): AuditScores {
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

  // 1. Accessibility Checks
  const imgWithoutAlt = (htmlContent.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;
  if (imgWithoutAlt > 0) {
    issues.push({
      id: 'acc-img-alt',
      category: 'accessibility',
      title: 'Image elements missing `alt` attributes',
      description: `Found ${imgWithoutAlt} image(s) lacking descriptive alt text for screen readers.`,
      severity: 'high',
      fixSuggestion: 'Add alt="Descriptive text" to all <img> tags.',
    });
  }

  const buttonWithoutAria = (htmlContent.match(/<button(?![^>]*\baria-label=)[^>]*>\s*<svg/gi) || []).length;
  if (buttonWithoutAria > 0) {
    issues.push({
      id: 'acc-button-aria',
      category: 'accessibility',
      title: 'Icon buttons missing `aria-label`',
      description: `Found ${buttonWithoutAria} icon-only button(s) without text labels or aria-label attributes.`,
      severity: 'high',
      fixSuggestion: 'Add aria-label="Action description" to icon buttons.',
    });
  }

  if (!htmlContent.toLowerCase().includes('lang=')) {
    issues.push({
      id: 'acc-html-lang',
      category: 'accessibility',
      title: '`<html>` element lacks a `lang` attribute',
      description: 'Screen readers use the lang attribute to pronounce text correctly.',
      severity: 'medium',
      fixSuggestion: 'Update to <html lang="en">.',
    });
  }

  // 2. SEO Checks
  if (!htmlContent.toLowerCase().includes('<title>')) {
    issues.push({
      id: 'seo-title',
      category: 'seo',
      title: 'Document does not have a `<title>` element',
      description: 'Titles communicate the purpose of a webpage for search engines.',
      severity: 'high',
      fixSuggestion: 'Add <title>Page Title</title> inside <head>.',
    });
  }

  if (!htmlContent.toLowerCase().includes('name="description"')) {
    issues.push({
      id: 'seo-meta-desc',
      category: 'seo',
      title: 'Document missing meta description',
      description: 'Meta descriptions summarize page content in search engine results.',
      severity: 'medium',
      fixSuggestion: 'Add <meta name="description" content="...">.',
    });
  }

  // 3. Performance Checks
  const unoptimizedScripts = (htmlContent.match(/<script(?![^>]*\b(async|defer)\b)[^>]*src=/gi) || []).length;
  if (unoptimizedScripts > 0) {
    issues.push({
      id: 'perf-script-defer',
      category: 'performance',
      title: 'Render-blocking external scripts detected',
      description: `Found ${unoptimizedScripts} script tag(s) without async or defer attributes.`,
      severity: 'medium',
      fixSuggestion: 'Add `defer` or `async` to external script tags.',
    });
  }

  // 4. Best Practices Checks
  if (!htmlContent.toLowerCase().includes('<!doctype html>')) {
    issues.push({
      id: 'bp-doctype',
      category: 'best_practices',
      title: 'Page lacks standard `<!DOCTYPE html>` declaration',
      description: 'A doctype prevents browsers from switching into quirks mode.',
      severity: 'low',
      fixSuggestion: 'Add <!DOCTYPE html> at the top of the file.',
    });
  }

  // Deduce scores
  const accIssues = issues.filter((i) => i.category === 'accessibility').length;
  const seoIssues = issues.filter((i) => i.category === 'seo').length;
  const perfIssues = issues.filter((i) => i.category === 'performance').length;
  const bpIssues = issues.filter((i) => i.category === 'best_practices').length;

  const accessibility = Math.max(50, 100 - accIssues * 20);
  const seo = Math.max(50, 100 - seoIssues * 25);
  const performance = Math.max(50, 100 - perfIssues * 20);
  const bestPractices = Math.max(50, 100 - bpIssues * 15);

  const overall = Math.round((accessibility + seo + performance + bestPractices) / 4);

  return {
    performance,
    accessibility,
    bestPractices,
    seo,
    overall,
    issues,
  };
}

/**
 * Automatically applies fixes to resolve performance & accessibility audit issues.
 */
export function autoFixAuditIssues(htmlContent: string): {
  fixedHtml: string;
  fixesApplied: string[];
} {
  let fixed = htmlContent;
  const fixesApplied: string[] = [];

  // Fix 1: Add missing lang="en"
  if (!fixed.toLowerCase().includes('lang=')) {
    fixed = fixed.replace(/<html/i, '<html lang="en"');
    fixesApplied.push('Added `lang="en"` attribute to <html> tag');
  }

  // Fix 2: Add alt="" to <img> tags missing alt
  if (fixed.match(/<img(?![^>]*\balt=)[^>]*>/gi)) {
    fixed = fixed.replace(/<img(?![^>]*\balt=)([^>]*)>/gi, '<img alt="AI Generated Graphic"$1>');
    fixesApplied.push('Injected fallback `alt="AI Generated Graphic"` onto image tags');
  }

  // Fix 3: Add aria-label to icon-only buttons
  if (fixed.match(/<button(?![^>]*\baria-label=)[^>]*>\s*<svg/gi)) {
    fixed = fixed.replace(/(<button(?![^>]*\baria-label=)[^>]*>)/gi, '$1'.replace('>', ' aria-label="Interactive Button">'));
    fixesApplied.push('Injected `aria-label="Interactive Button"` onto icon buttons');
  }

  // Fix 4: Add <title> and meta description if missing inside head
  if (!fixed.toLowerCase().includes('<title>')) {
    fixed = fixed.replace(/<head>/i, '<head>\n  <title>AI Web Application</title>\n  <meta name="description" content="Generated with AI Website Generator Pro" />');
    fixesApplied.push('Inserted missing `<title>` and `<meta name="description">` tags into <head>');
  }

  return {
    fixedHtml: fixed,
    fixesApplied,
  };
}
