"use client";

import React, { useState } from "react";
import {
  BrowserStep,
  BrowserTaskResult,
  runBrowserTask,
} from "@/lib/aiBrowserAgent";
import {
  Globe,
  Lock,
  Play,
  Loader2,
  CheckCircle2,
  X,
  ShieldCheck,
  Send,
  Sparkles,
  MousePointerClick,
  FileCheck,
} from "lucide-react";

interface BrowserAgentDrawerProps {
  filesMap: Record<string, string>;
  activePage: string;
  onClose: () => void;
}

export default function BrowserAgentDrawer({
  filesMap,
  activePage,
  onClose,
}: BrowserAgentDrawerProps) {
  const [taskInput, setTaskInput] = useState<string>("");
  const [steps, setSteps] = useState<BrowserStep[]>([]);
  const [result, setResult] = useState<BrowserTaskResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRunTask = async (taskText: string) => {
    if (!taskText.trim() || isRunning) return;
    setIsRunning(true);
    setResult(null);

    const res = await runBrowserTask(
      taskText,
      filesMap,
      activePage,
      (currentSteps) => {
        setSteps(currentSteps);
      }
    );

    setResult(res);
    setIsRunning(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 text-slate-100 font-sans animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="size-7 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <Globe className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              AI Browser Agent
              <Sparkles className="size-3 text-amber-400" />
            </h3>
            <p className="text-[10px] text-slate-400">
              Interactive DOM & user flow simulation
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Virtual Address Bar */}
      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center gap-2 mb-3 text-xs">
        <Lock className="size-3.5 text-emerald-400 shrink-0" />
        <span className="font-mono text-[11px] text-slate-300 truncate flex-1">
          https://preview.local/{activePage}
        </span>
        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
          Rendered DOM
        </span>
      </div>

      {/* Preset Action Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto mb-3 pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setTaskInput("Test Contact Form submission");
            handleRunTask("Test Contact Form submission");
          }}
          disabled={isRunning}
          className="text-[10px] font-medium bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-lg transition-all shrink-0 border border-slate-700/80 flex items-center gap-1 disabled:opacity-40"
        >
          <MousePointerClick className="size-3" /> Test Form
        </button>

        <button
          type="button"
          onClick={() => {
            setTaskInput("Verify all navigation links");
            handleRunTask("Verify all navigation links");
          }}
          disabled={isRunning}
          className="text-[10px] font-medium bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-lg transition-all shrink-0 border border-slate-700/80 flex items-center gap-1 disabled:opacity-40"
        >
          <FileCheck className="size-3" /> Check Links
        </button>

        <button
          type="button"
          onClick={() => {
            setTaskInput("Verify pricing CTA buttons");
            handleRunTask("Verify pricing CTA buttons");
          }}
          disabled={isRunning}
          className="text-[10px] font-medium bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-lg transition-all shrink-0 border border-slate-700/80 flex items-center gap-1 disabled:opacity-40"
        >
          <Play className="size-3" /> Pricing Flow
        </button>
      </div>

      {/* Browser Steps Execution Stream */}
      {steps.length > 0 && (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {steps.map((step) => (
            <div
              key={step.id}
              className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] space-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  {step.status === "completed" ? (
                    <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                  ) : step.status === "in_progress" ? (
                    <Loader2 className="size-3 text-indigo-400 animate-spin shrink-0" />
                  ) : (
                    <div className="size-3 rounded-full border border-slate-700 shrink-0" />
                  )}
                  {step.label}
                </span>
                <span className="text-[9px] font-mono text-slate-500">{step.timestamp}</span>
              </div>
              <p className="text-[10px] text-slate-400 ml-4.5">{step.details}</p>
            </div>
          ))}
        </div>
      )}

      {/* Final Outcome */}
      {result && !isRunning && (
        <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-medium mb-3">
          <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
          <span>{result.observedOutcome}</span>
        </div>
      )}

      {/* Prompt Task Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRunTask(taskInput);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder="Specify user flow to simulate..."
          className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isRunning || !taskInput.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl disabled:opacity-40 transition-all shadow-md shadow-indigo-500/20"
        >
          {isRunning ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
        </button>
      </form>
    </div>
  );
}
