import { FileTreeNode, FileType, ProjectFilesMap } from "@/types/types";

/**
 * Infer FileType from filename extension.
 */
export function getFileType(filename: string): FileType {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "js":
    case "mjs":
    case "cjs":
      return "js";
    case "ts":
      return "ts";
    case "jsx":
      return "jsx";
    case "tsx":
      return "tsx";
    case "json":
      return "json";
    case "py":
      return "py";
    case "md":
      return "md";
    default:
      return "other";
  }
}

export function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== "string") return html;

  // 1. Check if the HTML contains a nested iframe srcdoc wrapper
  const iframeSrcdocMatch = html.match(/<iframe[^>]*\bsrcdoc=["']([\s\S]*?)["'][^>]*>/i);
  if (iframeSrcdocMatch && iframeSrcdocMatch[1]) {
    let unescaped = iframeSrcdocMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'");
    if (unescaped.includes('<html') || unescaped.includes('<body') || unescaped.includes('<!DOCTYPE')) {
      return unescaped;
    }
  }

  // 2. Remove hallucinated AI Assistant / Playground header elements if present
  let cleaned = html;
  if (/(?:AI ASSISTANT|Gemini 3\.6|REFACTOR:|Type modification request)/i.test(cleaned)) {
    cleaned = cleaned.replace(/<(?:div|header|section|aside)[^>]*>(?:(?!<\/(?:div|header|section|aside)>)[\s\S])*?(?:AI ASSISTANT|Gemini 3\.6|REFACTOR:|Type modification request)[\s\S]*?<\/(?:div|header|section|aside)>/gi, '');
  }

  return cleaned;
}

/**
 * Parses raw text from AI model into a map of filepath -> content.
 * Supports `--- FILE: path/to/file.ext ---` markers.
 * Falls back to treating single HTML output as `index.html`.
 */
export function parseMultiFiles(rawCode: string): ProjectFilesMap {
  if (!rawCode || typeof rawCode !== "string") {
    return { "index.html": "" };
  }

  const trimmed = rawCode.trim();
  const fileDelimiterRegex = /(?:^|\n)---+\s*FILE:\s*([^\n\r-]+?)\s*---+[\r\n]+/gi;

  const filesMap: ProjectFilesMap = {};
  let match: RegExpExecArray | null;
  const matches: { path: string; startIndex: number; headerLength: number }[] = [];

  while ((match = fileDelimiterRegex.exec(trimmed)) !== null) {
    const filePath = match[1].trim();
    matches.push({
      path: filePath,
      startIndex: match.index,
      headerLength: match[0].length,
    });
  }

  if (matches.length === 0) {
    // Legacy single file fallback (strip markdown backticks if present)
    let cleanCode = trimmed;
    cleanCode = cleanCode.replace(/^```html\s*/i, "").replace(/^```\s*/, "");
    cleanCode = cleanCode.replace(/\s*```$/, "");
    cleanCode = sanitizeHtmlContent(cleanCode);
    return { "index.html": cleanCode.trim() };
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const contentStart = current.startIndex + current.headerLength;
    const contentEnd = i + 1 < matches.length ? matches[i + 1].startIndex : trimmed.length;

    let content = trimmed.substring(contentStart, contentEnd).trim();
    // Strip code fence backticks if wrapped inside block
    content = content.replace(/^```[a-z0-9]*\n?/i, "").replace(/\n?```$/i, "").trim();

    if (current.path.endsWith(".html") || current.path.endsWith(".htm")) {
      content = sanitizeHtmlContent(content);
    }

    filesMap[current.path] = content;
  }

  return filesMap;
}

/**
 * Builds a nested FileTreeNode array from a flat map of path -> content.
 */
export function buildFileTree(filesMap: ProjectFilesMap): FileTreeNode[] {
  const rootNodes: FileTreeNode[] = [];

  const sortedPaths = Object.keys(filesMap).sort();

  for (const filePath of sortedPaths) {
    const parts = filePath.split("/").filter(Boolean);
    let currentLevel = rootNodes;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFolder = i < parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let existingNode = currentLevel.find((n) => n.name === part && n.isFolder === isFolder);

      if (!existingNode) {
        existingNode = {
          id: currentPath,
          name: part,
          path: currentPath,
          isFolder,
          type: isFolder ? undefined : getFileType(part),
          children: isFolder ? [] : undefined,
          content: isFolder ? undefined : filesMap[filePath],
        };
        currentLevel.push(existingNode);
      }

      if (isFolder && existingNode.children) {
        currentLevel = existingNode.children;
      }
    }
  }

  // Sort nodes: folders first, then files alphabetically
  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes
      .map((node) => {
        if (node.isFolder && node.children) {
          return { ...node, children: sortNodes(node.children) };
        }
        return node;
      })
      .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
  };

  return sortNodes(rootNodes);
}

/**
 * Serializes ProjectFilesMap back into formatted raw multi-file text.
 */
export function serializeMultiFiles(filesMap: ProjectFilesMap): string {
  const keys = Object.keys(filesMap);
  if (keys.length === 1 && keys[0] === "index.html") {
    return filesMap["index.html"];
  }

  return keys
    .map((path) => `--- FILE: ${path} ---\n${filesMap[path]}`)
    .join("\n\n");
}

/**
 * Bundles multi-file client web code (HTML, CSS, JS) into a single standalone HTML string for the live preview iframe.
 */
export function bundleFilesForPreview(filesMap: ProjectFilesMap): string {
  let mainHtml = filesMap["index.html"] || filesMap["index.htm"];

  if (!mainHtml) {
    // Find any html file
    const htmlKey = Object.keys(filesMap).find((k) => k.endsWith(".html") || k.endsWith(".htm"));
    mainHtml = htmlKey ? filesMap[htmlKey] : "";
  }

  if (!mainHtml) {
    return `<!DOCTYPE html><html><body><div style="padding:2rem;font-family:sans-serif;color:#666;">No HTML file found in project.</div></body></html>`;
  }

  let bundled = mainHtml;

  // Gather all CSS files and inject into head
  const cssFiles = Object.keys(filesMap).filter((k) => k.endsWith(".css"));
  if (cssFiles.length > 0) {
    const cssContent = cssFiles.map((k) => `/* File: ${k} */\n${filesMap[k]}`).join("\n\n");
    const styleTag = `<style>\n${cssContent}\n</style>`;
    if (bundled.includes("</head>")) {
      bundled = bundled.replace("</head>", `${styleTag}\n</head>`);
    } else {
      bundled = styleTag + "\n" + bundled;
    }
  }

  // Inject Mock DB and Fetch API interceptor for backend API calls inside iframe
  const dbFileKey = Object.keys(filesMap).find((k) => k.endsWith("db.json"));
  let mockDbRaw = filesMap[dbFileKey || ""] || "{}";
  try {
    JSON.parse(mockDbRaw);
  } catch {
    mockDbRaw = "{}";
  }

  const fetchInterceptorScript = `
  <script>
    (function () {
      var mockDb = ${mockDbRaw};
      var originalFetch = window.fetch;
      window.fetch = function (url, options) {
        var strUrl = typeof url === 'string' ? url : (url && url.url ? url.url : '');
        var method = (options && options.method ? options.method : 'GET').toUpperCase();

        if (strUrl.indexOf('/api/') !== -1 || strUrl.indexOf('localhost') !== -1 || strUrl.indexOf('127.0.0.1') !== -1) {
          console.log('[Preview Fetch Polyfill]', method, strUrl);
          var match = strUrl.match(/\\/api\\/([^\\/\\?#]+)/);
          var key = match ? match[1] : 'products';

          var responseData = mockDb[key] || mockDb.products || mockDb.items || mockDb.tasks || mockDb.users || [];
          if (typeof responseData === 'string') {
            try { responseData = JSON.parse(responseData); } catch (e) {}
          }

          if (method === 'POST') {
            var bodyObj = {};
            try { if (options && options.body) bodyObj = JSON.parse(options.body); } catch(e){}
            responseData = { message: 'Created successfully', id: Date.now(), item: bodyObj };
          }

          return Promise.resolve(new Response(JSON.stringify(responseData), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' }
          }));
        }

        return originalFetch.apply(this, arguments);
      };
    })();
  </script>`;

  if (bundled.includes("</head>")) {
    bundled = bundled.replace("</head>", `${fetchInterceptorScript}\n</head>`);
  } else {
    bundled = fetchInterceptorScript + "\n" + bundled;
  }

  // Gather all JS files and inject before </body>
  const jsFiles = Object.keys(filesMap).filter((k) => k.endsWith(".js") || k.endsWith(".mjs"));
  if (jsFiles.length > 0) {
    const jsContent = jsFiles
      .map((k) => `// File: ${k}\ntry {\n${filesMap[k]}\n} catch (err) { console.error("Error in ${k}:", err); }`)
      .join("\n\n");
    const scriptTag = `<script>\n${jsContent}\n</script>`;
    if (bundled.includes("</body>")) {
      bundled = bundled.replace("</body>", `${scriptTag}\n</body>`);
    } else {
      bundled += "\n" + scriptTag;
    }
  }

  return bundled;
}
