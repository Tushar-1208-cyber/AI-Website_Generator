'use client';

import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  X,
  Zap,
  Users,
  Terminal,
  Activity,
} from 'lucide-react';
import {
  SWARM_AGENTS_INITIAL,
  SwarmAgent,
  executeSwarmMission,
  SwarmMissionResult,
} from '@/lib/multiAgentSwarmEngine';

interface MultiAgentSwarmModalProps {
  filesMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onApplySwarmUpdates: (updatedFilesMap: Record<string, string>) => void;
}

export default function MultiAgentSwarmModal({
  filesMap,
  isOpen,
  onClose,
  onApplySwarmUpdates,
}: MultiAgentSwarmModalProps) {
  const [agents, setAgents] = useState<SwarmAgent[]>(SWARM_AGENTS_INITIAL);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-frontend');
  const [missionPrompt, setMissionPrompt] = useState<string>(
    'Optimize full-stack SaaS application with high-converting copy, responsive layout, and secure API backend.'
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<SwarmMissionResult | null>(null);

  if (!isOpen) return null;

  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const handleLaunchSwarm = async () => {
    setIsExecuting(true);
    setLastResult(null);

    const result = await executeSwarmMission(missionPrompt, filesMap, (updatedAgents) => {
      setAgents(updatedAgents);
    });

    setLastResult(result);
    setIsExecuting(false);

    if (result.updatedFilesMap) {
      onApplySwarmUpdates(result.updatedFilesMap);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Multi-Agent AI Swarm Orchestration
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
                  Phase 15
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                5 Specialized AI subagents (Frontend, Backend, Security, QA, Copywriter) executing in parallel.
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
          {/* Active Subagents Roster */}
          <div className="p-4 border-r border-slate-800 bg-slate-950 space-y-4 overflow-y-auto">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Swarm Subagents ({agents.length})
            </h3>

            <div className="space-y-2.5">
              {agents.map((ag) => (
                <button
                  key={ag.id}
                  onClick={() => setSelectedAgentId(ag.id)}
                  className={`w-full text-left p-3 rounded-xl border transition space-y-2 ${
                    selectedAgentId === ag.id
                      ? 'bg-purple-500/10 border-purple-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ag.avatar}</span>
                      <span className="text-xs font-bold text-white">{ag.name}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                        ag.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : ag.status === 'working'
                          ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ag.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${ag.progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mission Control & Selected Agent Log Stream */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-6 bg-slate-900">
            {/* Mission Launch Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" /> Swarm Mission Goal Prompt
              </h4>
              <textarea
                value={missionPrompt}
                onChange={(e) => setMissionPrompt(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleLaunchSwarm}
                  disabled={isExecuting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-purple-600/20"
                >
                  {isExecuting ? (
                    <Activity className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  {isExecuting ? 'Swarm Working Concurrently...' : 'Execute Swarm Mission'}
                </button>
              </div>
            </div>

            {lastResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Swarm Mission Completed at {lastResult.completedAt}!
                </h4>
                <ul className="text-xs text-emerald-200/90 list-disc list-inside space-y-1">
                  {lastResult.agentSummaries.map((s, idx) => (
                    <li key={idx}>
                      <strong className="text-white">{s.agentName}:</strong> {s.actionTaken}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Selected Agent Live Terminal Logs */}
            {activeAgent && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-400" /> Activity Stream: {activeAgent.avatar} {activeAgent.name}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    Status: <code className="text-purple-300">{activeAgent.status}</code>
                  </span>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 space-y-1 max-h-56 overflow-y-auto">
                  {activeAgent.logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-purple-500 select-none">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
