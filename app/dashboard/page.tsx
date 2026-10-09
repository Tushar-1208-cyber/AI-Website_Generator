"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Zap,
  Shield,
  Copy,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2,
  Layout,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Crown,
} from "lucide-react";

interface ProjectItem {
  projectId: string;
  name?: string;
  title: string;
  firstFrameId?: string;
  createdOn: string;
}

interface SubscriptionDetails {
  email: string;
  name: string;
  plan: string;
  credits: number;
  entitlements: {
    maxProjects: number;
    aiCredits: number;
    canDeploy: boolean;
    canSyncGitHub: boolean;
  };
  projectCount: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projRes, subRes] = await Promise.all([
        fetch("/api/project"),
        fetch("/api/users/subscription"),
      ]);

      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.projects || []);
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription || null);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load user projects and subscription data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleManageBilling = async () => {
    setIsBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to open Stripe Billing Portal");
      }
    } catch (err) {
      console.error("Portal error:", err);
      alert("Failed to open Stripe Billing Portal");
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleUpgradePlan = async (targetPlan: "Pro" | "Team") => {
    setIsBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || `Failed to start checkout for ${targetPlan} plan`);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to initiate Stripe Checkout");
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleRename = async (projectId: string) => {
    if (!editingName.trim()) return;
    setActionLoadingId(projectId);
    try {
      const res = await fetch("/api/project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name: editingName.trim() }),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.projectId === projectId ? { ...p, title: editingName.trim() } : p))
        );
        setEditingProjectId(null);
      }
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicate = async (projectId: string) => {
    setActionLoadingId(projectId);
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", sourceProjectId: projectId }),
      });
      if (res.ok) {
        await fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to duplicate project.");
      }
    } catch (err) {
      console.error("Duplicate failed:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    setActionLoadingId(projectId);
    try {
      const res = await fetch(`/api/project?projectId=${encodeURIComponent(projectId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl flex items-center justify-center font-bold">
            <FolderKanban className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              SaaS User Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Manage your AI projects, credits & subscription entitlements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManageBilling}
            disabled={isBillingLoading}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            {isBillingLoading ? (
              <Loader2 className="size-4 animate-spin text-blue-400" />
            ) : (
              <CreditCard className="size-4 text-blue-400" />
            )}
            <span>Manage Billing</span>
          </button>

          <Link
            href="/workspace"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>Create New Project</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Account & Entitlement Banner */}
        {subscription && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Account Profile</span>
              <div className="mt-2">
                <p className="font-bold text-white text-base">{subscription.name}</p>
                <p className="text-xs text-slate-400 truncate">{subscription.email}</p>
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Current SaaS Plan</span>
                {subscription.plan !== "Free" ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                    {subscription.subscriptionStatus || "Active"}
                  </span>
                ) : (
                  <button
                    onClick={() => handleUpgradePlan("Pro")}
                    disabled={isBillingLoading}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Crown className="size-3" /> Upgrade
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-blue-400">{subscription.plan}</span>
                  <span className="text-xs text-slate-400 ml-1">Plan</span>
                </div>
                {subscription.plan === "Free" && (
                  <button
                    onClick={() => handleUpgradePlan("Pro")}
                    disabled={isBillingLoading}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition"
                  >
                    Upgrade to Pro
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">AI Generation Credits</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-400">{subscription.credits}</span>
                <span className="text-xs text-slate-400">Credits Remaining</span>
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Active Projects Usage</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-purple-400">
                  {subscription.projectCount} / {subscription.entitlements.maxProjects}
                </span>
                <span className="text-xs text-slate-400">Projects</span>
              </div>
            </div>
          </div>
        )}

        {/* Project List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-900">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Your Projects ({projects.length})
            </h2>
            <button
              onClick={fetchDashboardData}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <RefreshCw className="size-3.5" /> Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="size-8 text-blue-500 animate-spin" />
              <p className="text-xs font-semibold">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-950/20 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-3">
              <AlertCircle className="size-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.projectId}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="size-8 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center font-bold">
                        <Layout className="size-4" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {new Date(project.createdOn).toLocaleDateString()}
                      </span>
                    </div>

                    {editingProjectId === project.projectId ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs px-2 py-1 rounded-lg text-white w-full"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(project.projectId)}
                          className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors truncate">
                          {project.title}
                        </h3>
                        <button
                          onClick={() => {
                            setEditingProjectId(project.projectId);
                            setEditingName(project.title);
                          }}
                          className="text-slate-500 hover:text-slate-200 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 font-mono">
                      ID: {project.projectId}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDuplicate(project.projectId)}
                        disabled={actionLoadingId === project.projectId}
                        className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition"
                        title="Duplicate Project"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.projectId)}
                        disabled={actionLoadingId === project.projectId}
                        className="p-2 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800 transition"
                        title="Delete Project"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <Link
                      href={`/playground/${project.projectId}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md shadow-blue-500/20 transition"
                    >
                      <span>Open Editor</span>
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <FolderKanban className="size-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No active projects yet</h3>
              <p className="text-xs text-slate-400">Create your first AI-generated website project to get started.</p>
              <Link
                href="/workspace"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20"
              >
                <Plus className="size-4" /> Create Project
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
