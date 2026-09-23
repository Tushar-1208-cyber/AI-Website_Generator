"use client";

import React from "react";
import { DetectedIssue } from "@/lib/errorDetectionEngine";
import { AlertTriangle, Zap, Loader2, CheckCircle2 } from "lucide-react";

interface ErrorMonitorBannerProps {
  issues: DetectedIssue[];
  onFixAll: () => void;
  isFixing?: boolean;
  lastFixSummary?: string | null;
}

export default function ErrorMonitorBanner({
  issues,
  onFixAll,
  isFixing = false,
  lastFixSummary,
}: ErrorMonitorBannerProps) {
  if (issues.length === 0 && !lastFixSummary) return null;

  return (
    <div className="fixed top-16 right-6 z-40 max-w-md w-full animate-in slide-in-from-top-4 duration-300">
      {issues.length > 0 ? (
        <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-3.5 text-slate-100 font-sans space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center border border-amber-500/30">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  AI Code Diagnostic System
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono border border-amber-500/30">
                    {issues.length} {issues.length === 1 ? "Issue" : "Issues"} Found
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Syntax warnings or broken internal links detected
                </p>
              </div>
            </div>

            <button
              onClick={onFixAll}
              disabled={isFixing}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
            >
              {isFixing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Fixing...</span>
                </>
              ) : (
                <>
                  <Zap className="size-3.5 fill-current" />
                  <span>AI Fix All</span>
                </>
              )}
            </button>
          </div>

          {/* First Issue Snippet Preview */}
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 font-mono truncate">
            ⚠️ <span className="text-amber-400">{issues[0].filePath}:</span> {issues[0].message}
          </div>
        </div>
      ) : lastFixSummary ? (
        <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl shadow-2xl p-3 text-slate-100 font-sans flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-emerald-300">Auto-Fix Complete!</p>
            <p className="text-[11px] text-slate-300">{lastFixSummary}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
