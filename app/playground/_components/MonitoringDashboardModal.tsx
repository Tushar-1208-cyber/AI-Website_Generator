'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Rocket,
  Globe,
  ShieldCheck,
  CheckCircle2,
  X,
  Zap,
  Activity,
  ExternalLink,
  Clock,
} from 'lucide-react';
import {
  INITIAL_DEPLOYMENT,
  INITIAL_ANALYTICS,
  DeploymentStatus,
  triggerCloudDeployment,
} from '@/lib/deploymentMonitoringEngine';

interface MonitoringDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MonitoringDashboardModal({
  isOpen,
  onClose,
}: MonitoringDashboardModalProps) {
  const [deployment, setDeployment] = useState<DeploymentStatus>(INITIAL_DEPLOYMENT);
  const [analytics] = useState(INITIAL_ANALYTICS);
  const [customDomainInput, setCustomDomainInput] = useState(INITIAL_DEPLOYMENT.customDomain || '');
  const [selectedProvider, setSelectedProvider] = useState<DeploymentStatus['provider']>('vercel');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploySuccess(null);
    const updatedDep = await triggerCloudDeployment(selectedProvider, customDomainInput);
    setDeployment(updatedDep);
    setIsDeploying(false);
    setDeploySuccess(`Production build deployed successfully to ${selectedProvider.toUpperCase()}!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Production Deployment & Real-Time Analytics Dashboard
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                  Phase 21 (Final Phase)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Multi-cloud deployment pipeline, custom domain SSL provisioning, and live Core Web Vitals telemetry.
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
          {deploySuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{deploySuccess}</span>
            </div>
          )}

          {/* Top Live Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400">Monthly Visitors</span>
              <div className="text-2xl font-extrabold text-white">
                {analytics.monthlyVisitors.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">↑ +14.2% this month</span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400">Active Live Users</span>
              <div className="text-2xl font-extrabold text-indigo-400 flex items-center gap-2">
                <Activity className="w-5 h-5 animate-pulse text-indigo-400" />
                {analytics.activeLiveUsers}
              </div>
              <span className="text-[10px] text-slate-400">Real-time socket sessions</span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400">Avg Response Latency</span>
              <div className="text-2xl font-extrabold text-emerald-400">
                {analytics.avgLoadTimeMs}ms
              </div>
              <span className="text-[10px] text-slate-400">Global Edge Network</span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400">Error Rate</span>
              <div className="text-2xl font-extrabold text-emerald-400">
                {analytics.errorRatePercent}%
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">99.99% Uptime SLA</span>
            </div>
          </div>

          {/* Production Deployment Status Box */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Production Environment Status
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                      ● {deployment.status}
                    </span>
                  </h3>
                  <a
                    href={deployment.productionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    {deployment.productionUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {deployment.sslActive && (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-lg flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> SSL Secured
                  </span>
                )}
                <span className="px-3 py-1 bg-slate-900 text-slate-400 border border-slate-800 rounded-lg font-mono">
                  {deployment.provider.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Cloud Provider & Custom Domain Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-900">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Deployment Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as DeploymentStatus['provider'])}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="vercel">Vercel Edge Network</option>
                  <option value="netlify">Netlify Global CDN</option>
                  <option value="cloudflare">Cloudflare Pages</option>
                  <option value="aws">AWS Amplify Serverless</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Custom Domain DNS</label>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
                  <Globe className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="my-domain.com"
                    className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {isDeploying ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isDeploying ? 'Deploying Build...' : 'Re-Deploy Production'}
                </button>
              </div>
            </div>
          </div>

          {/* Real-Time Request Logs */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> Live HTTP Request Telemetry
            </h4>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
              {analytics.requestLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-1 border-b border-slate-900">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[11px]">{log.timestamp}</span>
                    <span className="text-emerald-400 font-bold">{log.method}</span>
                    <span className="text-slate-200">{log.path}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="text-emerald-400 font-semibold">{log.status} OK</span>
                    <span className="text-slate-500">{log.latencyMs}ms</span>
                  </div>
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
