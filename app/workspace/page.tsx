"use client";

import React, { useState } from "react";
import Hero from "../_components/Hero";
import {
  Sparkles,
  Search,
  Grid,
  ListFilter,
  ArrowUpRight,
  Code2,
  Clock,
  Zap,
  Layout,
  Layers,
  Globe,
  Palette,
} from "lucide-react";
import Link from "next/link";

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STARTER_TEMPLATES: TemplateItem[] = [
  {
    id: "saas-dashboard",
    name: "Modern SaaS Analytics",
    category: "SaaS & Dashboard",
    description: "Analytics dashboard with revenue charts, user stats, and dark theme controls.",
    prompt: "Create a modern dark-mode SaaS analytics dashboard with revenue charts, active user stats, and sidebar navigation.",
    gradient: "from-blue-600 to-indigo-600",
    icon: Layout,
  },
  {
    id: "ecommerce-store",
    name: "Cyber E-Commerce Store",
    category: "E-Commerce",
    description: "Product catalog grid with price filters, shopping cart drawer, and badge indicators.",
    prompt: "Create a modern cyberpunk e-commerce store page with product cards, category filters, and interactive shopping cart.",
    gradient: "from-purple-600 to-pink-600",
    icon: Globe,
  },
  {
    id: "agency-portfolio",
    name: "Creative Agency Portfolio",
    category: "Portfolio",
    description: "Hero header, project showcase grid, client logos, and contact modal.",
    prompt: "Create a modern creative agency portfolio with hero banner, interactive case studies grid, and contact form.",
    gradient: "from-emerald-600 to-teal-600",
    icon: Palette,
  },
  {
    id: "startup-landing",
    name: "AI Startup Landing",
    category: "Landing Page",
    description: "Hero section with gradient text, 3-column feature grid, pricing table, and FAQ accordion.",
    prompt: "Create a high-converting AI startup landing page with hero banner, feature highlights, pricing plans, and FAQ section.",
    gradient: "from-amber-600 to-orange-600",
    icon: Layers,
  },
];

export default function Workspace() {
  const [activeTab, setActiveTab] = useState<"generator" | "templates">("generator");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTemplates = STARTER_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Workspace Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl flex items-center justify-center font-bold">
            <Zap className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Workspace & AI Studio
            </h1>
            <p className="text-xs text-slate-400">
              AI Website Generator • Production Development Environment
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "generator"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="size-3.5" /> AI Generator
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "templates"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid className="size-3.5" /> Templates
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {activeTab === "generator" ? (
          <div>
            <Hero />
          </div>
        ) : (
          /* Starter Templates Section */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-900">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Starter Template Library
                  <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                    4 Starters Ready
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Pick a pre-configured architecture baseline and launch your AI project.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => {
                const IconComponent = template.icon;
                return (
                  <div
                    key={template.id}
                    className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`size-10 bg-gradient-to-br ${template.gradient} rounded-xl flex items-center justify-center text-white shadow-md`}>
                          <IconComponent className="size-5" />
                        </div>
                        <span className="text-[10px] font-mono font-semibold uppercase bg-slate-950 text-slate-400 px-2.5 py-1 rounded-full border border-slate-800">
                          {template.category}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {template.description}
                        </p>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">Generated Prompt:</span>
                        &quot;{template.prompt}&quot;
                      </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Code2 className="size-3 text-blue-400" /> Multi-file HTML & Tailwind
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("generator");
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1"
                      >
                        <span>Use Template</span>
                        <ArrowUpRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}