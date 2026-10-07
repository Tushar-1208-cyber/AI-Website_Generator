"use client";

import React, { useState } from "react";
import { SelectedElementInfo } from "@/lib/elementInspector";
import { Crosshair, X, Send, Tag, Sliders, Sparkles, Code, Copy, Check, Info, Mic, MicOff } from "lucide-react";
import VisualBuilderPanel from "./VisualBuilderPanel";
import { VisualElementStyles, buildTailwindClasses } from "@/lib/visualBuilderEngine";
import { useVoiceInput } from "@/lib/useVoiceInput";

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
  const [activeTab, setActiveTab] = useState<"ai" | "visual" | "css">("ai");
  const [promptInput, setPromptInput] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { isListening, toggleVoiceInput } = useVoiceInput((transcript) => {
    setPromptInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    const stylesContext = selectedElement.styles
      ? ` Current computed styles: font-size=${selectedElement.styles.fontSize || "auto"}, color=${selectedElement.styles.color || "auto"}, bg=${selectedElement.styles.backgroundColor || "transparent"}.`
      : "";

    const fullPrompt = `Modify the <${selectedElement.tagName}> element (text: "${selectedElement.textSnippet}"):${stylesContext} ${promptInput.trim()}`;
    onSubmitPrompt(fullPrompt);
    setPromptInput("");
  };

  const handleQuickPreset = (preset: string) => {
    const fullPrompt = `Modify the <${selectedElement.tagName}> element (text: "${selectedElement.textSnippet}"): ${preset}`;
    onSubmitPrompt(fullPrompt);
  };

  const handleApplyVisualStyles = (styles: VisualElementStyles) => {
    const tailwindClasses = buildTailwindClasses(styles, selectedElement.className);
    const fullPrompt = `Update the <${selectedElement.tagName}> element's CSS classes to: "${tailwindClasses}"`;
    onSubmitPrompt(fullPrompt);
  };

  const handleCopyStyle = (key: string, value: string) => {
    navigator.clipboard.writeText(`${key}: ${value};`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const computedStylesList = selectedElement.styles
    ? Object.entries(selectedElement.styles).filter(([_, value]) => Boolean(value))
    : [];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 max-h-[80vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 text-slate-100 font-sans animate-in slide-in-from-bottom-5 duration-200 scrollbar-thin scrollbar-thumb-slate-800">
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
      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 mb-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tag className="size-3 text-blue-400" />
            <span className="text-[11px] font-mono font-bold text-blue-400 uppercase">
              &lt;{selectedElement.tagName}&gt;
            </span>
            {selectedElement.id && (
              <span className="text-[10px] font-mono text-slate-400">#{selectedElement.id}</span>
            )}
          </div>
          {selectedElement.styles?.width && selectedElement.styles?.height && (
            <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
              {Math.round(parseFloat(selectedElement.styles.width))}x
              {Math.round(parseFloat(selectedElement.styles.height))}px
            </span>
          )}
        </div>
        <p className="text-xs text-slate-300 font-medium truncate">
          &quot;{selectedElement.textSnippet || "Selected Container"}&quot;
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 mb-3">
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "ai"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="size-3" /> AI Prompt
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("visual")}
          className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "visual"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sliders className="size-3" /> Visual
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("css")}
          className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "css"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code className="size-3" /> CSS
        </button>
      </div>

      {/* AI Prompt Tab */}
      {activeTab === "ai" && (
        <div className="space-y-3">
          {/* Quick Modification Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
            <button
              type="button"
              onClick={() => handleQuickPreset("Center all content flex align items center justify center.")}
              className="text-[10px] font-medium bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-lg transition-all shrink-0 border border-slate-700/80"
            >
              🎯 Center Content
            </button>
          </div>

          {/* Prompt Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={`Modify <${selectedElement.tagName}> element...`}
              autoFocus
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? "Stop listening" : "Speak voice prompt 🎙️"}
              className={`p-2 rounded-xl transition-all ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              {isListening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
            </button>
            <button
              type="submit"
              disabled={!promptInput.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl disabled:opacity-40 transition-all shadow-md shadow-blue-500/20"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Visual Builder Tab */}
      {activeTab === "visual" && (
        <VisualBuilderPanel
          selectedElement={selectedElement}
          onApplyStyles={handleApplyVisualStyles}
        />
      )}

      {/* Computed CSS Tab */}
      {activeTab === "css" && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-300 pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <Info className="size-3.5 text-blue-400" />
              Computed CSS Metrics
            </span>
            <span className="text-[10px] font-normal text-slate-500">
              {computedStylesList.length} properties
            </span>
          </div>

          {computedStylesList.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No computed styles available for this element.</p>
          ) : (
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px] max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              {computedStylesList.map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center justify-between group py-1 px-1.5 hover:bg-slate-900 rounded transition-colors"
                >
                  <div className="truncate mr-2">
                    <span className="text-blue-400">{key}:</span>{" "}
                    <span className="text-slate-300 truncate">{String(val)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyStyle(key, String(val))}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-100 p-0.5 rounded transition-opacity"
                    title="Copy property"
                  >
                    {copiedKey === key ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
