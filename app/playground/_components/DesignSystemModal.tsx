"use client";

import React, { useState } from "react";
import {
  ThemePreset,
  PRESET_THEMES,
  DesignTokens,
  DEFAULT_DESIGN_TOKENS,
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
  FileCode,
  Sliders,
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
  const [customTokens, setCustomTokens] = useState<DesignTokens>(currentTheme.tokens || DEFAULT_DESIGN_TOKENS);
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");

  const fileCount = Object.keys(filesMap).filter((fp) =>
    /\.(html|htm|jsx|tsx|vue|svelte|js|ts)$/i.test(fp)
  ).length;

  const handleApplyPreset = (theme: ThemePreset) => {
    setSelectedTheme(theme);
    setCustomTokens(theme.tokens);
  };

  const handleApply = () => {
    const target = activeTab === "presets" ? selectedTheme : customTokens;
    const updatedMap = applyDesignSystemToCode(filesMap, target);
    onApplyDesignSystem(updatedMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Palette className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Design System & Token Manager
                <Sparkles className="size-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Global design tokens, color palettes, typography & border radius management
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-3 gap-4 shrink-0">
          <button
            onClick={() => setActiveTab("presets")}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === "presets"
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Palette className="size-3.5" />
            Preset Themes
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === "custom"
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="size-3.5" />
            Custom Token Controls
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {activeTab === "presets" ? (
            /* Presets Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300">Select Preset Design System Theme</h4>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <FileCode className="size-3 text-pink-400" /> {fileCount} Code Files Targeted
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_THEMES.map((theme) => {
                  const isSelected = selectedTheme.id === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleApplyPreset(theme)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-slate-950 border-pink-500 shadow-md shadow-pink-500/10 ring-1 ring-pink-500"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                          <span
                            className="size-2.5 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                          {theme.name}
                        </h5>
                        {isSelected && <Check className="size-4 text-pink-400" />}
                      </div>

                      <p className="text-[10px] text-slate-400 mb-3">{theme.description}</p>

                      <div className="flex items-center gap-1.5 flex-wrap">
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
          ) : (
            /* Custom Design Tokens Controls */
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-slate-300">Custom Design Token Customizer</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Primary Color Picker */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Primary Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customTokens.primaryColor}
                      onChange={(e) => setCustomTokens({ ...customTokens, primaryColor: e.target.value })}
                      className="size-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customTokens.primaryColor}
                      onChange={(e) => setCustomTokens({ ...customTokens, primaryColor: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs w-full"
                    />
                  </div>
                </div>

                {/* Secondary Color Picker */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customTokens.secondaryColor}
                      onChange={(e) => setCustomTokens({ ...customTokens, secondaryColor: e.target.value })}
                      className="size-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customTokens.secondaryColor}
                      onChange={(e) => setCustomTokens({ ...customTokens, secondaryColor: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs w-full"
                    />
                  </div>
                </div>

                {/* Background Color Picker */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customTokens.backgroundColor}
                      onChange={(e) => setCustomTokens({ ...customTokens, backgroundColor: e.target.value })}
                      className="size-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customTokens.backgroundColor}
                      onChange={(e) => setCustomTokens({ ...customTokens, backgroundColor: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs w-full"
                    />
                  </div>
                </div>

                {/* Card Background Color Picker */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Card Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customTokens.cardBackgroundColor}
                      onChange={(e) => setCustomTokens({ ...customTokens, cardBackgroundColor: e.target.value })}
                      className="size-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customTokens.cardBackgroundColor}
                      onChange={(e) => setCustomTokens({ ...customTokens, cardBackgroundColor: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs w-full"
                    />
                  </div>
                </div>

                {/* Border Radius */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Border Radius</label>
                  <select
                    value={customTokens.borderRadius}
                    onChange={(e) => setCustomTokens({ ...customTokens, borderRadius: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-xs w-full"
                  >
                    <option value="0rem">Sharp (0px)</option>
                    <option value="0.375rem">Rounded Small (6px)</option>
                    <option value="0.75rem">Rounded Medium (12px)</option>
                    <option value="1rem">Rounded Large (16px)</option>
                    <option value="9999px">Pill / Fully Rounded</option>
                  </select>
                </div>

                {/* Font Family */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Font Family</label>
                  <select
                    value={customTokens.fontFamily}
                    onChange={(e) => setCustomTokens({ ...customTokens, fontFamily: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-xs w-full"
                  >
                    <option value="Inter, sans-serif">Inter (Sans)</option>
                    <option value="ui-sans-serif, system-ui">System Sans</option>
                    <option value="ui-serif, Georgia">Georgia (Serif)</option>
                    <option value="ui-monospace, monospace">Fira Code (Monospace)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Active Tokens Summary */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-emerald-400" /> Active Token Preview:
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Primary Accent</span>
                <span className="text-slate-200 font-bold">{customTokens.primaryColor}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Border Radius</span>
                <span className="text-slate-200 font-bold">{customTokens.borderRadius}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Font Family</span>
                <span className="text-slate-200 font-bold truncate block">{customTokens.fontFamily}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Global Design System Token Engine
          </span>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-pink-500/20 flex items-center gap-1.5"
          >
            <Zap className="size-3.5 fill-current" />
            <span>Apply Global Design Tokens</span>
          </button>
        </div>
      </div>
    </div>
  );
}
