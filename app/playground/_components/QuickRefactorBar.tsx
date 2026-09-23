"use client";

import React from "react";
import { Moon, Smartphone, Rocket, ShieldCheck, Zap } from "lucide-react";

export interface QuickActionItem {
  id: string;
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "dark-mode",
    label: "Dark Mode",
    prompt: "Transform the entire website design into a sleek, high-contrast dark mode theme with modern slate/zinc colors.",
    icon: Moon,
    color: "hover:border-purple-500/50 hover:bg-purple-950/20 text-purple-400",
  },
  {
    id: "mobile-fix",
    label: "Fix Mobile",
    prompt: "Optimize all layout sections, grids, typography, margins, and navigation buttons for perfect mobile responsiveness.",
    icon: Smartphone,
    color: "hover:border-blue-500/50 hover:bg-blue-950/20 text-blue-400",
  },
  {
    id: "seo-tags",
    label: "SEO Meta Tags",
    prompt: "Add complete SEO meta tags, OpenGraph social card previews, viewport settings, title, and description metadata to index.html.",
    icon: Rocket,
    color: "hover:border-emerald-500/50 hover:bg-emerald-950/20 text-emerald-400",
  },
  {
    id: "form-validation",
    label: "Form Validation",
    prompt: "Add interactive JavaScript input validations, email format checks, required field highlights, and error messages.",
    icon: ShieldCheck,
    color: "hover:border-amber-500/50 hover:bg-amber-950/20 text-amber-400",
  },
  {
    id: "fast-speed",
    label: "Fast Speed",
    prompt: "Optimize CSS styles, JavaScript functions, and image rendering for ultra-fast loading speed and clean performance.",
    icon: Zap,
    color: "hover:border-rose-500/50 hover:bg-rose-950/20 text-rose-400",
  },
];

interface QuickRefactorBarProps {
  onSelectAction: (prompt: string) => void;
  disabled?: boolean;
}

export default function QuickRefactorBar({ onSelectAction, disabled }: QuickRefactorBarProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 px-1 scrollbar-none select-none">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mr-1">
        Refactor:
      </span>
      {QUICK_ACTIONS.map((action) => {
        const IconComponent = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAction(action.prompt)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium transition-all shrink-0 disabled:opacity-40 cursor-pointer ${action.color}`}
          >
            <IconComponent className="size-3.5" />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
