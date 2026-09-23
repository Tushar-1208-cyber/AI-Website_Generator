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
} from "lucide-react";
import {
  DeploymentStep,
  DeploymentResult,
  simulateDeployment,
} from "@/lib/liveDeployer";

interface DeployModalProps {
  projectId: string;
  filesCount: number;
  onClose: () => void;
}

export default function DeployModal({
  projectId,
  filesCount,
  onClose,
}: DeployModalProps) {
  const [steps, setSteps] = useState<DeploymentStep[]>([]);
  const [result, setResult] = useState<DeploymentResult | null>(null);
  const [isDeploying, setIsDeploying] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function runDeploy() {
      try {
        const deployRes = await simulateDeployment(
          projectId,
          filesCount,
          (_stepId, currentSteps) => {
            if (isMounted) setSteps(currentSteps);
          }
        );
        if (isMounted) {
          setResult(deployRes);
          setIsDeploying(false);
        }
      } catch (err) {
        console.error("Deploy failed", err);
        if (isMounted) setIsDeploying(false);
      }
    }

    runDeploy();

    return () => {
      isMounted = false;
    };
  }, [projectId, filesCount]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Rocket className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                One-Click Live Web Deploy
                <Sparkles className="size-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Deploying website to Vercel Global Edge Network
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
        <div className="p-6 space-y-6">
          {/* Progress Steps */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            {steps.map((step) => {
              const isDone = step.status === "completed";
              const isInProgress = step.status === "in_progress";

              return (
                <div key={step.id} className="flex items-center gap-3 text-xs font-medium">
                  {isDone ? (
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  ) : isInProgress ? (
                    <Loader2 className="size-4 text-blue-400 animate-spin shrink-0" />
                  ) : (
                    <div className="size-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span
                    className={
                      isDone
                        ? "text-slate-200"
                        : isInProgress
                        ? "text-blue-400 font-semibold"
                        : "text-slate-500"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Deployment Complete View */}
          {result && !isDeploying && (
            <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-300">
              {/* URL Box */}
              <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-950 border border-blue-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                    <Globe className="size-3.5" /> Live Production URL
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

              {/* Deployment Details */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-medium">Pages Deployed</p>
                  <p className="text-sm font-bold text-slate-100">{result.pagesCount} Pages</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-medium">Region Edge</p>
                  <p className="text-sm font-bold text-slate-100">Global CDN (Anycast)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Automated Live Web Hosting
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
