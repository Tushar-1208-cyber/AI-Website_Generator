'use client';

import React, { useState, useMemo } from 'react';
import {
  Gauge,
  Zap,
  CheckCircle2,
  X,
  ShieldCheck,
  AlertCircle,
  Search,
  Award,
} from 'lucide-react';
import {
  runPerformanceAudit,
  autoFixAuditIssues,
  AuditIssue,
} from '@/lib/performanceAuditEngine';

interface PerformanceAuditModalProps {
  filesMap: Record<string, string>;
  htmlCode: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyFixedCode: (fixedHtml: string) => void;
}

export default function PerformanceAuditModal({
  htmlCode,
  isOpen,
  onClose,
  onApplyFixedCode,
}: PerformanceAuditModalProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'performance' | 'accessibility' | 'best_practices' | 'seo'>('all');
  const [isFixing, setIsFixing] = useState(false);
  const [fixedHtmlState, setFixedHtmlState] = useState<string | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);

  const activeHtml = fixedHtmlState || htmlCode;

  const scores = useMemo(() => {
    if (!isOpen || !activeHtml) return null;
    return runPerformanceAudit(activeHtml);
  }, [isOpen, activeHtml]);

  if (!isOpen) return null;

  const handleAutoFix = () => {
    setIsFixing(true);
    setTimeout(() => {
      const { fixedHtml, fixesApplied } = autoFixAuditIssues(activeHtml);
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

  const filteredIssues = scores?.issues.filter((issue) => {
    if (activeCategory === 'all') return true;
    return issue.category === activeCategory;
  }) || [];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Real-Time Performance & Accessibility Engine
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                  Phase 16
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Lighthouse-grade audits for Core Web Vitals, WCAG 2.1 Accessibility, Best Practices, and SEO.
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
          {/* Lighthouse Score Cards */}
          {scores && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center ${getScoreColor(scores.performance)}`}>
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-2xl font-extrabold">{scores.performance}</span>
                <span className="text-xs font-medium mt-1">Performance</span>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center ${getScoreColor(scores.accessibility)}`}>
                <ShieldCheck className="w-5 h-5 mb-1" />
                <span className="text-2xl font-extrabold">{scores.accessibility}</span>
                <span className="text-xs font-medium mt-1">Accessibility</span>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center ${getScoreColor(scores.bestPractices)}`}>
                <Award className="w-5 h-5 mb-1" />
                <span className="text-2xl font-extrabold">{scores.bestPractices}</span>
                <span className="text-xs font-medium mt-1">Best Practices</span>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col items-center justify-center ${getScoreColor(scores.seo)}`}>
                <Search className="w-5 h-5 mb-1" />
                <span className="text-2xl font-extrabold">{scores.seo}</span>
                <span className="text-xs font-medium mt-1">SEO</span>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Overall Audit Rating: {scores?.overall}/100</h4>
                <p className="text-xs text-slate-400">
                  {scores?.issues.length === 0
                    ? '100/100 Perfect Lighthouse Score! No audit issues detected.'
                    : `${scores?.issues.length} audit issue(s) found. 1-Click Auto-Optimize available.`}
                </p>
              </div>
            </div>

            <button
              onClick={handleAutoFix}
              disabled={isFixing || scores?.issues.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
            >
              {isFixing ? <Zap className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Auto-Optimize Site (Target 100/100)
            </button>
          </div>

          {/* Applied Fixes Feedback */}
          {appliedFixes.length > 0 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Applied Audit Auto-Fixes:
              </h4>
              <ul className="text-xs text-emerald-200/90 list-disc list-inside space-y-1">
                {appliedFixes.map((fix, idx) => (
                  <li key={idx}>{fix}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeCategory === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Issues ({scores?.issues.length || 0})
            </button>
            <button
              onClick={() => setActiveCategory('accessibility')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeCategory === 'accessibility' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Accessibility
            </button>
            <button
              onClick={() => setActiveCategory('performance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeCategory === 'performance' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveCategory('seo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeCategory === 'seo' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              SEO
            </button>
          </div>

          {/* Issue List */}
          <div className="space-y-3">
            {filteredIssues.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm text-slate-300 font-medium">All checks passed cleanly!</p>
                <p className="text-xs text-slate-500">Your site code adheres to Lighthouse 100/100 standards.</p>
              </div>
            ) : (
              filteredIssues.map((issue: AuditIssue) => (
                <div key={issue.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{issue.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {issue.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{issue.description}</p>
                    <div className="mt-2 text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-emerald-300 font-mono">
                      💡 Fix: {issue.fixSuggestion}
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
