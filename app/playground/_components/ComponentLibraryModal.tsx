"use client";

import React, { useState, useMemo } from "react";
import { extractLibraryComponents, ComponentLibraryItem } from "@/lib/reusableComponentEngine";
import { detectHtmlPages } from "@/lib/pageNavigator";
import {
  Puzzle,
  Plus,
  X,
  Layers,
  Code,
  Tag,
  Search,
  Copy,
  Check,
  Filter,
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const libraryComponents = useMemo(() => {
    return extractLibraryComponents(filesMap);
  }, [filesMap]);

  const htmlPages = useMemo(() => {
    return detectHtmlPages(filesMap);
  }, [filesMap]);

  const filteredComponents = useMemo(() => {
    return libraryComponents.filter((comp) => {
      const matchesCategory = selectedCategory === "all" || comp.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        comp.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [libraryComponents, selectedCategory, searchQuery]);

  const handleCopySnippet = (id: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const categories = ["all", "hero", "features", "cta", "pricing", "navigation", "testimonials", "footer", "custom"];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-100 flex flex-col max-h-[85vh]">
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
          {/* Target Page Selection Bar & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5 shrink-0">
                <Layers className="size-3.5 text-purple-400" /> Target Page:
              </span>
              <select
                value={selectedTargetPage}
                onChange={(e) => setSelectedTargetPage(e.target.value)}
                className="bg-slate-900 text-slate-100 text-xs font-mono font-medium px-2 py-1 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer w-full truncate"
              >
                {htmlPages.map((page) => (
                  <option key={page.path} value={page.path}>
                    {page.label} ({page.path})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex items-center">
              <Search className="size-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search components or tags..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs pl-8 pr-3 py-2 rounded-2xl focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] font-bold uppercase px-3 py-1 rounded-xl transition-all shrink-0 border ${
                  selectedCategory === cat
                    ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Component List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Components ({filteredComponents.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Click component to inspect code</span>
            </h4>

            {filteredComponents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredComponents.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-2xl space-y-3 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <h5 className="font-bold text-slate-100 text-xs group-hover:text-purple-400">
                            {comp.name}
                          </h5>
                          <p className="text-[10px] font-mono text-slate-400">
                            {comp.usageCount > 0
                              ? `Used in ${comp.usageCount} page(s)`
                              : "Preset Starter Component"}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 uppercase">
                          {comp.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap mb-3">
                        {comp.tags.map((tag) => (
                          <span key={tag} className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Tag className="size-2 text-purple-400" /> &lt;{tag}&gt;
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                        <button
                          type="button"
                          onClick={() => setPreviewSnippet(previewSnippet === comp.id ? null : comp.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Code className="size-3" />
                          {previewSnippet === comp.id ? "Hide" : "Inspect"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopySnippet(comp.id, comp.snippet)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 rounded-lg flex items-center gap-1 transition-colors"
                          title="Copy Code"
                        >
                          {copiedId === comp.id ? (
                            <Check className="size-3 text-emerald-400" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onInsertComponent(selectedTargetPage, comp.snippet)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm shadow-purple-500/20 ml-auto"
                        >
                          <Plus className="size-3" />
                          Insert
                        </button>
                      </div>

                      {previewSnippet === comp.id && (
                        <pre className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl text-[10px] font-mono text-slate-300 max-h-36 overflow-auto font-normal leading-relaxed animate-in fade-in duration-200">
                          {comp.snippet}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 border border-slate-800 rounded-2xl">
                No matching components found for search query.
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
