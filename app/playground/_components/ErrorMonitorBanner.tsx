"use client";

import React from "react";
import { DetectedIssue } from "@/lib/errorDetectionEngine";
import { AlertTriangle, Zap, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";

interface ErrorMonitorBannerProps {
  issues: DetectedIssue[];
  onFixAll: () => void;
  isFixing?: boolean;
  lastFixSummary?: string | null;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

export default function ErrorMonitorBanner({
  issues,
  onFixAll,
  isFixing = false,
  lastFixSummary,
  errorMessage,
  onDismissError,
}: ErrorMonitorBannerProps) {
  if (issues.length === 0 && !lastFixSummary && !errorMessage) return null;

  return (
    <div className="fixed top-16 right-6 z-40 max-w-md w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
      {errorMessage ? (
        <div className="bg-slate-900/95 backdrop-blur-md border border-rose-500/50 rounded-2xl shadow-2xl p-3.5 text-slate-100 font-sans flex items-start justify-between gap-2.5 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <div className="size-7 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center border border-rose-500/30 shrink-0 mt-0.5">
              <AlertCircle className="size-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-rose-300">AI Repair Notice</p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          {onDismissError && (
            <button
              onClick={onDismissError}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors"
              title="Dismiss error"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ) : issues.length > 0 ? (
        <div className="bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-3.5 text-slate-100 font-sans space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-7 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center border border-amber-500/30 shrink-0">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                  AI Code Diagnostic System
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono border border-amber-500/30">
                    {issues.length} {issues.length === 1 ? "Issue" : "Issues"} Found
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isFixing
                    ? "AI model is repairing syntax and structure..."
                    : "Structural warnings or unclosed tags detected"}
                </p>
              </div>
            </div>

            <button
              onClick={onFixAll}
              disabled={isFixing}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {isFixing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>AI Repairing...</span>
                </>
              ) : (
                <>
                  <Zap className="size-3.5 fill-current" />
                  <span>AI Fix All</span>
                </>
              )}
            </button>
          </div>

          {/* Issue Snippet Preview */}
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 font-mono">
            <div className="truncate">
              ⚠️ <span className="text-amber-400">{issues[0].filePath}:</span> {issues[0].message}
            </div>
            {issues.length > 1 && (
              <div className="text-[10px] text-slate-500 mt-1 pl-4">
                +{issues.length - 1} additional issue{issues.length - 1 > 1 ? "s" : ""} detected in project
              </div>
            )}
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
