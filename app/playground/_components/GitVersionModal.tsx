"use client";

import React, { useState, useEffect } from "react";
import {
  GitBranch,
  GitCommit,
  RotateCcw,
  CheckCircle2,
  X,
  Plus,
  FileDiff,
  Github,
  ExternalLink,
  Shield,
  Lock,
  Globe,
  Upload,
  Key,
  LogOut,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  INITIAL_COMMITS,
  INITIAL_BRANCHES,
  VirtualCommit,
  VirtualBranch,
  computeFileDiff,
  createVirtualCommit,
  createVirtualBranch,
} from "@/lib/gitAgentEngine";

interface GitVersionModalProps {
  projectId?: string;
  filesMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onRestoreSnapshot: (restoredFilesMap: Record<string, string>) => void;
}

export interface GitHubRepoInfo {
  owner: string;
  repoName: string;
  branch: string;
  isPrivate: boolean;
  repoUrl: string;
}

export interface GitHubAccountInfo {
  username: string;
  avatarUrl?: string;
}

export default function GitVersionModal({
  projectId = "demo-project",
  filesMap,
  isOpen,
  onClose,
  onRestoreSnapshot,
}: GitVersionModalProps) {
  const [commits, setCommits] = useState<VirtualCommit[]>(INITIAL_COMMITS);
  const [branches, setBranches] = useState<VirtualBranch[]>(INITIAL_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState<string>("main");
  const [commitMessage, setCommitMessage] = useState<string>("");
  const [newBranchName, setNewBranchName] = useState<string>("");
  const [selectedCommitHash, setSelectedCommitHash] = useState<string>(commits[0]?.hash || "a8f8ab8");
  const [selectedDiffFile, setSelectedDiffFile] = useState<string>(
    Object.keys(filesMap)[0] || "index.html"
  );
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);

  // GitHub Real Integration State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<GitHubAccountInfo | null>(null);
  const [repository, setRepository] = useState<GitHubRepoInfo | null>(null);
  const [patToken, setPatToken] = useState<string>("");
  const [newRepoName, setNewRepoName] = useState<string>("");
  const [isPrivateRepo, setIsPrivateRepo] = useState<boolean>(true);
  const [realCommits, setRealCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch GitHub Connection Status & Linked Repository
  const fetchGitHubStatus = async () => {
    try {
      const res = await fetch(`/api/github/status?projectId=${encodeURIComponent(projectId)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setIsConnected(data.isConnected);
        setAccount(data.account || null);
        setRepository(data.repository || null);
        if (data.repository) {
          fetchRealCommits();
        }
      }
    } catch (err) {
      console.error("Failed to fetch GitHub status:", err);
    }
  };

  const fetchRealCommits = async () => {
    try {
      const res = await fetch(`/api/github/commits?projectId=${encodeURIComponent(projectId)}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.commits)) {
        setRealCommits(data.commits);
      }
    } catch (err) {
      console.error("Failed to fetch real GitHub commits:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGitHubStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleConnectPAT = async () => {
    if (!patToken.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/github/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: patToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to connect GitHub account.");
      }
      setIsConnected(true);
      setAccount(data.account);
      setPatToken("");
      setInjectedSuccess(`Successfully connected GitHub account @${data.account.username}!`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect token.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepo = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/github/repository", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          repoName: newRepoName || undefined,
          isPrivate: isPrivateRepo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create GitHub repository.");
      }
      setRepository(data.repository);
      setNewRepoName("");
      setInjectedSuccess(`Created & linked GitHub repository \`${data.repository.owner}/${data.repository.repoName}\`!`);
      fetchRealCommits();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create repository.");
    } finally {
      setLoading(false);
    }
  };

  const handlePushToGitHub = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          commitMessage: commitMessage || "feat: update project files via AI Builder",
          filesMap,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to push files to GitHub.");
      }
      setCommitMessage("");
      setInjectedSuccess(`Pushed commit \`${data.commit.shortSha}\` to GitHub repository!`);
      fetchRealCommits();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to push to GitHub.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/github/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action: "unlink_project" }),
      });
      setRepository(null);
      setInjectedSuccess("Unlinked repository from project. Repository remains safe on GitHub.");
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  const handleCreateCommit = () => {
    if (!commitMessage.trim()) return;
    const { updatedHistory, newCommit } = createVirtualCommit(commits, selectedBranch, commitMessage, filesMap);
    setCommits(updatedHistory);
    setSelectedCommitHash(newCommit.hash);
    setCommitMessage("");
    setInjectedSuccess(`Committed local snapshot \`${newCommit.hash}\`: ${newCommit.message}`);
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    const updatedBranches = createVirtualBranch(branches, newBranchName, commits[0]?.hash || "a8f8ab8");
    setBranches(updatedBranches);
    setSelectedBranch(newBranchName.trim().replace(/\s+/g, "-").toLowerCase());
    setNewBranchName("");
    setInjectedSuccess(`Created & switched to feature branch \`${newBranchName}\``);
  };

  const handleRestoreCommit = (commit: VirtualCommit) => {
    if (Object.keys(commit.filesSnapshot).length > 0) {
      onRestoreSnapshot(commit.filesSnapshot);
      setInjectedSuccess(`Restored project state to commit \`${commit.hash}\`!`);
    } else {
      setInjectedSuccess(`Commit \`${commit.hash}\` is a milestone marker.`);
    }
  };

  // Compute diff between active file and old version
  const currentFileContent = filesMap[selectedDiffFile] || "";
  const commitObj = commits.find((c) => c.hash === selectedCommitHash);
  const oldFileContent = commitObj?.filesSnapshot[selectedDiffFile] || currentFileContent;
  const diffResult = computeFileDiff(selectedDiffFile, oldFileContent, currentFileContent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 font-sans text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 text-white rounded-2xl border border-slate-700">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Production GitHub Integration & Version Control
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  GitHub API v3
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect GitHub, create repositories, push commits, and synchronize your project.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="size-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3">
          {/* GitHub Connection & Repo Controls Sidebar */}
          <div className="p-4 border-r border-slate-800 bg-slate-950 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {/* 1. Account Status Section */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Github className="size-3.5" /> GitHub Account
                </span>
                {isConnected ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Connected
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                    Not Connected
                  </span>
                )}
              </div>

              {!isConnected ? (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Connect using a GitHub Personal Access Token (with `repo` scope).
                  </p>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx..."
                      value={patToken}
                      onChange={(e) => setPatToken(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleConnectPAT}
                      disabled={loading || !patToken.trim()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all shrink-0 flex items-center gap-1"
                    >
                      {loading ? <Loader2 className="size-3 animate-spin" /> : <Key className="size-3" />}
                      Connect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {account?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={account.avatarUrl}
                        alt={account.username}
                        className="size-6 rounded-full border border-slate-700"
                      />
                    ) : (
                      <div className="size-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-blue-400">
                        @
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-200">@{account?.username}</span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    title="Unlink GitHub repository"
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                  >
                    <LogOut className="size-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* 2. Repository Link & Push Controls */}
            {isConnected && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                {!repository ? (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Plus className="size-3.5 text-blue-400" /> Create GitHub Repository
                    </h4>
                    <input
                      type="text"
                      placeholder="Repository name..."
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPrivateRepo}
                          onChange={(e) => setIsPrivateRepo(e.target.checked)}
                          className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                        />
                        <span>Private Repository</span>
                      </label>
                      {isPrivateRepo ? <Lock className="size-3 text-amber-400" /> : <Globe className="size-3 text-emerald-400" />}
                    </div>
                    <button
                      onClick={handleCreateRepo}
                      disabled={loading}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                      Create & Link Repository
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Linked Repository</span>
                        <a
                          href={repository.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono font-bold text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {repository.owner}/{repository.repoName}
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold">
                        {repository.branch}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Commit message..."
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handlePushToGitHub}
                        disabled={loading}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                      >
                        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                        Push Changes to GitHub
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. In-Browser Virtual Branching & Rollback */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <GitBranch className="size-3.5 text-emerald-400" /> Virtual Feature Branches
              </h3>
              <div className="flex gap-2">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                >
                  {branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      🌿 {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="New branch..."
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleCreateBranch}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Line Diff Viewer & Real GitHub Commit Timeline */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-4 bg-slate-900 scrollbar-thin scrollbar-thumb-slate-800">
            {injectedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{injectedSuccess}</span>
              </div>
            )}

            {/* Real GitHub Commits Timeline */}
            {realCommits.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Github className="size-4 text-white" /> Real GitHub Commits ({realCommits.length})
                  </h3>
                  {repository && (
                    <a
                      href={repository.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      View Repo <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                  {realCommits.map((item) => (
                    <div
                      key={item.sha}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <code className="text-emerald-400 font-mono font-bold text-[11px]">
                            {item.shortSha}
                          </code>
                          <span className="text-[10px] text-slate-400 font-medium truncate">
                            {item.message}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {item.author} • {new Date(item.date).toLocaleString()}
                        </span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg shrink-0"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diff Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 pt-2">
              <div className="flex items-center gap-2">
                <FileDiff className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Local Workspace Diff ({selectedDiffFile})
                </h3>
              </div>

              {/* Select file for diff */}
              <select
                value={selectedDiffFile}
                onChange={(e) => setSelectedDiffFile(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200"
              >
                {Object.keys(filesMap).map((path) => (
                  <option key={path} value={path}>
                    {path}
                  </option>
                ))}
              </select>
            </div>

            {/* Additions / Deletions Summary */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-emerald-400 font-semibold">+{diffResult.additions} additions</span>
              <span className="text-rose-400 font-semibold">-{diffResult.deletions} deletions</span>
            </div>

            {/* Line Diff Viewer Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs overflow-x-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-800">
              {diffResult.lines.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex items-center px-3 py-0.5 border-b border-slate-900/50 ${
                    line.type === "added"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : line.type === "removed"
                      ? "bg-rose-500/10 text-rose-300"
                      : "text-slate-400"
                  }`}
                >
                  <span className="w-8 text-right pr-2 text-slate-600 select-none text-[11px]">
                    {line.oldLineNum || ""}
                  </span>
                  <span className="w-8 text-right pr-2 text-slate-600 select-none text-[11px]">
                    {line.newLineNum || ""}
                  </span>
                  <span className="w-4 select-none">
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                  </span>
                  <span className="whitespace-pre">{line.content}</span>
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
