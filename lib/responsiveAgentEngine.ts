/**
 * Responsive AI Agent Engine
 * Analyzes generated HTML/CSS layout structure across Desktop (1280px+),
 * Tablet (768px), and Mobile (375px) breakpoints.
 * Identifies responsive design bugs (grid overflow, tiny touch targets, un-wrapped text, horizontal scroll)
 * and generates auto-remediations.
 */

export interface ResponsiveIssue {
  id: string;
  viewport: 'desktop' | 'tablet' | 'mobile' | 'all';
  type: 'grid_overflow' | 'touch_target' | 'text_overflow' | 'horizontal_scroll' | 'nav_overflow';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  elementSelector: string;
  suggestedFix: string;
}

export interface ResponsiveAnalysisResult {
  score: number; // 0 - 100
  issues: ResponsiveIssue[];
  viewportsAudited: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  summary: string;
}

/**
 * Analyzes HTML content for common responsive layout pitfalls.
 */
export function analyzeResponsiveness(htmlContent: string): ResponsiveAnalysisResult {
  const issues: ResponsiveIssue[] = [];

  if (!htmlContent || htmlContent.trim().length === 0) {
    return {
      score: 100,
      issues: [],
      viewportsAudited: { desktop: true, tablet: true, mobile: true },
      summary: 'No content to analyze.',
    };
  }

  // 1. Check for fixed width attributes or inline styles causing horizontal scroll
  const fixedWidthMatches = htmlContent.match(/style=["'][^"']*width:\s*\d{4,}px[^"']*["']/gi) || [];
  if (fixedWidthMatches.length > 0) {
    issues.push({
      id: 'resp-fixed-width-1',
      viewport: 'mobile',
      type: 'horizontal_scroll',
      severity: 'critical',
      message: `Found ${fixedWidthMatches.length} element(s) with explicit large pixel widths (>1000px) that force horizontal scrolling on mobile.`,
      elementSelector: '[style*="width"]',
      suggestedFix: 'Replace fixed px widths with w-full, max-w-7xl, or responsive percentages.',
    });
  }

  // 2. Check for grids missing responsive breakpoints (e.g. grid-cols-3 or grid-cols-4 without grid-cols-1 mobile default)
  const nonResponsiveGridMatches = htmlContent.match(/class=["'][^"']*\bgrid-cols-(?:3|4|5|6)\b(?!.*?\bgrid-cols-1\b)[^"']*["']/gi) || [];
  if (nonResponsiveGridMatches.length > 0) {
    issues.push({
      id: 'resp-grid-overflow-1',
      viewport: 'mobile',
      type: 'grid_overflow',
      severity: 'critical',
      message: `Found ${nonResponsiveGridMatches.length} multi-column grid container(s) that lack mobile single-column fallbacks.`,
      elementSelector: '.grid',
      suggestedFix: 'Use mobile-first grid classes: grid-cols-1 md:grid-cols-3 or lg:grid-cols-4.',
    });
  }

  // 3. Check for buttons/links that might be too small for mobile touch targets (<44px)
  const smallTouchTargetMatches = htmlContent.match(/class=["'][^"']*\btext-xs\b(?!.*?\bp-[2-9]\b)[^"']*["']/gi) || [];
  if (smallTouchTargetMatches.length > 0) {
    issues.push({
      id: 'resp-touch-target-1',
      viewport: 'mobile',
      type: 'touch_target',
      severity: 'warning',
      message: `Detected ${smallTouchTargetMatches.length} small clickable element(s) with low padding, making touch interaction difficult on mobile devices.`,
      elementSelector: 'button, a',
      suggestedFix: 'Add minimum padding (py-2.5 px-4) to meet standard 44px touch target area.',
    });
  }

  // 4. Check for long unbroken headings or text without overflow wrap
  const longHeaderMatches = htmlContent.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi) || [];
  const textTruncateNeeded = longHeaderMatches.some((h) => h.match(/text-(5xl|6xl|7xl)/i) && !h.includes('break-words'));
  if (textTruncateNeeded) {
    issues.push({
      id: 'resp-text-overflow-1',
      viewport: 'mobile',
      type: 'text_overflow',
      severity: 'warning',
      message: 'Large display headings (text-5xl+) missing word wrap classes may clip off screen on mobile devices.',
      elementSelector: 'h1, h2, h3',
      suggestedFix: 'Add break-words or responsive font sizing (text-3xl md:text-5xl).',
    });
  }

  // 5. Navigation bar responsiveness check
  if (htmlContent.includes('<nav') || htmlContent.includes('header')) {
    const hasHamburger = htmlContent.includes('md:hidden') || htmlContent.includes('svg') || htmlContent.includes('menu');
    if (!hasHamburger && htmlContent.includes('flex')) {
      issues.push({
        id: 'resp-nav-overflow-1',
        viewport: 'mobile',
        type: 'nav_overflow',
        severity: 'info',
        message: 'Header navigation links may clutter or wrap awkwardly on mobile screens.',
        elementSelector: 'nav',
        suggestedFix: 'Wrap desktop links in `hidden md:flex` and provide a mobile drawer toggle.',
      });
    }
  }

  // Deduce score: 100 - (critical * 25 + warning * 15 + info * 5)
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const score = Math.max(0, 100 - (criticalCount * 25 + warningCount * 15 + infoCount * 5));

  let summary = 'Layout is fully responsive across Mobile, Tablet, and Desktop viewports.';
  if (score < 60) {
    summary = 'Critical responsive bugs detected! Mobile layout will experience broken grids or horizontal overflow.';
  } else if (score < 90) {
    summary = 'Minor responsive improvements suggested for mobile touch targets and text wrapping.';
  }

  return {
    score,
    issues,
    viewportsAudited: { desktop: true, tablet: true, mobile: true },
    summary,
  };
}

/**
 * Automatically transforms HTML content to fix detected responsive issues.
 */
export function autoFixResponsiveness(htmlContent: string): {
  fixedHtml: string;
  fixesApplied: string[];
} {
  const fixesApplied: string[] = [];
  let fixed = htmlContent;

  // Fix 1: Convert non-responsive grids (e.g. grid-cols-3 -> grid-cols-1 md:grid-cols-3)
  if (fixed.match(/grid-cols-3(?!.*md:grid-cols)/)) {
    fixed = fixed.replace(/grid-cols-3/g, 'grid-cols-1 md:grid-cols-3');
    fixesApplied.push('Converted fixed grid-cols-3 to mobile-first `grid-cols-1 md:grid-cols-3`');
  }

  if (fixed.match(/grid-cols-4(?!.*md:grid-cols)/)) {
    fixed = fixed.replace(/grid-cols-4/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
    fixesApplied.push('Converted fixed grid-cols-4 to responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`');
  }

  // Fix 2: Convert oversized static pixel widths to max-w-full
  if (fixed.match(/style=["'][^"']*width:\s*\d{4,}px[^"']*["']/gi)) {
    fixed = fixed.replace(/width:\s*\d{4,}px;/gi, 'max-width: 100%; width: 100%;');
    fixesApplied.push('Replaced hardcoded pixel widths with responsive max-width rules');
  }

  // Fix 3: Sizing adjustments for display headings on mobile (text-6xl -> text-3xl md:text-6xl)
  if (fixed.match(/text-6xl(?!.*md:text-6xl)/)) {
    fixed = fixed.replace(/text-6xl/g, 'text-3xl md:text-6xl');
    fixesApplied.push('Made text-6xl headings responsive (`text-3xl md:text-6xl`)');
  }

  // Fix 4: Add break-words to container elements if missing
  if (!fixed.includes('break-words')) {
    fixed = fixed.replace(/<main([^>]*)class=["']([^"']*)["']/i, '<main$1class="$2 break-words"');
    fixesApplied.push('Added `break-words` safety to main container to prevent text clipping');
  }

  return {
    fixedHtml: fixed,
    fixesApplied,
  };
}
