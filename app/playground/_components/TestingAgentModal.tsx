"use client";

import React, { useState, useEffect } from "react";
import {
  TestSuiteResult,
  runProjectTestSuite,
  autoFixTestIssues,
} from "@/lib/aiTestingAgent";
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  Loader2,
  ShieldCheck,
  FileCheck,
} from "lucide-react";

interface TestingAgentModalProps {
  filesMap: Record<string, string>;
  onClose: () => void;
  onApplyFixes: (fixedFilesMap: Record<string, string>) => void;
}

export default function TestingAgentModal({
  filesMap,
  onClose,
  onApplyFixes,
}: TestingAgentModalProps) {
  const [result, setResult] = useState<TestSuiteResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isFixing, setIsFixing] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function runTest() {
      setIsRunning(true);
      const res = await runProjectTestSuite(filesMap);
      if (isMounted) {
        setResult(res);
        setIsRunning(false);
      }
    }
    runTest();
    return () => {
      isMounted = false;
    };
  }, [filesMap]);

  const handleFixAll = async () => {
    if (!result) return;
    setIsFixing(true);
    const fixedMap = autoFixTestIssues(filesMap, result.issues);
    onApplyFixes(fixedMap);

    // Retest after fixing
    const newRes = await runProjectTestSuite(fixedMap);
    setResult(newRes);
    setIsFixing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FlaskConical className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Automated AI Testing Agent
              </h2>
              <p className="text-xs text-slate-400">
                Automated QA test suite across pages, routes, forms & responsiveness
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
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {/* Running Spinner */}
          {isRunning ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="size-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-semibold">Running Automated Test Suite...</p>
            </div>
          ) : result ? (
            <>
              {/* Score Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Overall Test Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span
                      className={`text-2xl font-extrabold ${
                        result.scorePercent >= 90
                          ? "text-emerald-400"
                          : result.scorePercent >= 70
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {result.scorePercent}%
                    </span>
                    <span className="text-xs text-slate-400">
                      ({result.passedTests} / {result.totalTests} Tests Passed)
                    </span>
                  </div>
                </div>

                {result.issues.length > 0 && (
                  <button
                    onClick={handleFixAll}
                    disabled={isFixing}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isFixing ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Fixing & Retesting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="size-3.5 fill-current" />
                        <span>Fix All & Retest</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Categories Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Test Categories Audit</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {cat.status === "passed" ? (
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="size-4 text-amber-400 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-200">{cat.name}</p>
                          <p className="text-[10px] text-slate-500">{cat.details}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {cat.passedCount}/{cat.totalCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues List */}
              {result.issues.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-amber-400" />
                    Detected Issues ({result.issues.length})
                  </h4>
                  <div className="space-y-2">
                    {result.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-400 font-mono text-[11px]">
                            [{issue.category}] {issue.filePath}
                          </span>
                        </div>
                        <p className="text-slate-200 font-medium">{issue.description}</p>
                        <p className="text-[10px] text-slate-400 italic">
                          💡 Suggestion: {issue.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-300 font-medium">
                  <ShieldCheck className="size-5 text-emerald-400 shrink-0" />
                  <span>All automated QA test suites passed with 100% clean validation!</span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <FileCheck className="size-3.5 text-slate-400" /> Automated QA Testing Framework
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
