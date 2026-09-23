'use client';

import React, { useState } from 'react';
import {
  Server,
  Zap,
  Play,
  CheckCircle2,
  X,
  Code2,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import {
  PRESET_BACKEND_ENDPOINTS,
  ApiEndpoint,
  scaffoldBackendEndpoint,
  simulateEndpointCall,
} from '@/lib/aiBackendEngine';

interface BackendGeneratorModalProps {
  filesMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onInsertEndpoint: (updatedFilesMap: Record<string, string>, addedPath: string) => void;
}

export default function BackendGeneratorModal({
  filesMap,
  isOpen,
  onClose,
  onInsertEndpoint,
}: BackendGeneratorModalProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(PRESET_BACKEND_ENDPOINTS[0]);
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(PRESET_BACKEND_ENDPOINTS[0].samplePayload || {}, null, 2)
  );
  const [testResult, setTestResult] = useState<{ status: number; data: unknown; latencyMs: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [scaffoldSuccess, setScaffoldSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setTestPayload(JSON.stringify(ep.samplePayload || {}, null, 2));
    setTestResult(null);
    setScaffoldSuccess(null);
  };

  const handleRunTest = async () => {
    setIsSimulating(true);
    try {
      const parsed = JSON.parse(testPayload);
      const res = await simulateEndpointCall(selectedEndpoint, parsed);
      setTestResult(res);
    } catch {
      setTestResult({
        status: 400,
        data: { error: 'Invalid JSON payload in test body' },
        latencyMs: 10,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleInjectCode = () => {
    const updatedMap = scaffoldBackendEndpoint(filesMap, selectedEndpoint);
    const addedPath = `app${selectedEndpoint.path}/route.ts`;
    onInsertEndpoint(updatedMap, addedPath);
    setScaffoldSuccess(`Added serverless route \`${addedPath}\` to project explorer!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Full-Stack AI Backend Generator
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                  Phase 10
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scaffold Next.js App Router serverless API endpoints (/api/...) with dynamic mock execution.
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
          {/* Preset Endpoints Sidebar */}
          <div className="p-4 border-r border-slate-800 bg-slate-950 space-y-3 overflow-y-auto">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Serverless Templates
            </h3>
            {PRESET_BACKEND_ENDPOINTS.map((ep) => (
              <button
                key={ep.id}
                onClick={() => handleSelectEndpoint(ep)}
                className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 ${
                  selectedEndpoint.id === ep.id
                    ? 'bg-amber-500/10 border-amber-500/30 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold font-mono text-amber-400">
                    {ep.method} {ep.path}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                    {ep.category}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-200">{ep.title}</span>
                <span className="text-[11px] text-slate-400 line-clamp-2">{ep.description}</span>
              </button>
            ))}
          </div>

          {/* Endpoint Code & Test Console */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-6 bg-slate-900">
            {scaffoldSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{scaffoldSuccess}</span>
              </div>
            )}

            {/* Selected Route Info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-amber-400" />
                  {selectedEndpoint.title}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Target Route: <code className="text-amber-300">app{selectedEndpoint.path}/route.ts</code>
                </span>
              </div>
              <button
                onClick={handleInjectCode}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-600/20"
              >
                <Zap className="w-4 h-4" /> Inject into Project
              </button>
            </div>

            {/* Code Snippet Viewer */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">Serverless Route Code (`route.ts`)</h4>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto max-h-48">
                {selectedEndpoint.codeSnippet}
              </pre>
            </div>

            {/* API Test Runner */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" /> Playground Endpoint Simulator
                </h4>
                <button
                  onClick={handleRunTest}
                  disabled={isSimulating}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isSimulating ? 'Testing...' : 'Execute Request'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Request Body Editor */}
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Request Body (JSON)</label>
                  <textarea
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    rows={5}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Response Preview */}
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Response Output</label>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono min-h-[110px]">
                    {testResult ? (
                      <div>
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
                          <span
                            className={`font-semibold ${
                              testResult.status === 200 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            Status: {testResult.status} OK
                          </span>
                          <span className="text-[10px] text-slate-500">{testResult.latencyMs}ms</span>
                        </div>
                        <pre className="text-slate-300 text-[11px]">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-slate-600 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> Click &apos;Execute Request&apos; to test response.
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
