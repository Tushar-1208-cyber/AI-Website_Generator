'use client';

import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Pin,
  CheckCircle2,
  X,
  Zap,
  Sparkles,
} from 'lucide-react';
import {
  INITIAL_PROJECT_MEMORIES,
  MemoryItem,
  addMemoryRule,
  buildMemoryPromptContext,
} from '@/lib/projectMemoryEngine';

interface ProjectMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectMemoryModal({
  isOpen,
  onClose,
}: ProjectMemoryModalProps) {
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_PROJECT_MEMORIES);
  const [activeCategory, setActiveCategory] = useState<'all' | 'stack' | 'design' | 'api' | 'security' | 'custom'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newRule, setNewRule] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('custom');
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMemory = () => {
    if (!newTitle.trim() || !newRule.trim()) return;
    const updated = addMemoryRule(memories, newCategory, newTitle, newRule);
    setMemories(updated);
    setNewTitle('');
    setNewRule('');
    setInjectedSuccess(`Added architectural memory rule: "${newTitle}"`);
  };

  const handleTogglePin = (id: string) => {
    setMemories(
      memories.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
    );
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(memories.filter((m) => m.id !== id));
  };

  const filteredMemories = memories.filter((m) => {
    if (activeCategory === 'all') return true;
    return m.category === activeCategory;
  });

  const promptContextPreview = buildMemoryPromptContext(memories);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-xl border border-pink-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Long-Term AI Project Memory Engine
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-medium">
                  Phase 18
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Persist architectural rules, design constraints, and tech stack conventions across AI generations.
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
          {/* Add Memory Rule Sidebar */}
          <div className="p-4 border-r border-slate-800 bg-slate-950 space-y-4 overflow-y-auto">
            {injectedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{injectedSuccess}</span>
              </div>
            )}

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Plus className="w-4 h-4 text-pink-400" /> Add Architectural Rule
              </h4>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Rule Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MemoryItem['category'])}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200"
                  >
                    <option value="stack">Tech Stack Rule</option>
                    <option value="design">Design System Rule</option>
                    <option value="api">API Convention</option>
                    <option value="security">Security Standard</option>
                    <option value="custom">Custom Constraint</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Rule Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Always use Tailwind v3"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Rule Description</label>
                  <textarea
                    placeholder="Detailed constraint instruction..."
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <button
                  onClick={handleAddMemory}
                  className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs rounded-xl transition shadow-lg shadow-pink-600/20 flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" /> Save Memory Rule
                </button>
              </div>
            </div>
          </div>

          {/* Memory Rules List & System Prompt Context Preview */}
          <div className="md:col-span-2 p-6 overflow-y-auto space-y-6 bg-slate-900">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              {(['all', 'stack', 'design', 'api', 'security', 'custom'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                    activeCategory === cat ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Rules List */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300">Active Project Memory Rules ({filteredMemories.length})</h4>

              <div className="space-y-3">
                {filteredMemories.map((mem) => (
                  <div key={mem.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePin(mem.id)}
                          className={`p-1 rounded transition ${
                            mem.pinned ? 'text-pink-400 bg-pink-500/10' : 'text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <Pin className="w-4 h-4 fill-current" />
                        </button>
                        <span className="text-xs font-bold text-white">{mem.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-pink-400 uppercase font-mono">
                          {mem.category}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300">{mem.rule}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* System Prompt Context Compiler Preview */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" /> Compiled System Prompt Memory Context
              </h4>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-pink-300 font-mono overflow-x-auto max-h-40">
                {promptContextPreview || '// No active pinned memory rules.'}
              </pre>
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
