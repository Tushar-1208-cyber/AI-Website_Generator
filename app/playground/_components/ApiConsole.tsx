"use client";

import React, { useState, useMemo } from "react";
import { ProjectFilesMap } from "@/types/types";
import {
  discoverApiEndpoints,
  executeSimulatedApiCall,
  DiscoveredEndpoint,
  ApiResponse,
} from "@/lib/apiSimulator";
import { Send, Terminal, Database, Copy, Check, Server, RefreshCw } from "lucide-react";

interface ApiConsoleProps {
  filesMap: ProjectFilesMap;
}

export default function ApiConsole({ filesMap }: ApiConsoleProps) {
  const discoveredEndpoints = useMemo(() => discoverApiEndpoints(filesMap), [filesMap]);

  const [selectedMethod, setSelectedMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [urlPath, setUrlPath] = useState<string>("/api/items");
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify({ name: "Sample Product", price: 29.99, category: "Electronics" }, null, 2)
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectEndpoint = (endpoint: DiscoveredEndpoint) => {
    setSelectedMethod(endpoint.method);
    setUrlPath(endpoint.path);
    if (endpoint.sampleBody) {
      setRequestBody(endpoint.sampleBody);
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const res = await executeSimulatedApiCall(selectedMethod, urlPath, requestBody, filesMap);
      setResponse(res);
    } catch (err) {
      setResponse({
        status: 500,
        statusText: "Internal Server Error",
        data: { error: err instanceof Error ? err.message : String(err) },
        timeMs: 0,
        logs: [`[Server Error] ${err}`],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-600/30 text-blue-400 border-blue-500/40";
      case "POST":
        return "bg-emerald-600/30 text-emerald-400 border-emerald-500/40";
      case "PUT":
        return "bg-amber-600/30 text-amber-400 border-amber-500/40";
      case "DELETE":
        return "bg-rose-600/30 text-rose-400 border-rose-500/40";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  const getStatusBadgeColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (status >= 400 && status < 500) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-rose-500/20 text-rose-400 border-rose-500/30";
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar: Discovered Endpoints */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">API Endpoints</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
            {discoveredEndpoints.length} routes
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {discoveredEndpoints.length === 0 ? (
            <div className="text-xs text-slate-500 p-3 italic">No API routes detected</div>
          ) : (
            discoveredEndpoints.map((ep, idx) => (
              <div
                key={`${ep.method}-${ep.path}-${idx}`}
                onClick={() => handleSelectEndpoint(ep)}
                className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-all border ${
                  urlPath === ep.path && selectedMethod === ep.method
                    ? "bg-blue-900/30 border-blue-500/50 text-slate-100"
                    : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getMethodBadgeColor(
                      ep.method
                    )}`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-xs font-mono truncate">{ep.path}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 flex items-center gap-1.5">
          <Database className="size-3 text-emerald-400" />
          <span>Full-Stack Node/Express API Simulator</span>
        </div>
      </div>

      {/* Right Area: Request & Response Console */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Request Header Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2">
          {/* Method Selector */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as "GET" | "POST" | "PUT" | "DELETE")}
            className={`bg-slate-900 border text-xs font-mono font-bold px-2 py-1.5 rounded focus:outline-none cursor-pointer ${getMethodBadgeColor(
              selectedMethod
            )}`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Endpoint Input */}
          <input
            type="text"
            value={urlPath}
            onChange={(e) => setUrlPath(e.target.value)}
            placeholder="/api/endpoint"
            className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono px-3 py-1.5 rounded focus:outline-none focus:border-blue-500"
          />

          {/* Send Request Button */}
          <button
            onClick={handleSendRequest}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Send
          </button>
        </div>

        {/* Console Workspace: Split into Request Body & Response Viewer */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Column: Request Payload (for POST / PUT) */}
          {(selectedMethod === "POST" || selectedMethod === "PUT") && (
            <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-950 p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Request JSON Body
              </span>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs p-3 rounded resize-none focus:outline-none focus:border-blue-500 leading-relaxed"
                spellCheck={false}
                placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
              />
            </div>
          )}

          {/* Right Column: Response & Server Terminal Output */}
          <div className="flex-1 flex flex-col bg-slate-950 p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Response Output
                </span>
                {response && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getStatusBadgeColor(
                        response.status
                      )}`}
                    >
                      {response.status} {response.statusText}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      {response.timeMs} ms
                    </span>
                  </div>
                )}
              </div>

              {response && (
                <button
                  onClick={handleCopyResponse}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-800 transition-colors"
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              )}
            </div>

            {/* Response JSON Viewer */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded p-3 font-mono text-xs text-slate-200 overflow-auto leading-relaxed">
              {response ? (
                <pre className="text-emerald-300">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                  <Terminal className="size-8" />
                  <p className="text-xs">Click &quot;Send&quot; or select an endpoint to test API execution.</p>
                </div>
              )}
            </div>

            {/* Terminal Server Logs Drawer */}
            {response && response.logs && response.logs.length > 0 && (
              <div className="mt-2 bg-slate-900/90 border border-slate-800 rounded p-2 text-[11px] font-mono text-slate-400 max-h-28 overflow-y-auto space-y-0.5">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Server Logs</div>
                {response.logs.map((log, i) => (
                  <div key={i} className="text-slate-300">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
