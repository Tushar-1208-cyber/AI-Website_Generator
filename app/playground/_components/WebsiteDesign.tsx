import React, { useState } from 'react';
import {
  Code,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Eye,
  Undo2,
  Redo2,
  FileCode,
} from 'lucide-react';
import JSZip from 'jszip';

interface WebsiteDesignProps {
  generatedCode: string;
  onCodeChange?: (code: string) => void;
  onCodeCommit?: (code: string) => void;
  onCommitCodeChange?: (code: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

type ProjectFile = {
  path: string;
  content: string;
};

function WebsiteDesign({
  generatedCode,
  onCodeChange,
  onCodeCommit,
  onCommitCodeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: WebsiteDesignProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  );
  const [selectedFileName, setSelectedFileName] = useState<string>('index.html');

  const getDeviceWidth = () => {
    switch (device) {
      case 'mobile':
        return 'w-[375px] max-w-full';
      case 'tablet':
        return 'w-[768px] max-w-full';
      case 'desktop':
      default:
        return 'w-full max-w-full';
    }
  };

  const fixMarkdownUrls = (code: string) => {
    return code.replace(
      /\[(https?:\/\/[^\]\s]+)\]\(https?:\/\/[^\)\s]+\)/g,
      '$1'
    );
  };

  const stripFences = (code: string) =>
    code.replace(/```html/gi, '').replace(/```/g, '').trim();

  const parseProjectFiles = (rawCode: string): ProjectFile[] => {
    const normalizedCode = rawCode.replace(/\r\n/g, '\n');
    const marker = /---\s*FILE:\s*([^\r\n]+?)\s*---(?=\s|$)/gi;
    const matches = Array.from(normalizedCode.matchAll(marker));
    if (matches.length === 0) return [];

    return matches.map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < matches.length
        ? (matches[index + 1].index ?? normalizedCode.length)
        : normalizedCode.length;
      const path = match[1].trim().replace(/^[/\\]+/, '').replace(/\\/g, '/');
      const safePath = path.split('/').filter((part) => part && part !== '..' && part !== '.').join('/');
      return {
        path: safePath || `file-${index + 1}.txt`,
        content: normalizedCode.slice(start, end).replace(/^\s*```[a-z0-9+#-]*\s*/i, '').replace(/\s*```\s*$/i, '').trim(),
      };
    });
  };

  const splitSingleHtmlProject = (rawCode: string): ProjectFile[] => {
    const html = fixMarkdownUrls(stripFences(rawCode));
    const styles: string[] = [];
    const scripts: string[] = [];

    const htmlWithoutStyles = html.replace(
      /<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi,
      (_match, content: string) => {
        if (content.trim()) styles.push(content.trim());
        return '';
      }
    );

    const htmlWithoutInlineCode = htmlWithoutStyles.replace(
      /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi,
      (match: string, content: string) => {
        if (/\bsrc\s*=|\btype\s*=\s*["']application\/json["']/i.test(match)) {
          return match;
        }
        if (content.trim()) scripts.push(content.trim());
        return '';
      }
    );

    let indexHtml = htmlWithoutInlineCode.trim();
    if (styles.length > 0) {
      const stylesheetLink = '<link rel="stylesheet" href="css/styles.css">';
      indexHtml = /<\/head>/i.test(indexHtml)
        ? indexHtml.replace(/<\/head>/i, `${stylesheetLink}\n</head>`)
        : `${stylesheetLink}\n${indexHtml}`;
    }
    if (scripts.length > 0) {
      const scriptTag = '<script src="js/main.js" defer></script>';
      indexHtml = /<\/body>/i.test(indexHtml)
        ? indexHtml.replace(/<\/body>/i, `${scriptTag}\n</body>`)
        : `${indexHtml}\n${scriptTag}`;
    }

    const files: ProjectFile[] = [{ path: 'index.html', content: indexHtml }];
    if (styles.length > 0) {
      files.push({
        path: 'css/styles.css',
        content: styles.join('\n\n/* ---- extracted stylesheet ---- */\n\n'),
      });
    }
    if (scripts.length > 0) {
      files.push({
        path: 'js/main.js',
        content: scripts.join('\n\n/* ---- extracted script ---- */\n\n'),
      });
    }
    return files;
  };

  const getProjectFiles = (rawCode: string): ProjectFile[] => {
    const files = parseProjectFiles(rawCode);
    if (files.length > 0) return files;
    return splitSingleHtmlProject(rawCode);
  };

  const projectFiles = getProjectFiles(generatedCode);

  const neutralizePreviewNavigation = (code: string) => {
    const withoutNavigatingLinks = code.replace(
      /(<a\b[^>]*\bhref\s*=\s*["'])([^"']*)(["'][^>]*>)/gi,
      '$1#$3'
    );

    return withoutNavigatingLinks.replace(
      /<button\b(?![^>]*\btype\s*=)[^>]*>/gi,
      (button: string) => button.replace(/^<button/i, '<button type="button"')
    );
  };

  const hasPlaygroundShellMarkers = (code: string) => {
    const structuralMarkers = [
      /(?:\/|\\)playground(?:\/|\\|[?#"'])/i,
      /PlaygroundHeader/i,
      /ChatSection/i,
      /WebsiteDesign/i,
      /clerkMiddleware/i,
      /__next_f/i,
      /_next\/static/i,
      /data-nextjs/i,
    ];
    if (structuralMarkers.some((marker) => marker.test(code))) {
      return true;
    }

    const markers = [
      /Export\s+ZIP/i,
      /Preview/i,
      /\bSave\b/i,
      /Version/i,
      /AI\s+Website\s+Generator/i,
    ];
    return markers.filter((marker) => marker.test(code)).length >= 3;
  };

  const extractNestedPreview = (code: string) => {
    if (hasPlaygroundShellMarkers(code)) {
      return { code: '', isPlaygroundShell: true };
    }

    if (typeof DOMParser === 'undefined') {
      return { code, isPlaygroundShell: false };
    }

    const document = new DOMParser().parseFromString(code, 'text/html');
    const bodyText = document.body.textContent || '';
    const playgroundMarkers = [
      'Export ZIP',
      'Preview',
      'Save',
      'Version',
      'AI Website Generator',
    ];
    const markerCount = playgroundMarkers.filter((marker) => bodyText.includes(marker)).length;

    if (markerCount >= 3) {
      const nestedPreview = document.querySelector('iframe[srcdoc]');
      const nestedSource = nestedPreview?.getAttribute('srcdoc');
      if (nestedSource?.trim()) {
        return { code: nestedSource, isPlaygroundShell: false };
      }

      return { code: '', isPlaygroundShell: true };
    }

    return { code, isPlaygroundShell: false };
  };

  const CDN_HEAD = `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Generated Website</title>
  <script>
    tailwind = {
      config: {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              primary: {
                "50": "#eff6ff", "100": "#dbeafe", "200": "#bfdbfe",
                "300": "#93c5fd", "400": "#60a5fa", "500": "#3b82f6",
                "600": "#2563eb", "700": "#1d4ed8", "800": "#1e40af",
                "900": "#1e3a8a", "950": "#172554"
              }
            }
          }
        }
      }
    };
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    html { scroll-behavior: smooth; }
    html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; }
    body { background: #ffffff; color: #111827; }
    *, *::before, *::after { box-sizing: border-box; }
    img { max-width: 100%; }
  </style>`;

  const PREVIEW_GUARD = `
  <script>
    // Polyfill DOMContentLoaded & localStorage safety for iframe srcdoc
    (function () {
      try {
        window.localStorage.getItem('test');
      } catch (e) {
        var store = {};
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: function (key) { return store[key] || null; },
            setItem: function (key, val) { store[key] = String(val); },
            removeItem: function (key) { delete store[key]; },
            clear: function () { store = {}; }
          },
          writable: true
        });
      }

      var origAddEventListener = document.addEventListener;
      document.addEventListener = function (type, listener, options) {
        if (type === 'DOMContentLoaded' && (document.readyState === 'interactive' || document.readyState === 'complete')) {
          setTimeout(function () {
            try {
              if (typeof listener === 'function') {
                listener.call(document, new Event('DOMContentLoaded'));
              } else if (listener && typeof listener.handleEvent === 'function') {
                listener.handleEvent(new Event('DOMContentLoaded'));
              }
            } catch (err) {
              console.error('[Preview] DOMContentLoaded listener error:', err);
            }
          }, 0);
        } else {
          origAddEventListener.call(document, type, listener, options);
        }
      };
    })();

    document.addEventListener('submit', function (event) {
      event.preventDefault();
    }, true);
    document.addEventListener('click', function (event) {
      var link = event.target && event.target.closest ? event.target.closest('a') : null;
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (/playground|localhost:3000/i.test(href) || link.target === '_top') {
        event.preventDefault();
      }
    }, true);
  </script>`;

  const buildPreviewHtml = (rawCode: string) => {
    if (!rawCode || !rawCode.trim()) return '';

    const parsedFiles = parseProjectFiles(rawCode);
    const previewFile = parsedFiles.find((file) => file.path.toLowerCase() === 'index.html')
      || parsedFiles.find((file) => file.path.toLowerCase().endsWith('/index.html'))
      || parsedFiles.find((file) => file.path.toLowerCase().endsWith('.html'));

    let code = stripFences(previewFile?.content || rawCode);
    code = fixMarkdownUrls(code);
    code = neutralizePreviewNavigation(code);
    const normalizedPreview = extractNestedPreview(code);
    if (normalizedPreview.isPlaygroundShell) {
      return '';
    }
    code = normalizedPreview.code;

    // Clean relative local script/link imports to prevent HTTP 404 console errors in iframe srcdoc
    code = code.replace(/<link\b[^>]*\bhref\s*=\s*["'](?:\.\/)?(?:css\/)?[^"']+\.css["'][^>]*>/gi, (match) => {
      if (/cdn|http|fonts\.googleapis/i.test(match)) return match;
      return '';
    });
    code = code.replace(/<script\b[^>]*\bsrc\s*=\s*["'](?:\.\/)?(?:js\/)?[^"']+\.js["'][^>]*\s*>\s*<\/script>/gi, (match) => {
      if (/cdn|http|chart|font-awesome|flowbite|swiper|tippy|tailwindcss/i.test(match)) return match;
      return '';
    });

    if (parsedFiles.length > 0) {
      const css = parsedFiles
        .filter((file) => file.path.toLowerCase().endsWith('.css'))
        .map((file) => file.content)
        .join('\n');
      const javascript = parsedFiles
        .filter((file) => /\.(js|mjs|ts|jsx|tsx)$/i.test(file.path) && !/server|api|database|config/i.test(file.path))
        .map((file) => file.content)
        .join('\n');

      if (css) {
        code = /<\/head>/i.test(code)
          ? code.replace(/<\/head>/i, `<style>\n${css}\n</style>\n</head>`)
          : `<style>\n${css}\n</style>\n${code}`;
      }
      if (javascript) {
        code = /<\/body>/i.test(code)
          ? code.replace(/<\/body>/i, `<script>\n${javascript.replace(/<\/script>/gi, '<\\/script>')}\n</script>\n</body>`)
          : `${code}\n<script>\n${javascript.replace(/<\/script>/gi, '<\\/script>')}\n</script>`;
      }
    }

    const hasFullDocument = /<html[\s>]/i.test(code);

    if (hasFullDocument) {
      if (!/<!DOCTYPE/i.test(code)) {
        code = `<!DOCTYPE html>\n${code}`;
      }
      if (/<head[\s>]/i.test(code)) {
        code = code.replace(/(<head[\s>]*>)/i, `$1\n${PREVIEW_GUARD}`);
      } else {
        code = code.replace(/(<html[\s>]*>)/i, `$1\n<head>\n${PREVIEW_GUARD}\n</head>`);
      }
      return code;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
${PREVIEW_GUARD}
${CDN_HEAD}
</head>
<body>
${code}
</body>
</html>`;
  };

  const fullHtml = buildPreviewHtml(generatedCode);

  const handleExport = async () => {
    try {
      const zip = new JSZip();
      const files = getProjectFiles(generatedCode);
      files.forEach((file) => zip.file(file.path, file.content));

      if (!files.some((file) => file.path === 'package.json')) {
        zip.file('package.json', JSON.stringify({
          name: 'ai-exported-website',
          version: '1.0.0',
          private: true,
          scripts: { start: 'npx serve .' },
        }, null, 2));
      }

      if (!files.some((file) => file.path.toLowerCase() === 'readme.md')) {
        zip.file('README.md', '# AI Generated Website\n\nOpen index.html or run `npm start`.\n');
      }

      const content = await zip.generateAsync({
        type: 'blob',
      });

      const url = URL.createObjectURL(content);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'website-export.zip';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleCommit = (val: string) => {
    if (onCodeCommit) onCodeCommit(val);
    if (onCommitCodeChange) onCommitCodeChange(val);
  };

  // Determine active file for Code Tab
  const activeFileObj = projectFiles.find((f) => f.path === selectedFileName)
    || projectFiles.find((f) => f.path.toLowerCase().includes('index.html'))
    || projectFiles[0];

  const currentCodeValue = activeFileObj ? activeFileObj.content : stripFences(generatedCode);

  const handleFileContentChange = (path: string, newContent: string) => {
    if (projectFiles.length > 0) {
      const updated = projectFiles.map((f) => f.path === path ? { ...f, content: newContent } : f);
      const reassembled = updated.map((f) => `--- FILE: ${f.path} ---\n${f.content}`).join('\n\n');
      onCodeChange?.(reassembled);
    } else {
      onCodeChange?.(newContent);
    }
  };

  const handleFileContentCommit = (path: string, newContent: string) => {
    if (projectFiles.length > 0) {
      const updated = projectFiles.map((f) => f.path === path ? { ...f, content: newContent } : f);
      const reassembled = updated.map((f) => `--- FILE: ${f.path} ---\n${f.content}`).join('\n\n');
      handleCommit(reassembled);
    } else {
      handleCommit(newContent);
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gray-50">
      {/* Top Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b bg-white p-3">
        {/* Device Toggles */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setDevice('desktop')}
            disabled={activeTab === 'code'}
            title="Desktop"
            className={`p-1.5 rounded-md transition-all ${
              device === 'desktop' && activeTab === 'preview'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'
            }`}
          >
            <Monitor className="size-4" />
          </button>

          <button
            onClick={() => setDevice('tablet')}
            disabled={activeTab === 'code'}
            title="Tablet"
            className={`p-1.5 rounded-md transition-all ${
              device === 'tablet' && activeTab === 'preview'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'
            }`}
          >
            <Tablet className="size-4" />
          </button>

          <button
            onClick={() => setDevice('mobile')}
            disabled={activeTab === 'code'}
            title="Mobile"
            className={`p-1.5 rounded-md transition-all ${
              device === 'mobile' && activeTab === 'preview'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'
            }`}
          >
            <Smartphone className="size-4" />
          </button>
        </div>

        {/* Right Toolbar */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-1 mr-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <Undo2 className="size-4" />
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <Redo2 className="size-4" />
            </button>
          </div>

          {/* Preview / Code */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg mr-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                activeTab === 'preview'
                  ? 'bg-white shadow-sm text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="size-4" />
              Preview
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                activeTab === 'code'
                  ? 'bg-white shadow-sm text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Code className="size-4" />
              Code
            </button>
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-sm rounded-md hover:bg-black/90 transition-all"
          >
            <Download className="size-4" />
            Export ZIP
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 min-w-0 flex-1 justify-center overflow-hidden p-4">
        {activeTab === 'preview' ? (
          <div
            className={`${getDeviceWidth()} flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border bg-white shadow-md transition-all duration-300 ease-in-out`}
          >
            {fullHtml ? (
              <iframe
                key={`${generatedCode.length}-${generatedCode.slice(0, 40)}`}
                srcDoc={fullHtml}
                className="block h-full min-h-0 w-full border-none"
                title="Generated Website Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 p-6 text-center">
                <Eye className="size-8" />
                <p className="text-sm">
                  Nothing generated yet. Ask the AI to build something to see the live preview here.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-lg bg-[#1e1e1e] shadow-md">
            {/* File Tabs Header */}
            <div className="flex shrink-0 items-center border-b border-[#404040] bg-[#2d2d2d] px-2 py-1.5 overflow-x-auto gap-1">
              {projectFiles.length > 0 ? (
                projectFiles.map((file) => {
                  const isSelected = activeFileObj ? activeFileObj.path === file.path : file.path.includes('index.html');
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFileName(file.path)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
                        isSelected
                          ? 'bg-[#1e1e1e] text-blue-400 font-semibold border-b-2 border-blue-400'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-[#383838]'
                      }`}
                    >
                      <FileCode className="size-3.5" />
                      {file.path}
                    </button>
                  );
                })
              ) : (
                <span className="text-gray-300 text-sm font-mono px-2">
                  index.html
                </span>
              )}
            </div>

            <textarea
              value={currentCodeValue}
              onChange={(e) => handleFileContentChange(activeFileObj ? activeFileObj.path : 'index.html', e.target.value)}
              onBlur={(e) => handleFileContentCommit(activeFileObj ? activeFileObj.path : 'index.html', e.target.value)}
              className="min-h-0 w-full flex-1 resize-none overflow-auto bg-transparent p-4 font-mono text-sm text-gray-300 focus:outline-none"
              spellCheck={false}
              placeholder="<!-- Code will appear here -->"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default WebsiteDesign;