"use client"
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import {
  Check, Loader2, Save, Settings2, ChevronDown, Plus, Layers,
  Monitor, Smartphone, Tablet, FileText, Undo2, Redo2, Crosshair, Globe,
  Eye, Code, Columns, Server, Sparkles, Download, Rocket, X, Puzzle, Palette,
  KeyRound, Plug, Database, GitBranch, Users, Gauge, Share2, Brain, Image as ImageIcon,
  ShoppingBag, BarChart3, FlaskConical
} from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

export interface PlaygroundHeaderProps {
  onSettingsToggle?: () => void
  currentDesignCode?: string
  activeTab: "preview" | "code" | "split" | "api" | "context"
  onTabChange: (tab: "preview" | "code" | "split" | "api" | "context") => void
  device: "desktop" | "tablet" | "mobile"
  onDeviceChange: (device: "desktop" | "tablet" | "mobile") => void
  htmlPages: { path: string; label: string }[]
  activePreviewPage: string
  onPageChange: (page: string) => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  isInspectMode: boolean
  onInspectToggle: () => void
  showBrowserDrawer: boolean
  onBrowserDrawerToggle: () => void
  onExportZip: () => void
  onLiveDeploy: () => void
  onOpenModal: (modalName: string) => void
}

interface VersionItem {
  frameID: string
  createdOn: string
}

function PlaygroundHeader({
  onSettingsToggle,
  currentDesignCode,
  activeTab,
  onTabChange,
  device,
  onDeviceChange,
  htmlPages,
  activePreviewPage,
  onPageChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isInspectMode,
  onInspectToggle,
  showBrowserDrawer,
  onBrowserDrawerToggle,
  onExportZip,
  onLiveDeploy,
  onOpenModal,
}: PlaygroundHeaderProps) {
  const { projectId } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const frameId = searchParams.get('frameId')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [showToolsMenu, setShowToolsMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchVersions = async () => {
    try {
      const result = await axios.get(`/api/frame/list?projectId=${projectId}`)
      setVersions(result.data.frames || [])
    } catch (error) {
      console.error('Error fetching versions:', error)
    }
  }

  useEffect(() => {
    if (projectId) fetchVersions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowVersions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await axios.get(`/api/frame?frameId=${frameId}&projectId=${projectId}`)
      setSaved(true)
      toast.success('Project saved successfully!')
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  const handleNewVersion = async () => {
    try {
      setCreatingVersion(true)
      const result = await axios.post('/api/frame', {
        projectId,
        startingCode: currentDesignCode || '',
      })
      const newFrameId = result.data.frameId
      toast.success('New version created!')
      setShowVersions(false)
      router.push(`/playground/${projectId}?frameId=${newFrameId}`)
      router.refresh()
    } catch (error) {
      console.error('Error creating version:', error)
      toast.error('Failed to create new version')
    } finally {
      setCreatingVersion(false)
    }
  }

  const versionIndex = (id: string) => versions.findIndex((v) => v.frameID === id)

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800/90 bg-slate-950 px-4 text-slate-100 font-sans shadow-md z-30">
      {/* Left Section: Logo, Title, Version Switcher, Settings, Save */}
      <div className="flex items-center gap-3">
        {/* Brand Logo & Title */}
        <Link href="/workspace" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image src="/logo.svg" alt="Logo" width={28} height={28} priority className="shrink-0" />
          <span className="hidden md:inline text-xs font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent tracking-tight">
            AiSite.builder
          </span>
        </Link>

        <span className="text-slate-800 text-sm hidden md:inline">|</span>

        {/* Version Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowVersions((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
          >
            <Layers className="size-3.5 text-blue-400" />
            <span>{frameId && versionIndex(frameId) >= 0 ? `V${versionIndex(frameId) + 1}` : 'V1'}</span>
            <ChevronDown className="size-3 text-slate-500" />
          </button>

          {showVersions && (
            <div className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1 font-sans">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project Versions</div>
              <div className="max-h-56 overflow-y-auto">
                {versions.map((v, idx) => (
                  <Link
                    key={v.frameID}
                    href={`/playground/${projectId}?frameId=${v.frameID}`}
                    onClick={() => setShowVersions(false)}
                    className={`flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-800/80 transition-all ${
                      v.frameID === frameId ? 'text-blue-400 font-bold bg-blue-950/40' : 'text-slate-300'
                    }`}
                  >
                    <span>Version {idx + 1}</span>
                    {v.frameID === frameId && <Check className="size-3.5 text-blue-400" />}
                  </Link>
                ))}
              </div>
              <div className="border-t border-slate-800 mt-1 pt-1 px-1">
                <button
                  onClick={handleNewVersion}
                  disabled={creatingVersion}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-blue-400 hover:bg-blue-950/40 rounded-lg transition-all"
                >
                  {creatingVersion ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  <span>New Version</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Toggle */}
        <button
          onClick={onSettingsToggle}
          title="AI Generation & Theme Settings"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all border border-transparent hover:border-slate-800 cursor-pointer"
        >
          <Settings2 className="size-4" />
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
          }`}
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : saved ? (
            <Check className="size-3.5" />
          ) : (
            <Save className="size-3.5 text-slate-400" />
          )}
          <span>{saving ? 'Saving...' : saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Center Section: View Mode Tabs */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 shadow-inner">
        <button
          onClick={() => onTabChange("preview")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            activeTab === "preview"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Eye className="size-3.5" />
          <span>Preview</span>
        </button>

        <button
          onClick={() => onTabChange("code")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            activeTab === "code"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code className="size-3.5" />
          <span>Code</span>
        </button>

        <button
          onClick={() => onTabChange("split")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            activeTab === "split"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Columns className="size-3.5" />
          <span>Split</span>
        </button>

        <button
          onClick={() => onTabChange("api")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            activeTab === "api"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Server className="size-3.5 text-emerald-400" />
          <span>API</span>
        </button>

        <button
          onClick={() => onTabChange("context")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            activeTab === "context"
              ? "bg-blue-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="size-3.5 text-purple-400" />
          <span>Context</span>
        </button>
      </div>

      {/* Right Section: Canvas Controls & Actions */}
      <div className="flex items-center gap-2">
        {/* Device Toggles */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onDeviceChange("desktop")}
            disabled={activeTab === "code"}
            title="Desktop View"
            className={`p-1.5 rounded-md transition-all ${
              device === "desktop" && activeTab !== "code"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
            }`}
          >
            <Monitor className="size-3.5" />
          </button>

          <button
            onClick={() => onDeviceChange("tablet")}
            disabled={activeTab === "code"}
            title="Tablet View"
            className={`p-1.5 rounded-md transition-all ${
              device === "tablet" && activeTab !== "code"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
            }`}
          >
            <Tablet className="size-3.5" />
          </button>

          <button
            onClick={() => onDeviceChange("mobile")}
            disabled={activeTab === "code"}
            title="Mobile View"
            className={`p-1.5 rounded-md transition-all ${
              device === "mobile" && activeTab !== "code"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
            }`}
          >
            <Smartphone className="size-3.5" />
          </button>
        </div>

        {/* Page Switcher */}
        {htmlPages.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <FileText className="size-3.5 text-blue-400 shrink-0" />
            <select
              value={activePreviewPage}
              onChange={(e) => onPageChange(e.target.value)}
              className="bg-slate-950 text-slate-100 text-xs font-mono font-medium px-1 py-0.5 rounded border border-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {htmlPages.map((page) => (
                <option key={page.path} value={page.path}>
                  {page.label} ({page.path})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-0.5 border-l border-slate-800 pl-1.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo Code Change"
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-900 disabled:opacity-30 transition-all cursor-pointer"
          >
            <Undo2 className="size-3.5" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo Code Change"
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-900 disabled:opacity-30 transition-all cursor-pointer"
          >
            <Redo2 className="size-3.5" />
          </button>
        </div>

        {/* Visual Inspect Mode */}
        <button
          onClick={onInspectToggle}
          title={isInspectMode ? "Disable Inspect Mode" : "Click-to-Edit Visual Inspector"}
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isInspectMode
              ? "bg-blue-600 text-white shadow-sm animate-pulse"
              : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Crosshair className="size-3.5 text-blue-400" />
          <span>{isInspectMode ? "Inspecting" : "Inspect"}</span>
        </button>

        {/* AI Browser Agent */}
        <button
          onClick={onBrowserDrawerToggle}
          title="AI Browser Agent Simulation"
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            showBrowserDrawer
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Globe className="size-3.5 text-indigo-400" />
          <span>Browser</span>
        </button>

        {/* ✨ AI Engines (16) Studio Menu */}
        <div className="relative">
          <button
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-800/60 hover:border-indigo-600 text-xs font-semibold text-indigo-200 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="size-3.5 text-purple-400 animate-pulse" />
            <span>AI Engines</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono">16</span>
            <ChevronDown className="size-3 text-slate-400" />
          </button>

          {showToolsMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowToolsMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-[480px] max-w-[90vw] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 space-y-4 font-sans animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-slate-100 tracking-wide uppercase">AI Engines & Studio Tools</h4>
                  </div>
                  <button
                    onClick={() => setShowToolsMenu(false)}
                    className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* 🎨 Design & Frontend */}
                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                      🎨 Design & Components
                    </span>
                    <button onClick={() => { onOpenModal("component"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Puzzle className="size-3.5 text-indigo-400 shrink-0" />
                      <span>Components Library</span>
                    </button>
                    <button onClick={() => { onOpenModal("designSystem"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Palette className="size-3.5 text-pink-400 shrink-0" />
                      <span>Design System Studio</span>
                    </button>
                    <button onClick={() => { onOpenModal("responsive"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Smartphone className="size-3.5 text-cyan-400 shrink-0" />
                      <span>Responsive AI Agent</span>
                    </button>
                    <button onClick={() => { onOpenModal("imageToCode"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <ImageIcon className="size-3.5 text-indigo-400 shrink-0" />
                      <span>Image / Figma to Code</span>
                    </button>
                    <button onClick={() => { onOpenModal("marketplace"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <ShoppingBag className="size-3.5 text-amber-400 shrink-0" />
                      <span>Template Marketplace</span>
                    </button>
                  </div>

                  {/* ⚡ Backend & Database */}
                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      ⚡ Backend & Security
                    </span>
                    <button onClick={() => { onOpenModal("backend"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Server className="size-3.5 text-amber-400 shrink-0" />
                      <span>AI Backend Generator</span>
                    </button>
                    <button onClick={() => { onOpenModal("auth"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <KeyRound className="size-3.5 text-emerald-400 shrink-0" />
                      <span>AI Auth Engine</span>
                    </button>
                    <button onClick={() => { onOpenModal("database"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Database className="size-3.5 text-cyan-400 shrink-0" />
                      <span>Visual Database Studio</span>
                    </button>
                    <button onClick={() => { onOpenModal("integrations"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Plug className="size-3.5 text-blue-400 shrink-0" />
                      <span>API Integrations</span>
                    </button>
                  </div>

                  {/* 🤖 Multi-Agent & Collab */}
                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      🤖 Swarm & Intelligence
                    </span>
                    <button onClick={() => { onOpenModal("swarm"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Users className="size-3.5 text-purple-400 shrink-0" />
                      <span>Multi-Agent Swarm</span>
                    </button>
                    <button onClick={() => { onOpenModal("memory"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Brain className="size-3.5 text-pink-400 shrink-0" />
                      <span>Project Memory Engine</span>
                    </button>
                    <button onClick={() => { onOpenModal("collab"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Share2 className="size-3.5 text-blue-400 shrink-0" />
                      <span>Real-Time Live Share</span>
                    </button>
                  </div>

                  {/* 🚀 DevOps & Quality */}
                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      🚀 DevOps & Quality
                    </span>
                    <button onClick={() => { onOpenModal("git"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <GitBranch className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Git Version Agent</span>
                    </button>
                    <button onClick={() => { onOpenModal("audit"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Gauge className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Performance & SEO Audit</span>
                    </button>
                    <button onClick={() => { onOpenModal("test"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <FlaskConical className="size-3.5 text-emerald-400 shrink-0" />
                      <span>AI Test Suite</span>
                    </button>
                    <button onClick={() => { onOpenModal("monitoring"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <BarChart3 className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Analytics Dashboard</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Export ZIP */}
        <button
          onClick={onExportZip}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg transition-all border border-slate-800 cursor-pointer"
        >
          <Download className="size-3.5" />
          <span>Export</span>
        </button>

        {/* Live Deploy */}
        <button
          onClick={onLiveDeploy}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Rocket className="size-3.5" />
          <span>Deploy</span>
        </button>
      </div>
    </div>
  )
}

export default PlaygroundHeader
