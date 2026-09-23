'use client';

import React, { useState } from 'react';
import {
  Plug,
  CreditCard,
  Mail,
  Bot,
  CheckCircle2,
  X,
  Zap,
  Key,
  FileCode,
} from 'lucide-react';
import {
  SUPPORTED_INTEGRATIONS,
  IntegrationDef,
  injectIntegration,
} from '@/lib/aiIntegrationsEngine';

interface IntegrationsModalProps {
  filesMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onApplyIntegration: (updatedFilesMap: Record<string, string>, addedPath: string) => void;
}

export default function IntegrationsModal({
  filesMap,
  isOpen,
  onClose,
  onApplyIntegration,
}: IntegrationsModalProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationDef>(SUPPORTED_INTEGRATIONS[0]);
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CreditCard':
        return <CreditCard className="w-5 h-5 text-indigo-400" />;
      case 'Mail':
        return <Mail className="w-5 h-5 text-emerald-400" />;
      case 'Bot':
      default:
        return <Bot className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleInject = () => {
    const updatedMap = injectIntegration(filesMap, selectedIntegration);
    const mainAddedPath = selectedIntegration.files[0].path;
    onApplyIntegration(updatedMap, mainAddedPath);
    setInjectedSuccess(`Successfully injected ${selectedIntegration.name} SDK and `.concat('.env.example keys!'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Plug className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                AI Third-Party Integrations Hub
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                  Phase 12
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1-Click scaffold integrations for Stripe Billing, Resend Email, OpenAI/Gemini, and Vector DBs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3">
          {/* Integration Sidebar */}
          <div className="p-4 border-r border-slate-800 bg-slate-950 space-y-3 overflow-y-auto">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Available SaaS Integrations
            </h3>
            {SUPPORTED_INTEGRATIONS.map((integ) => (
              <button
                key={integ.id}
                onClick={() => {
                  setSelectedIntegration(integ);
                  setInjectedSuccess(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-1.5 ${
                  selectedIntegration.id === integ.id
                    ? 'bg-blue-500/10 border-blue-500/40 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon(integ.iconName)}
                    <span className="text-xs font-bold text-white">{integ.name}</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-2">{integ.description}</span>
              </button>
            ))}
          </div>

          {/* Integration Details & Code Preview */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-6 bg-slate-900">
            {injectedSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{injectedSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  {getIcon(selectedIntegration.iconName)}
                  {selectedIntegration.name}
                </h3>
                <span className="text-xs text-slate-400">Category: {selectedIntegration.category}</span>
              </div>
              <button
                onClick={handleInject}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 transition shadow-lg shadow-blue-600/20"
              >
                <Zap className="w-4 h-4" /> Inject Integration Files
              </button>
            </div>

            {/* Required Environment Keys */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" /> Required Environment Keys (`.env.local`)
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedIntegration.envKeys.map((key) => (
                  <span key={key} className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-amber-300">
                    {key}
                  </span>
                ))}
              </div>
            </div>

            {/* Integration Generated Files */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" /> Integration Files To Be Created
              </h4>
              {selectedIntegration.files.map((fileDef, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold font-mono text-blue-400">{fileDef.path}</span>
                    <span className="text-[11px] text-slate-400">{fileDef.description}</span>
                  </div>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
                    {fileDef.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
