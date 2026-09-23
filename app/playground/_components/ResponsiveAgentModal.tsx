'use client';

import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  analyzeResponsiveness,
  autoFixResponsiveness,
  ResponsiveIssue,
} from '@/lib/responsiveAgentEngine';

interface ResponsiveAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlCode: string;
  onApplyFixedCode: (fixedHtml: string) => void;
}

export default function ResponsiveAgentModal({
  isOpen,
  onClose,
  htmlCode,
  onApplyFixedCode,
}: ResponsiveAgentModalProps) {
  const [activeViewport, setActiveViewport] = useState<'all' | 'desktop' | 'tablet' | 'mobile'>('all');
  const [isFixing, setIsFixing] = useState(false);
  const [fixedHtmlState, setFixedHtmlState] = useState<string | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);

  const activeHtml = fixedHtmlState || htmlCode;

  const analysis = useMemo(() => {
    if (!isOpen || !activeHtml) return null;
    return analyzeResponsiveness(activeHtml);
  }, [isOpen, activeHtml]);

  if (!isOpen) return null;

  const handleAutoFix = () => {
    setIsFixing(true);
    setTimeout(() => {
      const { fixedHtml, fixesApplied } = autoFixResponsiveness(activeHtml);
      onApplyFixedCode(fixedHtml);
      setFixedHtmlState(fixedHtml);
      setAppliedFixes(fixesApplied);
      setIsFixing(false);
    }, 600);
  };

  const handleModalClose = () => {
    setFixedHtmlState(null);
    setAppliedFixes([]);
    onClose();
  };

  const filteredIssues = analysis?.issues.filter((issue) => {
    if (activeViewport === 'all') return true;
    return issue.viewport === activeViewport || issue.viewport === 'all';
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Responsive AI Agent
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                  Phase 9
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Audits layout grid breakpoints, typography scaling, and touch targets across screen sizes.
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Audit Score Banner */}
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center items-center text-center">
                <span className="text-xs text-slate-400 mb-1">Responsiveness Score</span>
                <div
                  className={`text-3xl font-extrabold ${
                    analysis.score >= 80
                      ? 'text-emerald-400'
                      : analysis.score >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {analysis.score} / 100
                </div>
              </div>

              <div className="md:col-span-3 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" /> Audit Summary
                  </h4>
                  <p className="text-xs text-slate-300">{analysis.summary}</p>
                </div>
                <button
                  onClick={handleAutoFix}
                  disabled={isFixing || analysis.issues.length === 0}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition shrink-0 shadow-lg shadow-indigo-600/20"
                >
                  {isFixing ? (
                    <Zap className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Auto-Fix Responsiveness
                </button>
              </div>
            </div>
          )}

          {/* Viewport Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveViewport('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeViewport === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Viewports ({analysis?.issues.length || 0})
              </button>
              <button
                onClick={() => setActiveViewport('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  activeViewport === 'desktop'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop (1280px+)
              </button>
              <button
                onClick={() => setActiveViewport('tablet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  activeViewport === 'tablet'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" /> Tablet (768px)
              </button>
              <button
                onClick={() => setActiveViewport('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  activeViewport === 'mobile'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile (375px)
              </button>
            </div>
          </div>

          {/* Applied Fixes Feedback */}
          {appliedFixes.length > 0 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Applied AI Remediation Fixes:
              </h4>
              <ul className="text-xs text-emerald-200/90 list-disc list-inside space-y-1">
                {appliedFixes.map((fix, idx) => (
                  <li key={idx}>{fix}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detected Issues List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Detected Layout Issues</h3>
            {filteredIssues.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm text-slate-300 font-medium">No layout bugs detected for this viewport!</p>
                <p className="text-xs text-slate-500">Your site layout adheres to responsive design best practices.</p>
              </div>
            ) : (
              filteredIssues.map((issue: ResponsiveIssue) => (
                <div
                  key={issue.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3"
                >
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      issue.severity === 'critical'
                        ? 'text-rose-400'
                        : issue.severity === 'warning'
                        ? 'text-amber-400'
                        : 'text-indigo-400'
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white">{issue.message}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase ${
                          issue.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : issue.severity === 'warning'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      <strong className="text-slate-300">Target Element:</strong> {issue.elementSelector}
                    </p>
                    <div className="mt-2 text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-indigo-300 font-mono">
                      💡 Suggested Fix: {issue.suggestedFix}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={handleModalClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
