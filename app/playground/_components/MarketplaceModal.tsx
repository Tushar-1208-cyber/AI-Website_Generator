'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Star,
  Download,
  CheckCircle2,
  X,
  Zap,
  Search,
} from 'lucide-react';
import {
  MARKETPLACE_ITEMS,
  MarketplaceItem,
  installMarketplaceItem,
} from '@/lib/marketplaceEngine';

interface MarketplaceModalProps {
  filesMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onApplyMarketplaceItem: (updatedFilesMap: Record<string, string>) => void;
}

export default function MarketplaceModal({
  filesMap,
  isOpen,
  onClose,
  onApplyMarketplaceItem,
}: MarketplaceModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'template' | 'component' | 'backend'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [installedSuccess, setInstalledSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstall = (item: MarketplaceItem) => {
    const updated = installMarketplaceItem(filesMap, item);
    onApplyMarketplaceItem(updated);
    setInstalledSuccess(`Installed "${item.title}" into project workspace!`);
  };

  const filteredItems = MARKETPLACE_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                AI Component & Template Marketplace
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                  Phase 20
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1-Click install community AI SaaS templates, UI component blocks, and backend modules.
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
          {installedSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{installedSuccess}</span>
            </div>
          )}

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search templates & components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {(['all', 'template', 'component', 'backend'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
                    selectedCategory === cat ? 'bg-amber-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}s
                </button>
              ))}
            </div>
          </div>

          {/* Marketplace Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 font-mono uppercase">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" /> {item.rating}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-900">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>By {item.author}</span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" /> {item.downloads}
                    </span>
                  </div>

                  <button
                    onClick={() => handleInstall(item)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium text-xs rounded-xl border border-slate-800 transition flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" /> 1-Click Install
                  </button>
                </div>
              </div>
            ))}
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
