"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useUserDetailContext } from "@/context/UserDetailContext"
import { UserButton } from '@clerk/nextjs'
import { Loader2, FolderOpen, Settings, X, ExternalLink, Plus, Search, Sparkles, Trash2 } from 'lucide-react'

interface Project {
  projectId: string
  title: string
  firstFrameId: string | null
  createdOn: string
}

function cleanProjectTitle(rawTitle: string): string {
  if (!rawTitle) return "Untitled Project";
  let clean = rawTitle.replace(/^["'*\s]+|["'*\s]+$/g, "");
  clean = clean.replace(/^(?:V\d+\s*Save\s*|Logo\s*V\d+\s*Save\s*|Create\s*a\s*)/i, "");
  clean = clean.trim();
  if (!clean) return "Web Application";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function AppSidebar() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { userDetails } = useUserDetailContext()
  const router = useRouter()

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const result = await axios.get('/api/project')
      setProjects(result.data.projects || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleProjectClick = (project: Project) => {
    if (project.projectId && project.firstFrameId) {
      router.push(`/playground/${project.projectId}?frameId=${project.firstFrameId}`)
    }
  }

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      setDeletingId(projectId);
      await axios.delete(`/api/project?projectId=${projectId}`);
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  }

  const creditsValue = userDetails?.credits ?? 0
  const progressValue = Math.min((creditsValue / 50) * 100, 100)

  const filteredProjects = projects.filter(p =>
    cleanProjectTitle(p.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Sidebar className="border-r border-slate-200/80 bg-white">
        <SidebarHeader className='p-4 border-b border-slate-100'>
          <div className='flex items-center gap-2.5 px-1'>
            <div className="size-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <Image src="/logo.svg" alt="Logo" width={22} height={22} className="brightness-200 invert" />
            </div>
            <div>
              <h2 className='font-bold text-sm text-slate-900 leading-tight'>NovaFlow AI</h2>
              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">SaaS Platform</span>
            </div>
          </div>
          <Link href="/workspace" className='mt-4 w-full block'>
            <Button className='w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-medium gap-1.5 rounded-xl h-10 transition-all'>
              <Plus className="size-4" /> New Project
            </Button>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin scrollbar-thumb-slate-200">
          <SidebarGroup className='p-0'>
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
              My Projects ({projects.length})
            </SidebarGroupLabel>

            {/* Search Bar */}
            {!loading && projects.length > 0 && (
              <div className="px-2 mb-3">
                <div className="relative flex items-center">
                  <Search className="size-3.5 absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                  />
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className='flex items-center gap-2 text-slate-400 text-xs p-4 justify-center'>
                <Loader2 className='size-4 animate-spin text-blue-500' />
                <span>Loading workspace...</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && projects.length === 0 && (
              <div className='flex flex-col items-center gap-2 p-6 text-center bg-slate-50/50 rounded-xl mx-2 border border-dashed border-slate-200'>
                <FolderOpen className='size-8 text-slate-300' />
                <p className='text-slate-600 font-medium text-xs'>No projects yet</p>
                <p className='text-slate-400 text-[11px]'>Create your first AI website above!</p>
              </div>
            )}

            {/* Search No Results */}
            {!loading && projects.length > 0 && filteredProjects.length === 0 && (
              <div className="text-center p-4 text-xs text-slate-400">
                No matching projects found
              </div>
            )}

            {/* Projects List */}
            {!loading && filteredProjects.length > 0 && (
              <div className='flex flex-col gap-1 px-1'>
                {filteredProjects.map((project) => {
                  const displayTitle = cleanProjectTitle(project.title);
                  return (
                    <div
                      key={project.projectId}
                      className='w-full px-3 py-2 rounded-xl text-xs hover:bg-slate-100/80 transition-all group flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200/60'
                      onClick={() => handleProjectClick(project)}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                        <div className="size-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <FolderOpen className='size-3.5' />
                        </div>
                        <span className='truncate font-medium text-slate-700 group-hover:text-slate-900 leading-tight'>
                          {displayTitle}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteProject(e, project.projectId)}
                        disabled={deletingId === project.projectId}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                        title="Delete project"
                      >
                        {deletingId === project.projectId ? (
                          <Loader2 className="size-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <div className='flex items-center justify-between mb-1.5'>
              <span className='text-xs font-semibold text-slate-600 flex items-center gap-1'>
                <Sparkles className="size-3 text-amber-500" /> Remaining Credits
              </span>
              <span className='text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded'>
                {userDetails?.credits ?? 0}
              </span>
            </div>
            <Progress value={progressValue} className='h-1.5 bg-slate-100' />
            <Link href='/pricing' className='w-full block mt-2.5'>
              <Button className='w-full h-8 text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700' variant='outline'>
                <ExternalLink className='size-3 mr-1 text-slate-400' /> Upgrade Plan
              </Button>
            </Link>
          </div>

          <div className='flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/60 px-1'>
            <div className="flex items-center gap-2">
              <UserButton />
              <span className="text-xs font-medium text-slate-700 truncate max-w-[90px]">
                {userDetails?.name || 'My Account'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="size-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Settings"
            >
              <Settings className='size-4' />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Settings Modal */}
      {showSettings && (
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150'>
            <div className='flex items-center justify-between mb-6 border-b border-slate-100 pb-4'>
              <h2 className='text-base font-bold text-slate-900 flex items-center gap-2'>
                <Settings className="size-4 text-blue-600" /> Account Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className='text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors'
              >
                <X className='size-5' />
              </button>
            </div>

            <div className='flex flex-col gap-4'>
              <div className='bg-slate-50 rounded-xl p-4 border border-slate-100'>
                <p className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2'>User Profile</p>
                <div className='flex items-center gap-3'>
                  <UserButton />
                  <div className="overflow-hidden">
                    <p className='text-sm font-bold text-slate-800 truncate'>{userDetails?.name || 'User'}</p>
                    <p className='text-xs text-slate-500 truncate'>{userDetails?.email || ''}</p>
                  </div>
                </div>
              </div>

              <div className='bg-blue-50/60 rounded-xl p-4 border border-blue-100/80'>
                <p className='text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2'>Subscription & Credits</p>
                <div className='flex items-center justify-between'>
                  <div>
                    <span className='text-2xl font-black text-blue-600'>{userDetails?.credits ?? 0}</span>
                    <span className="text-xs text-slate-500 ml-1">credits remaining</span>
                  </div>
                  <Link href='/pricing'>
                    <Button size='sm' className='bg-blue-600 hover:bg-blue-500 text-white shadow-xs font-medium text-xs' onClick={() => setShowSettings(false)}>
                      Buy More
                    </Button>
                  </Link>
                </div>
                <Progress value={progressValue} className='mt-3 h-1.5 bg-blue-100' />
              </div>

              <div className='flex gap-2 pt-2'>
                <Link href='/pricing' className='flex-1'>
                  <Button variant='outline' className='w-full text-xs font-medium text-slate-700' onClick={() => setShowSettings(false)}>
                    Pricing Plans
                  </Button>
                </Link>
                <Link href='/contact' className='flex-1'>
                  <Button variant='outline' className='w-full text-xs font-medium text-slate-700' onClick={() => setShowSettings(false)}>
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AppSidebar