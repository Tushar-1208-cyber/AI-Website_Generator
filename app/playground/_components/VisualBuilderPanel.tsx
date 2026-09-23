"use client";

import React, { useState } from "react";
import { SelectedElementInfo } from "@/lib/elementInspector";
import {
  VisualElementStyles,
  parseElementStyles,
} from "@/lib/visualBuilderEngine";
import {
  Type,
  LayoutGrid,
  Palette,
  Check,
  Zap,
} from "lucide-react";

interface VisualBuilderPanelProps {
  selectedElement: SelectedElementInfo;
  onApplyStyles: (styles: VisualElementStyles) => void;
}

export default function VisualBuilderPanel({
  selectedElement,
  onApplyStyles,
}: VisualBuilderPanelProps) {
  const [styles, setStyles] = useState<VisualElementStyles>(() => {
    return parseElementStyles(selectedElement.className || "");
  });

  const handleChange = (key: keyof VisualElementStyles, value: string) => {
    const updated = { ...styles, [key]: value };
    setStyles(updated);
    onApplyStyles(updated);
  };

  return (
    <div className="space-y-4 font-sans text-xs text-slate-200">
      {/* 1. Typography Section */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <Type className="size-3.5 text-blue-400" />
          <span>Typography</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Font Size */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Font Size</label>
            <select
              value={styles.fontSize}
              onChange={(e) => handleChange("fontSize", e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="text-xs">Extra Small (xs)</option>
              <option value="text-sm">Small (sm)</option>
              <option value="text-base">Base (16px)</option>
              <option value="text-lg">Large (lg)</option>
              <option value="text-xl">XL (20px)</option>
              <option value="text-2xl">2XL (24px)</option>
              <option value="text-3xl">3XL (30px)</option>
            </select>
          </div>

          {/* Font Weight */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Font Weight</label>
            <select
              value={styles.fontWeight}
              onChange={(e) => handleChange("fontWeight", e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="font-normal">Normal</option>
              <option value="font-medium">Medium</option>
              <option value="font-semibold">Semi Bold</option>
              <option value="font-bold">Bold</option>
              <option value="font-extrabold">Extra Bold</option>
            </select>
          </div>
        </div>

        {/* Alignment */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Text Alignment</label>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {["text-left", "text-center", "text-right"].map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => handleChange("textAlign", align)}
                className={`flex-1 py-1 rounded text-[11px] font-medium transition-all ${
                  styles.textAlign === align
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {align.replace("text-", "").toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Layout & Flex Section */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <LayoutGrid className="size-3.5 text-purple-400" />
          <span>Layout & Flex</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Display Mode */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Display</label>
            <select
              value={styles.display}
              onChange={(e) => handleChange("display", e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500"
            >
              <option value="block">Block</option>
              <option value="flex">Flexbox</option>
              <option value="grid">Grid</option>
              <option value="inline-block">Inline Block</option>
            </select>
          </div>

          {/* Gap */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Flex/Grid Gap</label>
            <select
              value={styles.gap}
              onChange={(e) => handleChange("gap", e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500"
            >
              <option value="gap-1">Gap 1 (4px)</option>
              <option value="gap-2">Gap 2 (8px)</option>
              <option value="gap-4">Gap 4 (16px)</option>
              <option value="gap-6">Gap 6 (24px)</option>
              <option value="gap-8">Gap 8 (32px)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Appearance & Colors Section */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <Palette className="size-3.5 text-emerald-400" />
          <span>Appearance & Radius</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Border Radius */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Border Radius</label>
            <select
              value={styles.borderRadius}
              onChange={(e) => handleChange("borderRadius", e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
            >
              <option value="rounded-none">Square (0px)</option>
              <option value="rounded-md">Medium (6px)</option>
              <option value="rounded-xl">XL (12px)</option>
              <option value="rounded-2xl">2XL (16px)</option>
              <option value="rounded-full">Fully Rounded</option>
            </select>
          </div>

          {/* Box Shadow */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Box Shadow</label>
            <select
              value={styles.shadow}
              onChange={(e) => handleChange("shadow", e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
            >
              <option value="shadow-none">No Shadow</option>
              <option value="shadow-sm">Small Shadow</option>
              <option value="shadow-md">Medium Shadow</option>
              <option value="shadow-lg">Large Shadow</option>
              <option value="shadow-2xl">Extra Glow Shadow</option>
            </select>
          </div>
        </div>

        {/* Background Color Quick Pills */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Background Color</label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: "Dark", val: "bg-slate-900" },
              { label: "Blue", val: "bg-blue-600" },
              { label: "Indigo", val: "bg-indigo-600" },
              { label: "Emerald", val: "bg-emerald-600" },
              { label: "Purple", val: "bg-purple-600" },
              { label: "Amber", val: "bg-amber-600" },
            ].map((c) => (
              <button
                key={c.val}
                type="button"
                onClick={() => handleChange("bgColor", c.val)}
                className={`text-[10px] px-2 py-1 rounded-lg border transition-all shrink-0 flex items-center gap-1 ${
                  styles.bgColor === c.val
                    ? "bg-slate-800 border-blue-400 text-white font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {styles.bgColor === c.val && <Check className="size-2.5 text-blue-400" />}
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <button
        type="button"
        onClick={() => onApplyStyles(styles)}
        className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all"
      >
        <Zap className="size-3.5 fill-current" />
        <span>Apply Visual Styles to Source Code</span>
      </button>
    </div>
  );
}
