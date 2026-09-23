"use client";

import React, { useState } from "react";
import {
  ThemePreset,
  PRESET_THEMES,
  extractDesignSystem,
  applyDesignSystemToCode,
} from "@/lib/aiDesignSystemEngine";
import {
  Palette,
  Check,
  X,
  Zap,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface DesignSystemModalProps {
  filesMap: Record<string, string>;
  onClose: () => void;
  onApplyDesignSystem: (updatedFilesMap: Record<string, string>) => void;
}

export default function DesignSystemModal({
  filesMap,
  onClose,
  onApplyDesignSystem,
}: DesignSystemModalProps) {
  const currentTheme = extractDesignSystem(filesMap);
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(currentTheme);

  const handleApply = () => {
    const updatedMap = applyDesignSystemToCode(filesMap, selectedTheme);
    onApplyDesignSystem(updatedMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Palette className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Design System Manager
                <Sparkles className="size-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Global theme palettes, typography & border radius management
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
          {/* Preset Theme Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">Select Preset Design System Theme</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_THEMES.map((theme) => {
                const isSelected = selectedTheme.id === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-950 border-pink-500 shadow-md shadow-pink-500/10 ring-1 ring-pink-500"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                        {theme.name}
                      </h5>
                      {isSelected && <Check className="size-4 text-pink-400" />}
                    </div>

                    <p className="text-[10px] text-slate-400 mb-3">{theme.description}</p>

                    {/* Color & Style Preview Pills */}
                    <div className="flex items-center gap-1.5">
                      <span className={`size-4 rounded-full ${theme.primaryBg} inline-block`} title="Primary Color" />
                      <span className="text-[9px] font-mono bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        {theme.borderRadius}
                      </span>
                      <span className="text-[9px] font-mono bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        {theme.fontFamily}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Tokens Summary */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-emerald-400" /> Selected Theme Tokens Overview:
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Primary Accent</span>
                <span className="text-slate-200 font-bold">{selectedTheme.primaryBg}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Border Radius</span>
                <span className="text-slate-200 font-bold">{selectedTheme.borderRadius}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Font Family</span>
                <span className="text-slate-200 font-bold">{selectedTheme.fontFamily}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Global Design System Theme Engine
          </span>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-pink-500/20 flex items-center gap-1.5"
          >
            <Zap className="size-3.5 fill-current" />
            <span>Apply Global Design System</span>
          </button>
        </div>
      </div>
    </div>
  );
}
