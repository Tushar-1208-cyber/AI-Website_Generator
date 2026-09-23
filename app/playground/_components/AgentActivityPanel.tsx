"use client";

import React from "react";
import { AgentStep } from "@/lib/autonomousAgentEngine";
import {
  BrainCircuit,
  Loader2,
  CheckCircle2,
  FileCode,
  X,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";

interface AgentActivityPanelProps {
  steps: AgentStep[];
  isExecuting: boolean;
  summary?: string | null;
  onClose?: () => void;
}

export default function AgentActivityPanel({
  steps,
  isExecuting,
  summary,
  onClose,
}: AgentActivityPanelProps) {
  if (steps.length === 0 && !isExecuting) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 font-sans text-slate-100 space-y-4 animate-in slide-in-from-top-3 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="size-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
            {isExecuting ? (
              <BrainCircuit className="size-4 text-white animate-pulse" />
            ) : (
              <Sparkles className="size-4 text-amber-300" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              Autonomous AI Coding Agent
              {isExecuting && (
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1 font-mono">
                  <Loader2 className="size-2.5 animate-spin" /> RUNNING
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400">
              Multi-step plan execution & route validation engine
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Steps Timeline */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isDone = step.status === "completed";
          const isInProgress = step.status === "in_progress";

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-xs transition-all ${
                isInProgress
                  ? "bg-indigo-950/40 border-indigo-500/40 text-slate-100"
                  : isDone
                  ? "bg-slate-950 border-slate-800/80 text-slate-300"
                  : "bg-slate-950/50 border-slate-800/40 text-slate-500 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-medium">
                  {isDone ? (
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  ) : isInProgress ? (
                    <Loader2 className="size-3.5 text-indigo-400 animate-spin shrink-0" />
                  ) : (
                    <Clock className="size-3.5 text-slate-600 shrink-0" />
                  )}
                  <span className={isInProgress ? "text-indigo-400 font-bold" : ""}>
                    {step.label}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 shrink-0">
                  {step.timestamp}
                </span>
              </div>

              {/* Step Details & Affected Files */}
              <p className="text-[11px] text-slate-400 ml-5.5 mt-1">
                {step.details}
              </p>

              {step.affectedFiles && step.affectedFiles.length > 0 && (
                <div className="ml-5.5 mt-2 flex flex-wrap gap-1">
                  {step.affectedFiles.map((file) => (
                    <span
                      key={file.path}
                      className="text-[9px] font-mono bg-slate-900 border border-slate-700/80 text-indigo-300 px-2 py-0.5 rounded-md flex items-center gap-1"
                    >
                      <FileCode className="size-2.5" />
                      {file.path} ({file.action})
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      {summary && !isExecuting && (
        <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-medium">
          <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
          <span>{summary}</span>
        </div>
      )}
    </div>
  );
}
