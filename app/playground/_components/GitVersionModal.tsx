'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  RotateCcw,
  CheckCircle2,
  X,
  Plus,
  FileDiff,
} from 'lucide-react';
import {
  INITIAL_COMMITS,
  INITIAL_BRANCHES,
  VirtualCommit,
  VirtualBranch,
  computeFileDiff,
  createVirtualCommit,
} from '@/lib/gitAgentEngine';

interface GitVersionModalProps {
  filesMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onRestoreSnapshot: (restoredFilesMap: Record<string, string>) => void;
}

export default function GitVersionModal({
  filesMap,
  isOpen,
  onClose,
  onRestoreSnapshot,
}: GitVersionModalProps) {
  const [commits, setCommits] = useState<VirtualCommit[]>(INITIAL_COMMITS);
  const [branches, setBranches] = useState<VirtualBranch[]>(INITIAL_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [selectedCommitHash, setSelectedCommitHash] = useState<string>(commits[0]?.hash || 'a8f8ab8');
  const [selectedDiffFile, setSelectedDiffFile] = useState<string>('index.html');
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateCommit = () => {
    if (!commitMessage.trim()) return;
    const { updatedHistory, newCommit } = createVirtualCommit(commits, selectedBranch, commitMessage, filesMap);
    setCommits(updatedHistory);
    setSelectedCommitHash(newCommit.hash);
    setCommitMessage('');
    setInjectedSuccess(`Committed snapshot \`${newCommit.hash}\`: ${newCommit.message}`);
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    const cleanName = newBranchName.trim().replace(/\s+/g, '-');
    const newBr: VirtualBranch = {
      name: cleanName,
      isCurrent: true,
      headCommitHash: commits[0]?.hash || 'a8f8ab8',
    };
    setBranches([...branches, newBr]);
    setSelectedBranch(cleanName);
    setNewBranchName('');
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
  const currentFileContent = filesMap[selectedDiffFile] || '';
  const commitObj = commits.find((c) => c.hash === selectedCommitHash);
  const oldFileContent = commitObj?.filesSnapshot[selectedDiffFile] || currentFileContent;

  const diffResult = computeFileDiff(selectedDiffFile, oldFileContent, currentFileContent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Git Version Control & Branching Agent
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                  Phase 14
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                In-browser Git timeline history, feature branch switching, line-by-line diffing, and rollbacks.
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
          {/* Branch & Commit Timeline Sidebar */}
          <div className="p-4 border-r border-slate-800 bg-slate-950 space-y-4 overflow-y-auto">
            {/* Branch Switcher */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Branch: <span className="text-emerald-400">{selectedBranch}</span>
              </h3>
              <div className="flex gap-2">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                >
                  {branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      🌿 {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Create Branch */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="New branch name..."
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleCreateBranch}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Commit Message Box */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-emerald-400" /> Create Commit
              </h4>
              <input
                type="text"
                placeholder="Commit message (e.g. feat: add landing header)"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleCreateCommit}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition"
              >
                Commit 1-File Snapshot
              </button>
            </div>

            {/* Commit Timeline History */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Commit History Graph
              </h3>
              <div className="space-y-2">
                {commits.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCommitHash(c.hash)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition space-y-1 ${
                      selectedCommitHash === c.hash
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400">{c.hash}</span>
                      <span className="text-[10px] text-slate-500">{c.timestamp}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 line-clamp-1">{c.message}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">{c.author}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreCommit(c);
                        }}
                        className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" /> Rollback
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Line-by-Line Diff Viewer Panel */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-4 bg-slate-900">
            {injectedSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{injectedSuccess}</span>
              </div>
            )}

            {/* Diff Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileDiff className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  Visual Diff vs Commit <code className="text-emerald-400 font-mono">{selectedCommitHash}</code>
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
            <div className="bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs overflow-x-auto max-h-[450px]">
              {diffResult.lines.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex items-center px-3 py-0.5 border-b border-slate-900/50 ${
                    line.type === 'added'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : line.type === 'removed'
                      ? 'bg-rose-500/10 text-rose-300'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="w-8 text-right pr-2 text-slate-600 select-none text-[11px]">
                    {line.oldLineNum || ''}
                  </span>
                  <span className="w-8 text-right pr-2 text-slate-600 select-none text-[11px]">
                    {line.newLineNum || ''}
                  </span>
                  <span className="w-4 select-none">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
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
