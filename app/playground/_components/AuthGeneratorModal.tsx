'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  X,
  Zap,
  Lock,
  UserCheck,
} from 'lucide-react';
import {
  AuthProvider,
  AuthConfig,
  generateAuthSnippets,
  injectAuthIntoProject,
} from '@/lib/aiAuthEngine';

interface AuthGeneratorModalProps {
  filesMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onApplyAuth: (updatedFilesMap: Record<string, string>) => void;
}

export default function AuthGeneratorModal({
  filesMap,
  isOpen,
  onClose,
  onApplyAuth,
}: AuthGeneratorModalProps) {
  const [provider, setProvider] = useState<AuthProvider>('clerk');
  const [enableGoogleOAuth, setEnableGoogleOAuth] = useState(true);
  const [enableGithubOAuth, setEnableGithubOAuth] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentConfig: AuthConfig = {
    provider,
    enableGoogleOAuth,
    enableGithubOAuth,
    requireEmailVerification,
  };

  const previewSnippets = generateAuthSnippets(currentConfig);

  const handleInjectAuth = () => {
    const updatedMap = injectAuthIntoProject(filesMap, currentConfig);
    onApplyAuth(updatedMap);
    setInjectedSuccess(`Successfully injected ${provider.toUpperCase()} Authentication files!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                AI Authentication & Security Engine
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                  Phase 11
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scaffold full authentication flows (Clerk, Supabase, NextAuth, Custom JWT) with 1-click injection.
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {injectedSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{injectedSuccess}</span>
            </div>
          )}

          {/* Auth Provider Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Select Auth Infrastructure Provider
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'clerk', name: 'Clerk Auth', desc: 'Managed User Management & Prebuilt UI' },
                { id: 'supabase', name: 'Supabase Auth', desc: 'Row Level Security & Database Auth' },
                { id: 'nextauth', name: 'NextAuth.js', desc: 'Open-Source OAuth & JWT Sessions' },
                { id: 'custom_jwt', name: 'Custom JWT', desc: 'Lightweight Client-Side JWT Auth' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProvider(p.id as AuthProvider);
                    setInjectedSuccess(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition ${
                    provider === p.id
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    {provider === p.id && <UserCheck className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* OAuth & Config Toggles */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" /> Authentication Guard Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableGoogleOAuth}
                  onChange={(e) => setEnableGoogleOAuth(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                Google OAuth SSO
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableGithubOAuth}
                  onChange={(e) => setEnableGithubOAuth(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                GitHub OAuth SSO
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireEmailVerification}
                  onChange={(e) => setRequireEmailVerification(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                Require Email Verification
              </label>
            </div>
          </div>

          {/* Code Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Generated Integration Files ({previewSnippets.length})
              </h4>
              <button
                onClick={handleInjectAuth}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
              >
                <Zap className="w-4 h-4" /> Inject Auth Files into Project
              </button>
            </div>

            <div className="space-y-4">
              {previewSnippets.map((snip, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{snip.title}</span>
                    <code className="text-[11px] font-mono text-emerald-400">{snip.targetFile}</code>
                  </div>
                  <p className="text-xs text-slate-400">{snip.description}</p>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-40">
                    {snip.code}
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
