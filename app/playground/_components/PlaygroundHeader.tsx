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
    <aside className="flex flex-row md:flex-col h-14 md:h-full w-full md:w-16 shrink-0 items-center justify-between border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-md px-3 py-2 md:py-4 text-slate-100 font-sans z-30 transition-all">
      {/* Top / Brand & Versioning */}
      <div className="flex flex-row md:flex-col items-center gap-3">
        {/* Brand Logo */}
        <Link href="/workspace" title="Back to Workspace" className="group p-1 rounded-xl hover:bg-slate-900 transition-all">
          <Image src="/logo.svg" alt="Logo" width={28} height={28} priority className="shrink-0 group-hover:scale-105 transition-transform" />
        </Link>

        {/* Version Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowVersions((prev) => !prev)}
            title="Project Versions"
            className="flex items-center justify-center p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <span className="text-[11px] font-mono text-blue-400 font-bold">
              {frameId && versionIndex(frameId) >= 0 ? `V${versionIndex(frameId) + 1}` : 'V1'}
            </span>
          </button>

          {showVersions && (
            <div className="absolute left-0 md:left-full top-full md:top-0 ml-0 md:ml-2 mt-2 md:mt-0 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-1.5 font-sans animate-in fade-in duration-150">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Versions</div>
              <div className="max-h-56 overflow-y-auto">
                {versions.map((v, idx) => (
                  <Link
                    key={v.frameID}
                    href={`/playground/${projectId}?frameId=${v.frameID}`}
                    onClick={() => setShowVersions(false)}
                    className={`flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-800/80 transition-all ${
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-blue-400 hover:bg-blue-950/40 rounded-xl transition-all"
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

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          title={saved ? "Project Saved" : "Save Project"}
          className={`p-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            <Check className="size-4 text-white" />
          ) : (
            <Save className="size-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Middle Section: View Modes & Viewport Controls */}
      <div className="flex flex-row md:flex-col items-center gap-2 my-auto">
        {/* View Mode Tabs */}
        <div className="flex flex-row md:flex-col items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90 gap-1">
          <button
            onClick={() => onTabChange("preview")}
            title="Live Preview Mode"
            className={`p-2 rounded-xl text-xs transition-all ${
              activeTab === "preview"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="size-4" />
          </button>

          <button
            onClick={() => onTabChange("code")}
            title="Code Editor Mode"
            className={`p-2 rounded-xl text-xs transition-all ${
              activeTab === "code"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code className="size-4" />
          </button>

          <button
            onClick={() => onTabChange("split")}
            title="Split Editor & Preview Mode"
            className={`p-2 rounded-xl text-xs transition-all ${
              activeTab === "split"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Columns className="size-4" />
          </button>

          <button
            onClick={() => onTabChange("api")}
            title="API Backend Simulator Console"
            className={`p-2 rounded-xl text-xs transition-all ${
              activeTab === "api"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server className="size-4 text-emerald-400" />
          </button>

          <button
            onClick={() => onTabChange("context")}
            title="Project Context Engine"
            className={`p-2 rounded-xl text-xs transition-all ${
              activeTab === "context"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="size-4 text-purple-400" />
          </button>
        </div>

        {/* Device Switcher */}
        <div className="flex flex-row md:flex-col items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90 gap-1">
          <button
            onClick={() => onDeviceChange("desktop")}
            disabled={activeTab === "code"}
            title="Desktop View (1280px)"
            className={`p-1.5 rounded-lg transition-all ${
              device === "desktop" && activeTab !== "code"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
            }`}
          >
            <Monitor className="size-3.5" />
          </button>

          <button
            onClick={() => onDeviceChange("tablet")}
            disabled={activeTab === "code"}
            title="Tablet View (768px)"
            className={`p-1.5 rounded-lg transition-all ${
              device === "tablet" && activeTab !== "code"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
            }`}
          >
            <Tablet className="size-3.5" />
          </button>

          <button
            onClick={() => onDeviceChange("mobile")}
            disabled={activeTab === "code"}
            title="Mobile View (375px)"
            className={`p-1.5 rounded-lg transition-all ${
              device === "mobile" && activeTab !== "code"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-40"
            }`}
          >
            <Smartphone className="size-3.5" />
          </button>
        </div>

        {/* Visual Inspector Toggle */}
        <button
          onClick={onInspectToggle}
          title={isInspectMode ? "Disable Visual Inspector" : "Enable Click-to-Edit Visual Inspector"}
          className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
            isInspectMode
              ? "bg-blue-600 text-white shadow-xs animate-pulse"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Crosshair className="size-4 text-blue-400" />
        </button>

        {/* AI Browser Agent Drawer Toggle */}
        <button
          onClick={onBrowserDrawerToggle}
          title="AI Browser Agent Simulation"
          className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
            showBrowserDrawer
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Globe className="size-4 text-indigo-400" />
        </button>

        {/* ✨ AI Engines Studio Menu Popover */}
        <div className="relative">
          <button
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            title="AI Engines Studio Menu (16 Engines)"
            className="p-2 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-800/60 hover:border-indigo-600 text-indigo-200 shadow-xs transition-all cursor-pointer flex items-center justify-center"
          >
            <Sparkles className="size-4 text-purple-400 animate-pulse" />
          </button>

          {showToolsMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowToolsMenu(false)} />
              <div className="absolute left-0 md:left-full bottom-full md:bottom-auto top-auto md:top-0 ml-0 md:ml-2 mb-2 md:mb-0 w-[480px] max-w-[90vw] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl z-50 p-4 space-y-4 font-sans animate-in fade-in slide-in-from-left-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-slate-100 tracking-wide uppercase">AI Engines & Studio Tools</h4>
                  </div>
                  <button
                    onClick={() => setShowToolsMenu(false)}
                    className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* 🎨 Design & Frontend */}
                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/60">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                      🎨 Design & Components
                    </span>
                    <button onClick={() => { onOpenModal("component"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Puzzle className="size-3.5 text-indigo-400 shrink-0" />
                      <span>Components Library</span>
                    </button>
                    <button onClick={() => { onOpenModal("designSystem"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Palette className="size-3.5 text-pink-400 shrink-0" />
                      <span>Design System Studio</span>
                    </button>
                    <button onClick={() => { onOpenModal("responsive"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Smartphone className="size-3.5 text-cyan-400 shrink-0" />
                      <span>Responsive AI Agent</span>
                    </button>
                    <button onClick={() => { onOpenModal("imageToCode"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <ImageIcon className="size-3.5 text-indigo-400 shrink-0" />
                      <span>Image / Figma to Code</span>
                    </button>
                    <button onClick={() => { onOpenModal("marketplace"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <ShoppingBag className="size-3.5 text-amber-400 shrink-0" />
                      <span>Template Marketplace</span>
                    </button>
                  </div>

                  {/* ⚡ Backend & Security */}
                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/60">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      ⚡ Backend & Security
                    </span>
                    <button onClick={() => { onOpenModal("backend"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Server className="size-3.5 text-amber-400 shrink-0" />
                      <span>AI Backend Generator</span>
                    </button>
                    <button onClick={() => { onOpenModal("auth"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <KeyRound className="size-3.5 text-emerald-400 shrink-0" />
                      <span>AI Auth Engine</span>
                    </button>
                    <button onClick={() => { onOpenModal("database"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Database className="size-3.5 text-cyan-400 shrink-0" />
                      <span>Visual Database Studio</span>
                    </button>
                    <button onClick={() => { onOpenModal("integrations"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Plug className="size-3.5 text-blue-400 shrink-0" />
                      <span>API Integrations</span>
                    </button>
                  </div>

                  {/* 🤖 Multi-Agent & Collab */}
                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/60">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      🤖 Swarm & Intelligence
                    </span>
                    <button onClick={() => { onOpenModal("swarm"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Users className="size-3.5 text-purple-400 shrink-0" />
                      <span>Multi-Agent Swarm</span>
                    </button>
                    <button onClick={() => { onOpenModal("memory"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Brain className="size-3.5 text-pink-400 shrink-0" />
                      <span>Project Memory Engine</span>
                    </button>
                    <button onClick={() => { onOpenModal("collab"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Share2 className="size-3.5 text-blue-400 shrink-0" />
                      <span>Real-Time Live Share</span>
                    </button>
                  </div>

                  {/* 🚀 DevOps & Quality */}
                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/60">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      🚀 DevOps & Quality
                    </span>
                    <button onClick={() => { onOpenModal("git"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <GitBranch className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Git Version Agent</span>
                    </button>
                    <button onClick={() => { onOpenModal("audit"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <Gauge className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Performance & SEO Audit</span>
                    </button>
                    <button onClick={() => { onOpenModal("test"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <FlaskConical className="size-3.5 text-emerald-400 shrink-0" />
                      <span>AI Test Suite</span>
                    </button>
                    <button onClick={() => { onOpenModal("monitoring"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left">
                      <BarChart3 className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Analytics Dashboard</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Section: Actions (Export ZIP & Deploy Rocket) & Settings */}
      <div className="flex flex-row md:flex-col items-center gap-2">
        <button
          onClick={onSettingsToggle}
          title="AI Generation Settings"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all border border-slate-800 cursor-pointer"
        >
          <Settings2 className="size-4" />
        </button>

        <button
          onClick={onExportZip}
          title="Export Project Framework (Next.js, Vite, HTML)"
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl transition-all border border-slate-800 cursor-pointer shadow-xs"
        >
          <Download className="size-4" />
        </button>

        <button
          onClick={onLiveDeploy}
          title="Deploy Production Build"
          className="p-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Rocket className="size-4" />
        </button>
      </div>
    </aside>
  )
}

export default PlaygroundHeader
