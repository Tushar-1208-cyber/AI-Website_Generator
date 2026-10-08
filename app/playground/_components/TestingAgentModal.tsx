"use client";

import React, { useState, useEffect } from "react";
import {
  TestSuiteResult,
  TestIssue,
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
  History,
  ExternalLink,
  Code2,
} from "lucide-react";

interface TestHistoryItem {
  id: number;
  projectID: string;
  scorePercent: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  createdOn: string;
}

interface TestingAgentModalProps {
  filesMap: Record<string, string>;
  projectID?: string;
  onClose: () => void;
  onApplyFixes: (fixedFilesMap: Record<string, string>) => void;
  onOpenFile?: (filePath: string, line?: number) => void;
}

export default function TestingAgentModal({
  filesMap,
  projectID,
  onClose,
  onApplyFixes,
  onOpenFile,
}: TestingAgentModalProps) {
  const [result, setResult] = useState<TestSuiteResult | null>(null);
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"results" | "history">("results");
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isFixing, setIsFixing] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function executeTestSuite() {
      setIsRunning(true);
      try {
        const response = await fetch("/api/testing/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectID, filesMap }),
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.testSuite) {
            setResult(data.testSuite);
            setIsRunning(false);
            return;
          }
        }
      } catch (e) {
        console.warn("API route /api/testing/run failed, falling back to client engine:", e);
      }

      // Fallback client runner
      const res = await runProjectTestSuite(filesMap);
      if (isMounted) {
        setResult(res);
        setIsRunning(false);
      }
    }

    executeTestSuite();

    return () => {
      isMounted = false;
    };
  }, [filesMap, projectID]);

  // Load test run history
  useEffect(() => {
    if (!projectID || activeTab !== "history") return;

    let isMounted = true;
    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`/api/testing/history?projectID=${encodeURIComponent(projectID || "")}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.history) {
            setHistory(data.history);
          }
        }
      } catch (err) {
        console.error("Failed to load test history:", err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [projectID, activeTab]);

  const handleFixAll = async () => {
    if (!result) return;
    setIsFixing(true);

    const fixedMap = autoFixTestIssues(filesMap, result.issues);
    onApplyFixes(fixedMap);

    // Retest after fixing
    try {
      const response = await fetch("/api/testing/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectID, filesMap: fixedMap }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.testSuite) {
          setResult(data.testSuite);
          setIsFixing(false);
          return;
        }
      }
    } catch {
      // Fallback
    }

    const newRes = await runProjectTestSuite(fixedMap);
    setResult(newRes);
    setIsFixing(false);
  };

  const handleIssueClick = (issue: TestIssue) => {
    if (onOpenFile) {
      onOpenFile(issue.filePath, issue.lineNumber || 1);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FlaskConical className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Automated AI Testing Agent
              </h2>
              <p className="text-xs text-slate-400">
                Automated QA test suite across syntax, pages, links, forms & responsiveness
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
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-6 pt-3 gap-4 shrink-0">
          <button
            onClick={() => setActiveTab("results")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === "results"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FlaskConical className="size-4" />
            Test Audit Results
          </button>

          {projectID && (
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 ${
                activeTab === "history"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="size-4" />
              Test History
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 grow">
          {activeTab === "results" ? (
            isRunning ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <Loader2 className="size-8 text-emerald-400 animate-spin" />
                <p className="text-xs font-semibold">Running Automated Test Suite...</p>
                <p className="text-[11px] text-slate-500">Checking HTML tags, relative links, JSON/CSS syntax & mobile layout</p>
              </div>
            ) : result ? (
              <>
                {/* Score Banner */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Overall QA Score
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
                          <span>Applying AI Fixes...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="size-3.5 fill-current" />
                          <span>Fix All Issues ({result.issues.length})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Categories Checklist */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">Test Domain Audits</h4>
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
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-400 font-mono text-[11px] flex items-center gap-1.5">
                              <span>[{issue.category}]</span>
                              <span className="text-slate-300">{issue.filePath}</span>
                              {issue.lineNumber && (
                                <span className="text-slate-500 font-normal">Line {issue.lineNumber}</span>
                              )}
                            </span>

                            {onOpenFile && (
                              <button
                                onClick={() => handleIssueClick(issue)}
                                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-lg"
                              >
                                <Code2 className="size-3" />
                                Jump to Code
                              </button>
                            )}
                          </div>

                          <p className="text-slate-200 font-medium">{issue.description}</p>

                          {issue.snippet && (
                            <pre className="p-2 bg-slate-900 rounded-lg text-[10px] font-mono text-slate-300 border border-slate-800 overflow-x-auto">
                              <code>{issue.snippet}</code>
                            </pre>
                          )}

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
            ) : null
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300">Previous Test Execution Runs</h4>
              {isLoadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <Loader2 className="size-6 text-emerald-400 animate-spin" />
                  <p className="text-xs">Loading execution history...</p>
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((run) => (
                    <div
                      key={run.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold font-mono text-sm ${
                              run.scorePercent >= 90
                                ? "text-emerald-400"
                                : run.scorePercent >= 70
                                ? "text-amber-400"
                                : "text-rose-400"
                            }`}
                          >
                            {run.scorePercent}% Score
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({run.passedTests} / {run.totalTests} passed)
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Executed: {new Date(run.createdOn).toLocaleString()}
                        </p>
                      </div>

                      <span className="text-[10px] px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-400 font-mono">
                        Run #{run.id}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  No historical test runs recorded yet for this project.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
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
