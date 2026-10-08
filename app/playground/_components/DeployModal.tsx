"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  X,
  Rocket,
  Loader2,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  History,
} from "lucide-react";
import {
  DeploymentStep,
  DeploymentResult,
  RealDeploymentRecord,
  executeRealDeployment,
  fetchDeploymentHistory,
} from "@/lib/liveDeployer";

interface DeployModalProps {
  projectId: string;
  filesCount?: number;
  filesMap?: Record<string, string>;
  onClose: () => void;
}

export default function DeployModal({
  projectId,
  filesCount = 1,
  filesMap,
  onClose,
}: DeployModalProps) {
  const [steps, setSteps] = useState<DeploymentStep[]>([]);
  const [result, setResult] = useState<DeploymentResult | null>(null);
  const [isDeploying, setIsDeploying] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<RealDeploymentRecord[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const startDeployment = async () => {
    setIsDeploying(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const deployRes = await executeRealDeployment(
        projectId,
        filesMap,
        (_stepId, currentSteps) => {
          setSteps(currentSteps);
        }
      );
      setResult(deployRes);
      setIsDeploying(false);
      loadHistory();
    } catch (err: any) {
      console.error("Vercel Real Deployment error:", err);
      setErrorMsg(err.message || "Failed to deploy to Vercel.");
      setIsDeploying(false);
    }
  };

  const loadHistory = async () => {
    const historyData = await fetchDeploymentHistory(projectId);
    setHistory(historyData);
  };

  useEffect(() => {
    startDeployment();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Rocket className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Real Vercel Production Deploy
                <Sparkles className="size-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Deploying website directly to Vercel Global Edge Network
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
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {/* Action Tabs Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300">
              {showHistory ? "Deployment History" : "Deployment Status"}
            </span>
            <button
              onClick={() => setShowHistory((prev) => !prev)}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 transition-all"
            >
              <History className="size-3" />
              {showHistory ? "Show Current Deploy" : `History (${history.length})`}
            </button>
          </div>

          {!showHistory ? (
            <>
              {/* Progress Steps */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                {steps.map((step) => {
                  const isDone = step.status === "completed";
                  const isInProgress = step.status === "in_progress";
                  const isErr = step.status === "error";

                  return (
                    <div key={step.id} className="flex items-center gap-3 text-xs font-medium">
                      {isDone ? (
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                      ) : isInProgress ? (
                        <Loader2 className="size-4 text-blue-400 animate-spin shrink-0" />
                      ) : isErr ? (
                        <AlertTriangle className="size-4 text-rose-500 shrink-0" />
                      ) : (
                        <div className="size-4 rounded-full border border-slate-700 shrink-0" />
                      )}
                      <span
                        className={
                          isDone
                            ? "text-slate-200"
                            : isInProgress
                            ? "text-blue-400 font-semibold"
                            : isErr
                            ? "text-rose-400 font-semibold"
                            : "text-slate-500"
                        }
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Error Message View */}
              {errorMsg && (
                <div className="bg-rose-950/40 border border-rose-800/50 rounded-2xl p-4 text-rose-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-400">
                    <AlertTriangle className="size-4" />
                    <span>Vercel Deployment Failed</span>
                  </div>
                  <p className="leading-relaxed">{errorMsg}</p>
                  <button
                    onClick={startDeployment}
                    className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <RefreshCw className="size-3.5" /> Retry Deployment
                  </button>
                </div>
              )}

              {/* Deployment Complete View */}
              {result && !isDeploying && (
                <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-300">
                  {/* URL Box */}
                  <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-950 border border-blue-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                        <Globe className="size-3.5" /> Real Vercel URL
                      </span>
                      <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="size-3" /> SSL Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-xs font-mono font-medium text-slate-200 truncate select-all">
                        {result.url}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={handleCopy}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check className="size-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center"
                          title="Open in new tab"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Redeploy Button */}
                  <button
                    onClick={startDeployment}
                    disabled={isDeploying}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Redeploy Latest Changes</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* History Section */
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No previous deployment records found for this project.
                </p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            item.status === "READY"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.createdOn).toLocaleString()}
                        </span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-400 hover:underline truncate block"
                      >
                        {item.url}
                      </a>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded shrink-0"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Powered by Vercel REST API v13
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
