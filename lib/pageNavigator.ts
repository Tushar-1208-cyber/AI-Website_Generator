import { ProjectFilesMap } from "@/types/types";

export interface HtmlPageItem {
  path: string;
  label: string;
}

/**
 * Formats file path into clean display label (e.g. index.html -> Home, pages/about.html -> About Us)
 */
export function formatPageLabel(filePath: string): string {
  const fileName = filePath.split("/").pop() || filePath;
  const baseName = fileName.replace(/\.html?$/i, "").toLowerCase();

  switch (baseName) {
    case "index":
    case "home":
    case "main":
      return "Home";
    case "about":
    case "about-us":
      return "About Us";
    case "contact":
    case "contact-us":
      return "Contact";
    case "services":
    case "service":
      return "Services";
    case "products":
    case "product":
    case "shop":
    case "store":
      return "Shop / Products";
    case "pricing":
    case "plans":
      return "Pricing";
    case "blog":
    case "articles":
      return "Blog";
    case "portfolio":
    case "gallery":
    case "projects":
      return "Portfolio";
    case "faq":
    case "faqs":
      return "FAQ";
    default:
      return baseName.charAt(0).toUpperCase() + baseName.slice(1);
  }
}

/**
 * Detects all HTML pages in project files map.
 */
export function detectHtmlPages(filesMap: ProjectFilesMap): HtmlPageItem[] {
  const htmlFiles = Object.keys(filesMap).filter((k) => k.endsWith(".html") || k.endsWith(".htm"));

  if (htmlFiles.length === 0) {
    return [{ path: "index.html", label: "Home" }];
  }

  // Sort so index.html comes first
  htmlFiles.sort((a, b) => {
    if (a.toLowerCase().includes("index")) return -1;
    if (b.toLowerCase().includes("index")) return 1;
    return a.localeCompare(b);
  });

  return htmlFiles.map((path) => ({
    path,
    label: formatPageLabel(path),
  }));
}

/**
 * Script tag injected into iframe to intercept internal link clicks (<a href="about.html">) and navigate inside parent Playground state.
 */
export const IFRAME_PAGE_ROUTER_SCRIPT = `
<script>
  (function () {
    document.addEventListener('click', function (e) {
      var link = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!link) return;

      var href = link.getAttribute('href');
      if (!href) return;

      // Ignore in-page anchors, external protocols, and javascript: pseudo-protocol
      if (
        href.startsWith('#') ||
        /^(?:https?:|mailto:|tel:|sms:|javascript:|data:)/i.test(href)
      ) {
        return;
      }

      // Internal page link detected (e.g. about.html, contact.html, /pricing.html)
      e.preventDefault();
      var cleanPage = href
        .replace(/^\\.\\//, '')
        .replace(/^\\//, '')
        .split('?')[0]
        .split('#')[0]
        .trim();

      if (cleanPage) {
        console.log('[Multi-Page Router] Navigating to:', cleanPage);
        try {
          window.parent.postMessage({ type: 'NAVIGATE_PAGE', page: cleanPage }, '*');
        } catch (err) {
          console.error('[Multi-Page Router] Message failed:', err);
        }
      }
    }, true);
  })();
</script>`;
