"use client";

import React from "react";
import {
  ProjectIndex,
  SmartContextPayload,
} from "@/lib/projectContextEngine";
import { SelectedElementInfo } from "@/lib/elementInspector";
import {
  Layers,
  FileCode,
  Palette,
  Crosshair,
  Zap,
  CheckCircle2,
  Clock,
  HardDrive,
  Globe,
  Tag,
} from "lucide-react";

interface ProjectContextPanelProps {
  index: ProjectIndex;
  contextPayload?: SmartContextPayload | null;
  selectedElement?: SelectedElementInfo | null;
}

export default function ProjectContextPanel({
  index,
  contextPayload,
  selectedElement,
}: ProjectContextPanelProps) {
  return (
    <div className="h-full w-full bg-slate-950 p-4 font-sans text-slate-100 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
      {/* Top Header & Stats Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Layers className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Project Context Engine
              </h3>
              <p className="text-[11px] text-slate-400">
                Structural index & smart context payload monitor
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="size-3 text-emerald-400" />
            <span>Indexed: {index.lastIndexedAt}</span>
          </div>
        </div>

        {/* 4 Quick Stat Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Files & Size</span>
              <FileCode className="size-3.5 text-blue-400" />
            </div>
            <p className="text-sm font-bold text-slate-100">
              {index.files.length} Files
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <HardDrive className="size-2.5" /> {index.totalSizeFormatted}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Pages & Routes</span>
              <Globe className="size-3.5 text-indigo-400" />
            </div>
            <p className="text-sm font-bold text-slate-100">
              {index.pages.length} Pages
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              {index.pages.map((p) => p.route).join(", ")}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Components</span>
              <Layers className="size-3.5 text-purple-400" />
            </div>
            <p className="text-sm font-bold text-slate-100">
              {index.components.length} Sections
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              Navbar, Hero, Footer...
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Design System</span>
              <Palette className="size-3.5 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-slate-100">
              {index.designTokens.isDarkMode ? "Dark Theme" : "Light Theme"}
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-mono">
              Tailwind CDN Active
            </p>
          </div>
        </div>
      </div>

      {/* Pages & Component Hierarchy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pages & Routes Map */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Globe className="size-3.5 text-indigo-400" /> Indexed Routes & Pages
          </h4>
          <div className="space-y-2">
            {index.pages.map((page) => (
              <div
                key={page.path}
                className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-200">{page.title}</p>
                  <p className="text-[10px] font-mono text-slate-400">{page.route} ({page.path})</p>
                </div>
                <div className="flex items-center gap-1">
                  {page.hasNavbar && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                      Navbar
                    </span>
                  )}
                  {page.hasFooter && (
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                      Footer
                    </span>
                  )}
                  {page.hasForm && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                      Form
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Component Hierarchy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="size-3.5 text-purple-400" /> Detected UI Components
          </h4>
          <div className="space-y-2">
            {index.components.length > 0 ? (
              index.components.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="size-3.5 text-purple-400" />
                    <div>
                      <p className="font-semibold text-slate-200">{comp.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{comp.filePath}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {comp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono"
                      >
                        &lt;{tag}&gt;
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-2">
                No complex components detected yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Selected Element Context & Smart AI Payload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Selected Element */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Crosshair className="size-3.5 text-blue-400" /> Selected Element Context
          </h4>
          {selectedElement ? (
            <div className="bg-slate-950 p-3 rounded-xl border border-blue-500/30 space-y-1.5 font-mono text-xs">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <span>&lt;{selectedElement.tagName}&gt;</span>
                {selectedElement.id && <span className="text-slate-400">#{selectedElement.id}</span>}
              </div>
              {selectedElement.className && (
                <p className="text-[10px] text-slate-400 truncate">
                  class=&quot;{selectedElement.className}&quot;
                </p>
              )}
              <p className="text-[11px] text-slate-200 font-sans italic bg-slate-900 p-2 rounded border border-slate-800">
                &quot;{selectedElement.textSnippet || "Selected Container"}&quot;
              </p>
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
              No element selected. Enable Inspect Mode in preview to target specific elements.
            </div>
          )}
        </div>

        {/* Smart Context Payload View */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-400" /> Gemini Smart Context Filter
          </h4>
          {contextPayload ? (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                <CheckCircle2 className="size-3.5" />
                <span>Filtered {contextPayload.relevantFilePaths.length} relevant files for prompt</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono bg-slate-900 p-2 rounded border border-slate-800/80">
                {contextPayload.summary}
              </p>
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
              Context engine active and indexing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
