"use client";

import React, { useState, useMemo } from "react";
import { extractLibraryComponents } from "@/lib/reusableComponentEngine";
import { detectHtmlPages } from "@/lib/pageNavigator";
import {
  Puzzle,
  Plus,
  X,
  Layers,
  Code,
  Tag,
} from "lucide-react";

interface ComponentLibraryModalProps {
  filesMap: Record<string, string>;
  onClose: () => void;
  onInsertComponent: (targetPage: string, snippet: string) => void;
}

export default function ComponentLibraryModal({
  filesMap,
  onClose,
  onInsertComponent,
}: ComponentLibraryModalProps) {
  const [selectedTargetPage, setSelectedTargetPage] = useState<string>("index.html");
  const [previewSnippet, setPreviewSnippet] = useState<string | null>(null);

  const libraryComponents = useMemo(() => {
    return extractLibraryComponents(filesMap);
  }, [filesMap]);

  const htmlPages = useMemo(() => {
    return detectHtmlPages(filesMap);
  }, [filesMap]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Puzzle className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Reusable Component System
              </h2>
              <p className="text-xs text-slate-400">
                Library of detected UI sections & component instances
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Target Page Selection Bar */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="size-3.5 text-purple-400" /> Target Page for Component Insertion:
            </span>
            <select
              value={selectedTargetPage}
              onChange={(e) => setSelectedTargetPage(e.target.value)}
              className="bg-slate-900 text-slate-100 text-xs font-mono font-medium px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {htmlPages.map((page) => (
                <option key={page.path} value={page.path}>
                  {page.label} ({page.path})
                </option>
              ))}
            </select>
          </div>

          {/* Component List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Detected UI Components ({libraryComponents.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Click component to inspect snippet</span>
            </h4>

            {libraryComponents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {libraryComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-2xl space-y-3 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-bold text-slate-100 text-xs group-hover:text-purple-400">
                          {comp.name}
                        </h5>
                        <p className="text-[10px] font-mono text-slate-400">
                          Used in {comp.usageCount} pages ({comp.usedInPages.join(", ")})
                        </p>
                      </div>
                      <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 uppercase">
                        {comp.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {comp.tags.map((tag) => (
                        <span key={tag} className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Tag className="size-2 text-purple-400" /> &lt;{tag}&gt;
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => setPreviewSnippet(previewSnippet === comp.id ? null : comp.id)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Code className="size-3" />
                        {previewSnippet === comp.id ? "Hide Snippet" : "Code Snippet"}
                      </button>

                      <button
                        type="button"
                        onClick={() => onInsertComponent(selectedTargetPage, comp.snippet)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm shadow-purple-500/20 ml-auto"
                      >
                        <Plus className="size-3" />
                        Insert Instance
                      </button>
                    </div>

                    {previewSnippet === comp.id && (
                      <pre className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl text-[10px] font-mono text-slate-300 max-h-32 overflow-auto font-normal leading-relaxed animate-in fade-in duration-200">
                        {comp.snippet}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 border border-slate-800 rounded-2xl">
                No complex components detected yet. Ask the AI to build a project to auto-extract reusable components.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Multi-Page Component Instance Sync
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
