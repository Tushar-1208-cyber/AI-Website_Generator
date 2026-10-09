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
  Download,
  Code2,
  HelpCircle,
} from 'lucide-react';
import {
  runPerformanceAudit,
  runProjectPerformanceAudit,
  autoFixAuditIssues,
  autoFixProjectAuditIssues,
  AuditScores,
} from '@/lib/performanceAuditEngine';
import { runSeoAudit, SeoAuditReport } from '@/lib/seoAuditEngine';
import { runAccessibilityAudit, AccessibilityAuditReport } from '@/lib/accessibilityAuditEngine';

interface PerformanceAuditModalProps {
  filesMap?: Record<string, string>;
  htmlCode: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyFixedCode: (fixedHtml: string) => void;
  onOpenFile?: (filePath: string, line?: number) => void;
}

export default function PerformanceAuditModal({
  filesMap,
  htmlCode,
  isOpen,
  onClose,
  onApplyFixedCode,
  onOpenFile,
}: PerformanceAuditModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'seo' | 'accessibility' | 'performance'>('all');
  const [isFixing, setIsFixing] = useState(false);
  const [fixedHtmlState, setFixedHtmlState] = useState<string | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);

  const activeHtml = fixedHtmlState || htmlCode;
  const currentFilesMap = useMemo(() => {
    if (filesMap && Object.keys(filesMap).length > 0) return filesMap;
    return { 'index.html': activeHtml };
  }, [filesMap, activeHtml]);

  // Run real SEO, Accessibility, and Performance audits
  const seoReport: SeoAuditReport | null = useMemo(() => {
    if (!isOpen) return null;
    return runSeoAudit(currentFilesMap);
  }, [isOpen, currentFilesMap]);

  const accReport: AccessibilityAuditReport | null = useMemo(() => {
    if (!isOpen) return null;
    return runAccessibilityAudit(currentFilesMap);
  }, [isOpen, currentFilesMap]);

  const perfScores: AuditScores | null = useMemo(() => {
    if (!isOpen) return null;
    if (filesMap && Object.keys(filesMap).length > 0) {
      return runProjectPerformanceAudit(filesMap);
    }
    return runPerformanceAudit(activeHtml);
  }, [isOpen, activeHtml, filesMap]);

  if (!isOpen) return null;

  const handleAutoFix = () => {
    setIsFixing(true);
    setTimeout(() => {
      if (filesMap && Object.keys(filesMap).length > 0) {
        const { updatedFilesMap, fixesApplied } = autoFixProjectAuditIssues(filesMap);
        const mainCode = updatedFilesMap['index.html'] || updatedFilesMap['App.jsx'] || Object.values(updatedFilesMap)[0] || activeHtml;
        onApplyFixedCode(mainCode);
        setFixedHtmlState(mainCode);
        setAppliedFixes(fixesApplied);
      } else {
        const { fixedHtml, fixesApplied } = autoFixAuditIssues(activeHtml);
        onApplyFixedCode(fixedHtml);
        setFixedHtmlState(fixedHtml);
        setAppliedFixes(fixesApplied);
      }
      setIsFixing(false);
    }, 400);
  };

  const handleExportJson = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      seo: seoReport,
      accessibility: accReport,
      performance: perfScores,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleModalClose = () => {
    setFixedHtmlState(null);
    setAppliedFixes([]);
    onClose();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Production-Grade SEO, Accessibility & Performance Audit Engine
              </h2>
              <p className="text-xs text-slate-400">
                Lighthouse & WCAG 2.1 AA compliant audit checks with evidence & automated patch fixes
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Cards Banner */}
        <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 grow">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center ${getScoreColor(seoReport?.scorePercent || 100)}`}>
              <Search className="w-6 h-6 mb-1" />
              <span className="text-3xl font-extrabold">{seoReport?.scorePercent || 100}%</span>
              <span className="text-xs font-semibold mt-1">SEO Rating</span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                ({seoReport?.passedCount} / {seoReport?.totalChecks} checks passed)
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center ${getScoreColor(accReport?.scorePercent || 100)}`}>
              <ShieldCheck className="w-6 h-6 mb-1" />
              <span className="text-3xl font-extrabold">{accReport?.scorePercent || 100}%</span>
              <span className="text-xs font-semibold mt-1">Accessibility (WCAG 2.1)</span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                ({accReport?.passedCount} passed, {accReport?.failedCount} failed)
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center ${getScoreColor(perfScores?.performance || 100)}`}>
              <Zap className="w-6 h-6 mb-1" />
              <span className="text-3xl font-extrabold">{perfScores?.performance || 100}%</span>
              <span className="text-xs font-semibold mt-1">Performance Payload</span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                ({perfScores?.metrics?.totalTransferSizeKB || 0} KB transfer payload)
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Automated AI Fix & Optimization</h4>
                <p className="text-xs text-slate-400">
                  Automatically remediates meta tags, alt tags, script deferral & viewport configurations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                Export JSON Report
              </button>

              <button
                onClick={handleAutoFix}
                disabled={isFixing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${isFixing ? 'animate-spin' : ''}`} />
                Auto-Optimize All
              </button>
            </div>
          </div>

          {/* Applied Fixes Feedback */}
          {appliedFixes.length > 0 && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-1.5">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Applied Audit Auto-Fixes:
              </h4>
              <ul className="text-xs text-emerald-200/90 list-disc list-inside space-y-1 font-mono text-[11px]">
                {appliedFixes.map((fix, idx) => (
                  <li key={idx}>{fix}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Audits
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'seo' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              SEO ({seoReport?.findings.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('accessibility')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'accessibility' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Accessibility ({accReport?.findings.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'performance' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Performance ({perfScores?.issues.length || 0})
            </button>
          </div>

          {/* Findings Content */}
          <div className="space-y-3">
            {/* SEO Findings */}
            {(activeTab === 'all' || activeTab === 'seo') && seoReport && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-400" /> SEO Audit Findings ({seoReport.findings.length})
                </h4>
                {seoReport.findings.length === 0 ? (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-medium">
                    ✓ All SEO meta tags, title lengths, and sitemap requirements passed cleanly!
                  </div>
                ) : (
                  seoReport.findings.map((f) => (
                    <div key={f.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 font-mono text-[11px] flex items-center gap-2">
                          <span>[SEO]</span>
                          <span className="text-slate-200">{f.filePath}</span>
                          {f.lineNumber && <span className="text-slate-500">Line {f.lineNumber}</span>}
                        </span>
                        {onOpenFile && (
                          <button
                            onClick={() => {
                              onOpenFile(f.filePath, f.lineNumber || 1);
                              onClose();
                            }}
                            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-lg"
                          >
                            <Code2 className="w-3 h-3" /> Jump to Code
                          </button>
                        )}
                      </div>
                      <p className="text-slate-200 font-medium">{f.evidence}</p>
                      <p className="text-[10px] text-slate-400 italic">💡 Recommendation: {f.recommendation}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Accessibility Findings */}
            {(activeTab === 'all' || activeTab === 'accessibility') && accReport && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> WCAG 2.1 Accessibility Findings ({accReport.findings.length})
                </h4>
                {accReport.findings.map((f) => (
                  <div key={f.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          f.status === 'FAIL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          f.status === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {f.status}
                        </span>
                        <span className="font-semibold text-slate-300 font-mono text-[11px]">{f.wcagRule}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{f.filePath}</span>
                      </div>
                      {onOpenFile && (
                        <button
                          onClick={() => {
                            onOpenFile(f.filePath, f.lineNumber || 1);
                            onClose();
                          }}
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-lg"
                        >
                          <Code2 className="w-3 h-3" /> Jump to Code
                        </button>
                      )}
                    </div>
                    <p className="text-slate-200 font-medium">{f.evidence}</p>
                    <p className="text-[10px] text-slate-400 italic">💡 Recommendation: {f.recommendation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Performance Findings & Payload Metrics */}
            {(activeTab === 'all' || activeTab === 'performance') && perfScores && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> Performance & Payload Audit
                </h4>

                {/* Metrics Box */}
                {perfScores.metrics && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Transfer Payload</span>
                      <p className="font-bold text-slate-200 text-sm font-mono">{perfScores.metrics.totalTransferSizeKB} KB</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Resources</span>
                      <p className="font-bold text-slate-200 text-sm font-mono">{perfScores.metrics.totalResourceCount} files</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Scripts & Stylesheets</span>
                      <p className="font-bold text-slate-200 text-sm font-mono">{perfScores.metrics.scriptCount} JS / {perfScores.metrics.stylesheetCount} CSS</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Image Elements</span>
                      <p className="font-bold text-slate-200 text-sm font-mono">{perfScores.metrics.imageCount} images</p>
                    </div>
                  </div>
                )}

                {/* Unmeasured metrics notice */}
                {perfScores.metrics?.unmeasuredMetrics && (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Live Core Web Vitals (LCP, CLS, FID) are labeled &quot;Not measured&quot; in offline audit mode until live user session preview.</span>
                  </div>
                )}

                {perfScores.issues.map((issue) => (
                  <div key={issue.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 font-mono text-[11px]">
                        [{issue.title}] {issue.filePath}
                      </span>
                      {onOpenFile && issue.filePath && (
                        <button
                          onClick={() => {
                            onOpenFile(issue.filePath!, issue.lineNumber || 1);
                            onClose();
                          }}
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-lg"
                        >
                          <Code2 className="w-3 h-3" /> Jump to Code
                        </button>
                      )}
                    </div>
                    <p className="text-slate-200 font-medium">{issue.description}</p>
                    <p className="text-[10px] text-slate-400 italic">💡 Fix: {issue.fixSuggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end shrink-0">
          <button
            onClick={handleModalClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
