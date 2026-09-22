"use client";

import React, { useState, useMemo } from "react";
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
  Columns,
} from "lucide-react";
import JSZip from "jszip";
import FileExplorer from "./FileExplorer";
import {
  parseMultiFiles,
  serializeMultiFiles,
  buildFileTree,
  bundleFilesForPreview,
} from "@/lib/fileTree";

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
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "split">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectedFilePath, setSelectedFilePath] = useState<string>("index.html");

  const getDeviceWidth = () => {
    switch (device) {
      case "mobile":
        return "w-[375px] max-w-full";
      case "tablet":
        return "w-[768px] max-w-full";
      case "desktop":
      default:
        return "w-full max-w-full";
    }
  };

  // Parse multi-files map from raw generated text
  const filesMap = useMemo(() => {
    return parseMultiFiles(generatedCode);
  }, [generatedCode]);

  // Build tree representation for explorer
  const filesTree = useMemo(() => {
    return buildFileTree(filesMap);
  }, [filesMap]);

  // Handle active file path fallback if current active file was deleted or not found
  const activeFilePath = useMemo(() => {
    if (filesMap[selectedFilePath] !== undefined) return selectedFilePath;
    const keys = Object.keys(filesMap);
    if (keys.includes("index.html")) return "index.html";
    return keys[0] || "index.html";
  }, [filesMap, selectedFilePath]);

  const activeFileContent = filesMap[activeFilePath] || "";

  const handleCommit = (val: string) => {
    if (onCodeCommit) onCodeCommit(val);
    if (onCommitCodeChange) onCommitCodeChange(val);
  };

  const handleFileContentChange = (path: string, newContent: string) => {
    const updatedFilesMap = { ...filesMap, [path]: newContent };
    const serialized = serializeMultiFiles(updatedFilesMap);
    onCodeChange?.(serialized);
  };

  const handleFileContentCommit = (path: string, newContent: string) => {
    const updatedFilesMap = { ...filesMap, [path]: newContent };
    const serialized = serializeMultiFiles(updatedFilesMap);
    handleCommit(serialized);
  };

  const handleAddFile = (newPath: string) => {
    if (!newPath) return;
    const updatedFilesMap = { ...filesMap, [newPath]: `/* File: ${newPath} */\n` };
    const serialized = serializeMultiFiles(updatedFilesMap);
    setSelectedFilePath(newPath);
    onCodeChange?.(serialized);
    handleCommit(serialized);
  };

  const handleDeleteFile = (pathToDelete: string) => {
    if (pathToDelete === "index.html") return; // Keep index.html
    const updatedFilesMap = { ...filesMap };
    delete updatedFilesMap[pathToDelete];
    const serialized = serializeMultiFiles(updatedFilesMap);
    setSelectedFilePath("index.html");
    onCodeChange?.(serialized);
    handleCommit(serialized);
  };



  const fullHtml = useMemo(() => {
    let bundled = bundleFilesForPreview(filesMap);
    if (!bundled || !bundled.trim()) return "";

    if (bundled.includes("</head>")) {
      bundled = bundled.replace("</head>", `${PREVIEW_GUARD}\n</head>`);
    } else {
      bundled = `${PREVIEW_GUARD}\n${bundled}`;
    }

    if (!/<html[\s>]/i.test(bundled)) {
      bundled = `<!DOCTYPE html>\n<html lang="en">\n<head>\n${PREVIEW_GUARD}\n${CDN_HEAD}\n</head>\n<body>\n${bundled}\n</body>\n</html>`;
    }

    return bundled;
  }, [filesMap]);

  const handleExportZip = async () => {
    try {
      const zip = new JSZip();
      Object.keys(filesMap).forEach((filePath) => {
        zip.file(filePath, filesMap[filePath]);
      });

      if (!filesMap["package.json"]) {
        zip.file(
          "package.json",
          JSON.stringify(
            {
              name: "ai-exported-website",
              version: "1.0.0",
              private: true,
              scripts: { start: "npx serve ." },
            },
            null,
            2
          )
        );
      }

      if (!filesMap["README.md"]) {
        zip.file("README.md", "# AI Generated Full-Stack Website\n\nOpen index.html in browser or run `npm start`.\n");
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fullstack-website-export.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export zip error:", err);
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-900">
      {/* Top Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 p-2.5">
        {/* Device Toggles */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setDevice("desktop")}
            disabled={activeTab === "code"}
            title="Desktop"
            className={`p-1.5 rounded-md transition-all ${
              device === "desktop" && activeTab !== "code"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
            }`}
          >
            <Monitor className="size-4" />
          </button>

          <button
            onClick={() => setDevice("tablet")}
            disabled={activeTab === "code"}
            title="Tablet"
            className={`p-1.5 rounded-md transition-all ${
              device === "tablet" && activeTab !== "code"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
            }`}
          >
            <Tablet className="size-4" />
          </button>

          <button
            onClick={() => setDevice("mobile")}
            disabled={activeTab === "code"}
            title="Mobile"
            className={`p-1.5 rounded-md transition-all ${
              device === "mobile" && activeTab !== "code"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
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
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <Undo2 className="size-4" />
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <Redo2 className="size-4" />
            </button>
          </div>

          {/* View Modes: Preview | Code | Split */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "preview"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="size-3.5" />
              Preview
            </button>

            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "code"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code className="size-3.5" />
              Explorer & Code
            </button>

            <button
              onClick={() => setActiveTab("split")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "split"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Columns className="size-3.5" />
              Split View
            </button>
          </div>

          {/* Export ZIP */}
          <button
            onClick={handleExportZip}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-all shadow-sm"
          >
            <Download className="size-3.5" />
            Export ZIP
          </button>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-slate-950">
        {/* Code Explorer & Editor View */}
        {(activeTab === "code" || activeTab === "split") && (
          <div
            className={`flex min-h-0 min-w-0 flex-1 overflow-hidden ${
              activeTab === "split" ? "w-1/2 border-r border-slate-800" : "w-full"
            }`}
          >
            {/* VS Code File Explorer Sidebar */}
            <FileExplorer
              filesTree={filesTree}
              filesMap={filesMap}
              activeFilePath={activeFilePath}
              onSelectFile={(path) => setSelectedFilePath(path)}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
            />

            {/* Code Editor Container */}
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-950">
              {/* File Tabs Header */}
              <div className="flex shrink-0 items-center border-b border-slate-800 bg-slate-900/80 px-2 py-1 overflow-x-auto gap-1">
                {Object.keys(filesMap).map((filePath) => {
                  const isSelected = activeFilePath === filePath;
                  return (
                    <button
                      key={filePath}
                      onClick={() => setSelectedFilePath(filePath)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
                        isSelected
                          ? "bg-slate-950 text-blue-400 font-semibold border-b-2 border-blue-500"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <FileCode className="size-3.5" />
                      {filePath}
                    </button>
                  );
                })}
              </div>

              {/* Code Textarea */}
              <textarea
                value={activeFileContent}
                onChange={(e) => handleFileContentChange(activeFilePath, e.target.value)}
                onBlur={(e) => handleFileContentCommit(activeFilePath, e.target.value)}
                className="min-h-0 w-full flex-1 resize-none overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-200 focus:outline-none leading-relaxed"
                spellCheck={false}
                placeholder={`// File: ${activeFilePath}`}
              />
            </div>
          </div>
        )}

        {/* Live Preview View */}
        {(activeTab === "preview" || activeTab === "split") && (
          <div
            className={`flex min-h-0 min-w-0 flex-1 justify-center overflow-hidden p-3 ${
              activeTab === "split" ? "w-1/2" : "w-full"
            }`}
          >
            <div
              className={`${getDeviceWidth()} flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-800 bg-white shadow-xl transition-all duration-300 ease-in-out`}
            >
              {fullHtml ? (
                <iframe
                  key={`${generatedCode.length}-${generatedCode.slice(0, 30)}`}
                  srcDoc={fullHtml}
                  className="block h-full min-h-0 w-full border-none"
                  title="Generated Website Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2 p-6 text-center">
                  <Eye className="size-8 text-slate-600" />
                  <p className="text-xs">
                    Nothing generated yet. Ask the AI to build a project to see the live preview here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WebsiteDesign;