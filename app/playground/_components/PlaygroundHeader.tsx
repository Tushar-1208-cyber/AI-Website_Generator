"use client"
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import {
  Check, Loader2, Save, Settings2, Plus, Layers,
  Monitor, Smartphone, Tablet, Crosshair, Globe,
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
    <aside className="flex flex-col h-full w-56 md:w-60 shrink-0 border-r border-slate-200/90 bg-slate-50/95 backdrop-blur-md px-3 py-4 text-slate-800 font-sans z-30 justify-between overflow-y-auto shadow-xs transition-all">
      {/* Top Header: Brand & Project Version Switcher */}
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1">
          <Link href="/workspace" className="flex items-center gap-2.5 group">
            <div className="p-1 rounded-xl bg-blue-600/10 border border-blue-200 group-hover:bg-blue-600/20 transition-all">
              <Image src="/logo.svg" alt="Logo" width={24} height={24} priority className="shrink-0 group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-slate-900 tracking-tight leading-none">AiSite Studio</span>
              <span className="text-[10px] text-slate-500 font-medium">AI Web Builder</span>
            </div>
          </Link>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            title={saved ? "Project Saved" : "Save Project"}
            className={`p-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : saved ? (
              <Check className="size-3.5 text-white" />
            ) : (
              <Save className="size-3.5 text-slate-500" />
            )}
          </button>
        </div>

        {/* Version Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowVersions((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">
                {frameId && versionIndex(frameId) >= 0 ? `V${versionIndex(frameId) + 1}` : 'V1'}
              </span>
              <span className="truncate">
                {frameId && versionIndex(frameId) >= 0 ? `Version ${versionIndex(frameId) + 1}` : 'Version 1'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">▾</span>
          </button>

          {showVersions && (
            <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 font-sans animate-in fade-in duration-150">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Versions</div>
              <div className="max-h-56 overflow-y-auto">
                {versions.map((v, idx) => (
                  <Link
                    key={v.frameID}
                    href={`/playground/${projectId}?frameId=${v.frameID}`}
                    onClick={() => setShowVersions(false)}
                    className={`flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 transition-all ${
                      v.frameID === frameId ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-700'
                    }`}
                  >
                    <span>Version {idx + 1}</span>
                    {v.frameID === frameId && <Check className="size-3.5 text-blue-600" />}
                  </Link>
                ))}
              </div>
              <div className="border-t border-slate-100 mt-1 pt-1 px-1">
                <button
                  onClick={handleNewVersion}
                  disabled={creatingVersion}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-medium"
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

        {/* View Mode Navigation Section */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            View Modes
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onTabChange("preview")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left font-medium ${
                activeTab === "preview"
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Eye className="size-4 shrink-0" />
              <span>Live Preview</span>
            </button>

            <button
              onClick={() => onTabChange("code")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left font-medium ${
                activeTab === "code"
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Code className="size-4 shrink-0" />
              <span>Code Editor</span>
            </button>

            <button
              onClick={() => onTabChange("split")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left font-medium ${
                activeTab === "split"
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Columns className="size-4 shrink-0" />
              <span>Split View</span>
            </button>

            <button
              onClick={() => onTabChange("api")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left font-medium ${
                activeTab === "api"
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Server className="size-4 shrink-0 text-emerald-600" />
              <span>API Console</span>
            </button>

            <button
              onClick={() => onTabChange("context")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left font-medium ${
                activeTab === "context"
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <Layers className="size-4 shrink-0 text-purple-600" />
              <span>Context Engine</span>
            </button>
          </div>
        </div>

        {/* Viewport Display Switcher */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Viewport Screen
          </div>
          <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onDeviceChange("desktop")}
              disabled={activeTab === "code"}
              title="Desktop View (1280px)"
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] transition-all font-medium ${
                device === "desktop" && activeTab !== "code"
                  ? "bg-blue-600 text-white shadow-2xs font-semibold"
                  : "text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              }`}
            >
              <Monitor className="size-3.5 mb-0.5" />
              <span>Desktop</span>
            </button>

            <button
              onClick={() => onDeviceChange("tablet")}
              disabled={activeTab === "code"}
              title="Tablet View (768px)"
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] transition-all font-medium ${
                device === "tablet" && activeTab !== "code"
                  ? "bg-blue-600 text-white shadow-2xs font-semibold"
                  : "text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              }`}
            >
              <Tablet className="size-3.5 mb-0.5" />
              <span>Tablet</span>
            </button>

            <button
              onClick={() => onDeviceChange("mobile")}
              disabled={activeTab === "code"}
              title="Mobile View (375px)"
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] transition-all font-medium ${
                device === "mobile" && activeTab !== "code"
                  ? "bg-blue-600 text-white shadow-2xs font-semibold"
                  : "text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              }`}
            >
              <Smartphone className="size-3.5 mb-0.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Interactive AI Tools Section */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            AI Tools & Inspectors
          </div>
          <div className="space-y-1">
            {/* Visual Inspector Toggle */}
            <button
              onClick={onInspectToggle}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                isInspectMode
                  ? "bg-blue-600 text-white shadow-xs font-semibold animate-pulse"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Crosshair className="size-4 text-blue-600 shrink-0" />
              <span>Visual Inspector</span>
            </button>

            {/* AI Browser Agent Drawer Toggle */}
            <button
              onClick={onBrowserDrawerToggle}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                showBrowserDrawer
                  ? "bg-indigo-600 text-white shadow-xs font-semibold"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Globe className="size-4 text-indigo-600 shrink-0" />
              <span>AI Browser Agent</span>
            </button>

            {/* AI Engines Studio Menu Popover */}
            <div className="relative">
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-900 font-semibold text-xs transition-all cursor-pointer shadow-2xs hover:border-purple-300"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-purple-600 animate-pulse shrink-0" />
                  <span>AI Studio (16 Engines)</span>
                </div>
                <span className="text-[10px] text-purple-600">▾</span>
              </button>

              {showToolsMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowToolsMenu(false)} />
                  <div className="absolute left-full top-0 ml-2 w-[440px] max-w-[90vw] bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-4 space-y-4 font-sans animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-purple-600" />
                        <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">AI Engines & Studio Tools</h4>
                      </div>
                      <button
                        onClick={() => setShowToolsMenu(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* 🎨 Design & Frontend */}
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
                          🎨 Design & Components
                        </span>
                        <button onClick={() => { onOpenModal("component"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <Puzzle className="size-3.5 text-indigo-600 shrink-0" />
                          <span>Components Library</span>
                        </button>
                        <button onClick={() => { onOpenModal("designSystem"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <Palette className="size-3.5 text-pink-600 shrink-0" />
                          <span>Design System Studio</span>
                        </button>
                        <button onClick={() => { onOpenModal("responsive"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <Smartphone className="size-3.5 text-cyan-600 shrink-0" />
                          <span>Responsive AI Agent</span>
                        </button>
                        <button onClick={() => { onOpenModal("imageToCode"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <ImageIcon className="size-3.5 text-indigo-600 shrink-0" />
                          <span>Image / Figma to Code</span>
                        </button>
                        <button onClick={() => { onOpenModal("marketplace"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <ShoppingBag className="size-3.5 text-amber-600 shrink-0" />
                          <span>Template Marketplace</span>
                        </button>
                      </div>

                      {/* ⚡ Backend & Security */}
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                          ⚡ Backend & Security
                        </span>
                        <button onClick={() => { onOpenModal("backend"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <Server className="size-3.5 text-amber-600 shrink-0" />
                          <span>AI Backend Generator</span>
                        </button>
                        <button onClick={() => { onOpenModal("auth"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <KeyRound className="size-3.5 text-emerald-600 shrink-0" />
                          <span>AI Auth Engine</span>
                        </button>
                        <button onClick={() => { onOpenModal("database"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <Database className="size-3.5 text-cyan-600 shrink-0" />
                          <span>Visual Database Studio</span>
                        </button>
                        <button onClick={() => { onOpenModal("integrations"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <Plug className="size-3.5 text-blue-600 shrink-0" />
                          <span>API Integrations</span>
                        </button>
                      </div>

                      {/* 🤖 Multi-Agent & Collab */}
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block mb-1">
                          🤖 Swarm & Intelligence
                        </span>
                        <button onClick={() => { onOpenModal("swarm"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <Users className="size-3.5 text-purple-600 shrink-0" />
                          <span>Multi-Agent Swarm</span>
                        </button>
                        <button onClick={() => { onOpenModal("memory"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <Brain className="size-3.5 text-pink-600 shrink-0" />
                          <span>Project Memory Engine</span>
                        </button>
                        <button onClick={() => { onOpenModal("collab"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <Share2 className="size-3.5 text-blue-600 shrink-0" />
                          <span>Real-Time Live Share</span>
                        </button>
                      </div>

                      {/* 🚀 DevOps & Quality */}
                      <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                          🚀 DevOps & Quality
                        </span>
                        <button onClick={() => { onOpenModal("git"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <GitBranch className="size-3.5 text-emerald-600 shrink-0" />
                          <span>Git Version Agent</span>
                        </button>
                        <button onClick={() => { onOpenModal("audit"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <Gauge className="size-3.5 text-emerald-600 shrink-0" />
                          <span>Performance & SEO Audit</span>
                        </button>
                        <button onClick={() => { onOpenModal("test"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <FlaskConical className="size-3.5 text-emerald-600 shrink-0" />
                          <span>AI Test Suite</span>
                        </button>
                        <button onClick={() => { onOpenModal("monitoring"); setShowToolsMenu(false); }} className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all text-left font-medium">
                          <BarChart3 className="size-3.5 text-emerald-600 shrink-0" />
                          <span>Analytics Dashboard</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Actions (Export ZIP & Deploy Rocket) & Settings */}
      <div className="pt-4 border-t border-slate-200/90 space-y-2">
        <button
          onClick={onExportZip}
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition-all border border-slate-200 font-medium text-xs shadow-2xs cursor-pointer"
        >
          <Download className="size-4 text-slate-600 shrink-0" />
          <span>Export ZIP</span>
        </button>

        <button
          onClick={onLiveDeploy}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-md shadow-blue-500/10 font-bold text-xs cursor-pointer"
        >
          <Rocket className="size-4 shrink-0" />
          <span>Deploy Project</span>
        </button>

        <button
          onClick={onSettingsToggle}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-white transition-all rounded-xl border border-transparent hover:border-slate-200 font-medium text-xs cursor-pointer"
        >
          <Settings2 className="size-4 text-slate-500 shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}

export default PlaygroundHeader
