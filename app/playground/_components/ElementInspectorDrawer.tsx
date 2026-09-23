"use client";

import React, { useState } from "react";
import { SelectedElementInfo } from "@/lib/elementInspector";
import { Crosshair, X, Send, Tag } from "lucide-react";

interface ElementInspectorDrawerProps {
  selectedElement: SelectedElementInfo;
  onClose: () => void;
  onSubmitPrompt: (prompt: string) => void;
}

export default function ElementInspectorDrawer({
  selectedElement,
  onClose,
  onSubmitPrompt,
}: ElementInspectorDrawerProps) {
  const [promptInput, setPromptInput] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    const fullPrompt = `Modify the <${selectedElement.tagName}> element (text: "${selectedElement.textSnippet}"): ${promptInput.trim()}`;
    onSubmitPrompt(fullPrompt);
    setPromptInput("");
  };

  const handleQuickPreset = (preset: string) => {
    const fullPrompt = `Modify the <${selectedElement.tagName}> element (text: "${selectedElement.textSnippet}"): ${preset}`;
    onSubmitPrompt(fullPrompt);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-100 font-sans animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="size-6 bg-blue-600/30 text-blue-400 rounded-lg flex items-center justify-center border border-blue-500/40">
            <Crosshair className="size-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200">Element Inspector</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Selected Element Badge */}
      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Tag className="size-3 text-blue-400" />
          <span className="text-[11px] font-mono font-bold text-blue-400 uppercase">
            &lt;{selectedElement.tagName}&gt;
          </span>
          {selectedElement.id && (
            <span className="text-[10px] font-mono text-slate-400">#{selectedElement.id}</span>
          )}
        </div>
        <p className="text-xs text-slate-300 font-medium truncate">
          &quot;{selectedElement.textSnippet || "Selected Container"}&quot;
        </p>
      </div>

      {/* Quick Modification Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto mb-3 pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => handleQuickPreset("Make this element a glowing gradient background with rounded corners.")}
          className="text-[10px] font-medium bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-lg transition-all shrink-0 border border-slate-700/80"
        >
          ✨ Gradient Style
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset("Increase font size and make text extra bold.")}
          className="text-[10px] font-medium bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-lg transition-all shrink-0 border border-slate-700/80"
        >
          🔤 Bigger Text
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset("Add a drop shadow and smooth hover scale animation.")}
          className="text-[10px] font-medium bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-lg transition-all shrink-0 border border-slate-700/80"
        >
          💫 Hover Shadow
        </button>
      </div>

      {/* Prompt Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder={`Modify <${selectedElement.tagName}> element...`}
          autoFocus
          className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!promptInput.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl disabled:opacity-40 transition-all shadow-md shadow-blue-500/20"
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
}
