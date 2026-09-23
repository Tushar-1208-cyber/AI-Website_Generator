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
  Server,
  FileText,
  X,
  Zap,
  Crosshair,
  Rocket,
  Layers,
  FlaskConical,
  Globe,
  Puzzle,
  Palette,
  KeyRound,
  Plug,
  Database,
  GitBranch,
} from "lucide-react";
import FileExplorer from "./FileExplorer";
import ApiConsole from "./ApiConsole";
import ElementInspectorDrawer from "./ElementInspectorDrawer";
import DeployModal from "./DeployModal";
import ProjectContextPanel from "./ProjectContextPanel";
import ErrorMonitorBanner from "./ErrorMonitorBanner";
import TestingAgentModal from "./TestingAgentModal";
import BrowserAgentDrawer from "./BrowserAgentDrawer";
import ComponentLibraryModal from "./ComponentLibraryModal";
import DesignSystemModal from "./DesignSystemModal";
import ResponsiveAgentModal from "./ResponsiveAgentModal";
import BackendGeneratorModal from "./BackendGeneratorModal";
import AuthGeneratorModal from "./AuthGeneratorModal";
import IntegrationsModal from "./IntegrationsModal";
import DatabaseStudioModal from "./DatabaseStudioModal";
import GitVersionModal from "./GitVersionModal";
import { insertComponentInstance } from "@/lib/reusableComponentEngine";
import { indexProject, getRelevantContext } from "@/lib/projectContextEngine";
import { detectErrors, autoFixErrors } from "@/lib/errorDetectionEngine";
import {
  parseMultiFiles,
  serializeMultiFiles,
  buildFileTree,
  bundleFilesForPreview,
} from "@/lib/fileTree";
import { detectHtmlPages, IFRAME_PAGE_ROUTER_SCRIPT } from "@/lib/pageNavigator";
import { INSPECTOR_IFRAME_SCRIPT, SelectedElementInfo } from "@/lib/elementInspector";
import {
  generateNextJsZip,
  generateReactViteZip,
  generateVanillaZip,
} from "@/lib/frameworkExporter";

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
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "split" | "api" | "context">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectedFilePath, setSelectedFilePath] = useState<string>("index.html");
  const [activePreviewPage, setActivePreviewPage] = useState<string>("index.html");
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [showBrowserDrawer, setShowBrowserDrawer] = useState<boolean>(false);
  const [showComponentModal, setShowComponentModal] = useState<boolean>(false);
  const [showDesignSystemModal, setShowDesignSystemModal] = useState<boolean>(false);
  const [showResponsiveModal, setShowResponsiveModal] = useState<boolean>(false);
  const [showBackendModal, setShowBackendModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState<boolean>(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState<boolean>(false);
  const [showGitModal, setShowGitModal] = useState<boolean>(false);
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const [selectedElementInfo, setSelectedElementInfo] = useState<SelectedElementInfo | null>(null);
  const [isFixingErrors, setIsFixingErrors] = useState<boolean>(false);
  const [lastFixSummary, setLastFixSummary] = useState<string | null>(null);

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

  // AI Error Detection Engine
  const detectedIssues = useMemo(() => {
    return detectErrors(filesMap);
  }, [filesMap]);

  // Index project using Project Context Engine
  const projectIndex = useMemo(() => {
    return indexProject(filesMap);
  }, [filesMap]);

  // Filter smart context payload
  const contextPayload = useMemo(() => {
    return getRelevantContext("", projectIndex, filesMap, selectedElementInfo, activePreviewPage);
  }, [filesMap, projectIndex, selectedElementInfo, activePreviewPage]);

  // Detect HTML pages
  const htmlPages = useMemo(() => {
    return detectHtmlPages(filesMap);
  }, [filesMap]);

  // Listen to postMessage from iframe for internal link clicks and element inspection
  React.useEffect(() => {
    const handleIframeMessages = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_PAGE' && event.data.page) {
        const targetPage = event.data.page;
        const matched = htmlPages.find((p) => p.path.toLowerCase().endsWith(targetPage.toLowerCase()));
        if (matched) {
          setActivePreviewPage(matched.path);
        }
      }
      if (event.data && event.data.type === 'ELEMENT_SELECTED' && event.data.element) {
        setSelectedElementInfo(event.data.element as SelectedElementInfo);
      }
    };
    window.addEventListener('message', handleIframeMessages);
    return () => window.removeEventListener('message', handleIframeMessages);
  }, [htmlPages]);

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
    // If an active preview page is selected (e.g. about.html), override index.html for bundling
    const effectiveFilesMap = { ...filesMap };
    if (activePreviewPage && filesMap[activePreviewPage] && activePreviewPage !== "index.html") {
      effectiveFilesMap["index.html"] = filesMap[activePreviewPage];
    }

    let bundled = bundleFilesForPreview(effectiveFilesMap);
    if (!bundled || !bundled.trim()) return "";

    let combinedGuard = `${PREVIEW_GUARD}\n${IFRAME_PAGE_ROUTER_SCRIPT}`;
    if (isInspectMode) {
      combinedGuard += `\n${INSPECTOR_IFRAME_SCRIPT}`;
    }

    if (bundled.includes("</head>")) {
      bundled = bundled.replace("</head>", `${combinedGuard}\n</head>`);
    } else {
      bundled = `${combinedGuard}\n${bundled}`;
    }

    if (!/<html[\s>]/i.test(bundled)) {
      bundled = `<!DOCTYPE html>\n<html lang="en">\n<head>\n${combinedGuard}\n${CDN_HEAD}\n</head>\n<body>\n${bundled}\n</body>\n</html>`;
    }

    return bundled;
  }, [filesMap, activePreviewPage, isInspectMode]);

  const handleAutoFix = () => {
    if (detectedIssues.length === 0) return;
    setIsFixingErrors(true);
    const res = autoFixErrors(filesMap, detectedIssues);
    const serialized = serializeMultiFiles(res.fixedFilesMap);
    onCodeChange?.(serialized);
    handleCommit(serialized);
    setIsFixingErrors(false);
    setLastFixSummary(`Repaired ${res.fixedCount} code & link issues cleanly.`);
    setTimeout(() => setLastFixSummary(null), 4000);
  };

  const handleExportZip = () => {
    setShowExportModal(true);
  };

  const handleDownloadFrameworkZip = async (framework: "nextjs" | "react-vite" | "vanilla") => {
    try {
      let blob: Blob;
      let filename = "project.zip";

      if (framework === "nextjs") {
        blob = await generateNextJsZip(filesMap, "ai-nextjs-app");
        filename = "nextjs14-app.zip";
      } else if (framework === "react-vite") {
        blob = await generateReactViteZip(filesMap, "ai-react-vite-app");
        filename = "react-vite-app.zip";
      } else {
        blob = await generateVanillaZip(filesMap);
        filename = "vanilla-website.zip";
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportModal(false);
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

        {/* Page Switcher Dropdown for Multi-Page Websites */}
        {htmlPages.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <FileText className="size-3.5 text-blue-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Page:</span>
            <select
              value={activePreviewPage}
              onChange={(e) => setActivePreviewPage(e.target.value)}
              className="bg-slate-950 text-slate-100 text-xs font-mono font-medium px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {htmlPages.map((page) => (
                <option key={page.path} value={page.path}>
                  {page.label} ({page.path})
                </option>
              ))}
            </select>
          </div>
        )}

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

            {/* Visual Inspect Mode Toggle */}
            <button
              onClick={() => setIsInspectMode(!isInspectMode)}
              title={isInspectMode ? "Disable Inspect Mode" : "Enable Click-to-Edit Visual Inspector"}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                isInspectMode
                  ? "bg-blue-600 text-white shadow-sm animate-pulse"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Crosshair className="size-3.5" />
              <span className="hidden lg:inline">{isInspectMode ? "Inspecting" : "Inspect"}</span>
            </button>

            {/* AI Browser Agent Drawer Toggle */}
            <button
              onClick={() => setShowBrowserDrawer(!showBrowserDrawer)}
              title="Toggle AI Browser Agent Simulation"
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                showBrowserDrawer
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Globe className="size-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Browser</span>
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

            <button
              onClick={() => setActiveTab("api")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "api"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Server className="size-3.5 text-emerald-400" />
              API Console
            </button>

            <button
              onClick={() => setActiveTab("context")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "context"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="size-3.5 text-purple-400" />
              Project Context
            </button>

            <button
              onClick={() => setShowComponentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              <Puzzle className="size-3.5 text-indigo-400" />
              Components
            </button>

            <button
              onClick={() => setShowDesignSystemModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              <Palette className="size-3.5 text-pink-400" />
              Design System
            </button>

            <button
              onClick={() => setShowResponsiveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              <Smartphone className="size-3.5 text-cyan-400" />
              Responsive AI
            </button>

            <button
              onClick={() => setShowBackendModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              <Server className="size-3.5 text-amber-400" />
              AI Backend
            </button>

            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              <KeyRound className="size-3.5 text-emerald-400" />
              AI Auth
            </button>

            <button
              onClick={() => setShowIntegrationsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              <Plug className="size-3.5 text-blue-400" />
              Integrations
            </button>

            <button
              onClick={() => setShowDatabaseModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              <Database className="size-3.5 text-cyan-400" />
              Database
            </button>

            <button
              onClick={() => setShowGitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            >
              <GitBranch className="size-3.5 text-emerald-400" />
              Git Control
            </button>
          </div>

          {/* AI Test Suite */}
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-all shadow-sm border border-slate-700"
          >
            <FlaskConical className="size-3.5 text-emerald-400" />
            Test Suite
          </button>

          {/* Export ZIP */}
          <button
            onClick={handleExportZip}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-all shadow-sm border border-slate-700"
          >
            <Download className="size-3.5" />
            Export ZIP
          </button>

          {/* Live Deploy */}
          <button
            onClick={() => setShowDeployModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold rounded-md transition-all shadow-md shadow-blue-500/25"
          >
            <Rocket className="size-3.5" />
            Live Deploy
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

        {/* API Console View */}
        {activeTab === "api" && (
          <div className="flex h-full min-h-0 min-w-0 w-full overflow-hidden">
            <ApiConsole filesMap={filesMap} />
          </div>
        )}

        {/* Project Context Engine Panel View */}
        {activeTab === "context" && (
          <div className="flex h-full min-h-0 min-w-0 w-full overflow-hidden">
            <ProjectContextPanel
              index={projectIndex}
              contextPayload={contextPayload}
              selectedElement={selectedElementInfo}
            />
          </div>
        )}
      </div>

      {/* Framework Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Download className="size-5 text-blue-400" />
                <h3 className="font-bold text-sm text-slate-100">Export Project Framework</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Select your preferred framework architecture. The AI code will be transformed into production-ready project files.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleDownloadFrameworkZip("nextjs")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/60 hover:bg-blue-950/20 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    N14
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-blue-400">Next.js 14 (App Router)</h4>
                    <p className="text-[11px] text-slate-400">React TSX + Tailwind CSS (`app/page.tsx`, `layout.tsx`)</p>
                  </div>
                </div>
                <Zap className="size-4 text-slate-500 group-hover:text-blue-400" />
              </button>

              <button
                onClick={() => handleDownloadFrameworkZip("react-vite")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 hover:bg-emerald-950/20 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    Vite
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-400">React + Vite</h4>
                    <p className="text-[11px] text-slate-400">Standard React JSX App (`src/App.jsx`, `vite.config.js`)</p>
                  </div>
                </div>
                <Zap className="size-4 text-slate-500 group-hover:text-emerald-400" />
              </button>

              <button
                onClick={() => handleDownloadFrameworkZip("vanilla")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 hover:bg-amber-950/20 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    HTML
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-400">Classic HTML / CSS / JS</h4>
                    <p className="text-[11px] text-slate-400">Standalone multi-file web app</p>
                  </div>
                </div>
                <Zap className="size-4 text-slate-500 group-hover:text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Element Inspector Drawer */}
      {selectedElementInfo && (
        <ElementInspectorDrawer
          selectedElement={selectedElementInfo}
          onClose={() => setSelectedElementInfo(null)}
          onSubmitPrompt={(prompt) => {
            onCodeChange?.(generatedCode); // preserve current state
            handleCommit(generatedCode);
            setSelectedElementInfo(null);
            // Trigger commit/prompt handler
            onCommitCodeChange?.(prompt);
          }}
        />
      )}

      {/* AI Browser Agent Drawer */}
      {showBrowserDrawer && (
        <BrowserAgentDrawer
          filesMap={filesMap}
          activePage={activePreviewPage}
          onClose={() => setShowBrowserDrawer(false)}
        />
      )}

      {/* Deploy Modal */}
      {showDeployModal && (
        <DeployModal
          projectId={activePreviewPage}
          filesCount={Object.keys(filesMap).length}
          onClose={() => setShowDeployModal(false)}
        />
      )}

      {/* Testing Agent Modal */}
      {showTestModal && (
        <TestingAgentModal
          filesMap={filesMap}
          onClose={() => setShowTestModal(false)}
          onApplyFixes={(fixedMap) => {
            const serialized = serializeMultiFiles(fixedMap);
            onCodeChange?.(serialized);
            handleCommit(serialized);
          }}
        />
      )}

      {/* Component Library Modal */}
      {showComponentModal && (
        <ComponentLibraryModal
          filesMap={filesMap}
          onClose={() => setShowComponentModal(false)}
          onInsertComponent={(targetPage, snippet) => {
            const updatedMap = insertComponentInstance(filesMap, targetPage, snippet);
            const serialized = serializeMultiFiles(updatedMap);
            onCodeChange?.(serialized);
            handleCommit(serialized);
            setShowComponentModal(false);
          }}
        />
      )}

      {/* Design System Modal */}
      {showDesignSystemModal && (
        <DesignSystemModal
          filesMap={filesMap}
          onClose={() => setShowDesignSystemModal(false)}
          onApplyDesignSystem={(updatedMap) => {
            const serialized = serializeMultiFiles(updatedMap);
            onCodeChange?.(serialized);
            handleCommit(serialized);
          }}
        />
      )}

      {/* Responsive AI Modal */}
      {showResponsiveModal && (
        <ResponsiveAgentModal
          isOpen={showResponsiveModal}
          onClose={() => setShowResponsiveModal(false)}
          htmlCode={activeFileContent || generatedCode}
          onApplyFixedCode={(fixedHtml) => {
            handleFileContentChange(activeFilePath, fixedHtml);
            handleFileContentCommit(activeFilePath, fixedHtml);
          }}
        />
      )}

      {/* Full-Stack AI Backend Generator Modal */}
      {showBackendModal && (
        <BackendGeneratorModal
          filesMap={filesMap}
          isOpen={showBackendModal}
          onClose={() => setShowBackendModal(false)}
          onInsertEndpoint={(updatedFilesMap, addedPath) => {
            const serialized = serializeMultiFiles(updatedFilesMap);
            onCodeChange?.(serialized);
            handleCommit(serialized);
            setSelectedFilePath(addedPath);
          }}
        />
      )}

      {/* AI Authentication & Security Generator Modal */}
      {showAuthModal && (
        <AuthGeneratorModal
          filesMap={filesMap}
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onApplyAuth={(updatedFilesMap) => {
            const serialized = serializeMultiFiles(updatedFilesMap);
            onCodeChange?.(serialized);
            handleCommit(serialized);
          }}
        />
      )}

      {/* AI Third-Party Integrations Hub Modal */}
      {showIntegrationsModal && (
        <IntegrationsModal
          filesMap={filesMap}
          isOpen={showIntegrationsModal}
          onClose={() => setShowIntegrationsModal(false)}
          onApplyIntegration={(updatedFilesMap, addedPath) => {
            const serialized = serializeMultiFiles(updatedFilesMap);
            onCodeChange?.(serialized);
            handleCommit(serialized);
            setSelectedFilePath(addedPath);
          }}
        />
      )}

      {/* AI Visual Database Studio Modal */}
      {showDatabaseModal && (
        <DatabaseStudioModal
          filesMap={filesMap}
          isOpen={showDatabaseModal}
          onClose={() => setShowDatabaseModal(false)}
          onApplySchema={(updatedFilesMap, addedPath) => {
            const serialized = serializeMultiFiles(updatedFilesMap);
            onCodeChange?.(serialized);
            handleCommit(serialized);
            setSelectedFilePath(addedPath);
          }}
        />
      )}

      {/* Git Version Control & Branching Agent Modal */}
      {showGitModal && (
        <GitVersionModal
          filesMap={filesMap}
          isOpen={showGitModal}
          onClose={() => setShowGitModal(false)}
          onRestoreSnapshot={(restoredFilesMap) => {
            const serialized = serializeMultiFiles(restoredFilesMap);
            onCodeChange?.(serialized);
            handleCommit(serialized);
          }}
        />
      )}

      {/* Error Monitor Banner */}
      <ErrorMonitorBanner
        issues={detectedIssues}
        onFixAll={handleAutoFix}
        isFixing={isFixingErrors}
        lastFixSummary={lastFixSummary}
      />
    </div>
  );
}

export default WebsiteDesign;