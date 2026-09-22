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
import { Loader2, FolderOpen, Settings, X, ExternalLink } from 'lucide-react'

interface Project {
  projectId: string
  title: string
  firstFrameId: string | null
  createdOn: string
}

function AppSidebar() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { userDetails } = useUserDetailContext()
  const router = useRouter()

  // Fetch all projects for the logged-in user
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
    e.stopPropagation(); // Prevent clicking the project row
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      setDeletingId(projectId);
      await axios.delete(`/api/project?projectId=${projectId}`);
      await fetchProjects(); // Refresh the list
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  }

  // Calculate credits percentage (max 50 for scale)
  const creditsValue = userDetails?.credits ?? 0
  const progressValue = Math.min((creditsValue / 50) * 100, 100)

  const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <>
      <Sidebar>
        <SidebarHeader className='p-5'>
          <>
            <div className='flex items-center gap-2'>
              <Image src="/logo.svg" alt="Logo" width={35} height={35} />
              <h2 className='font-bold text-md'>AI Website Generator</h2>
            </div>
            <Link href="/workspace" className='mt-5 w-full'>
              <Button className='w-full'>
                + Add New Project
              </Button>
            </Link>
          </>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className='p-2'>
            <SidebarGroupLabel>My Projects</SidebarGroupLabel>

            {/* Search Bar */}
            {!loading && projects.length > 0 && (
              <div className="px-2 mb-2">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className='flex items-center gap-2 text-gray-400 text-sm p-2'>
                <Loader2 className='size-4 animate-spin' />
                <span>Loading projects...</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && projects.length === 0 && (
              <div className='flex flex-col items-center gap-2 p-4 text-center'>
                <FolderOpen className='size-8 text-gray-300' />
                <p className='text-gray-400 text-sm'>No projects yet</p>
                <p className='text-gray-300 text-xs'>Create your first project above!</p>
              </div>
            )}
            
            {/* Search No Results */}
            {!loading && projects.length > 0 && filteredProjects.length === 0 && (
              <div className="text-center p-4 text-sm text-gray-500">
                No projects found.
              </div>
            )}

            {/* Projects List */}
            {!loading && filteredProjects.length > 0 && (
              <div className='flex flex-col gap-1 mt-1'>
                {filteredProjects.map((project) => (
                  <div
                    key={project.projectId}
                    className='w-full px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors group flex items-center justify-between cursor-pointer'
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FolderOpen className='size-4 text-gray-400 group-hover:text-blue-500 shrink-0' />
                      <span className='truncate text-gray-700 group-hover:text-blue-600 leading-tight'>
                        {project.title}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteProject(e, project.projectId)}
                      disabled={deletingId === project.projectId}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      title="Delete project"
                    >
                      {deletingId === project.projectId ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div>
            <div className='flex items-center justify-between mb-1'>
              <h2 className='text-sm text-gray-500'>
                Remaining Credits:{' '}
                <span className='font-bold text-gray-700'>{userDetails?.credits ?? 0}</span>
              </h2>
            </div>
            <Progress value={progressValue} className='mt-1' />
            <Link href='/pricing' className='w-full block mt-2'>
              <Button className='w-full' variant='outline'>
                <ExternalLink className='size-3 mr-1' /> Upgrade Plan
              </Button>
            </Link>
          </div>
          <div className='flex items-center gap-2 mt-2'>
            <UserButton />
            <Button variant="ghost" onClick={() => setShowSettings(true)}>
              <Settings className='size-4 mr-1' /> Settings
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Settings Modal */}
      {showSettings && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold text-gray-800'>Account Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X className='size-5' />
              </button>
            </div>

            <div className='flex flex-col gap-4'>
              {/* User Info */}
              <div className='bg-gray-50 rounded-xl p-4'>
                <p className='text-sm text-gray-500 mb-1'>Logged in as</p>
                <div className='flex items-center gap-3'>
                  <UserButton />
                  <div>
                    <p className='text-sm font-medium text-gray-800'>{userDetails?.name || 'User'}</p>
                    <p className='text-xs text-gray-500'>{userDetails?.email || ''}</p>
                  </div>
                </div>
              </div>

              {/* Credits Info */}
              <div className='bg-blue-50 rounded-xl p-4'>
                <p className='text-sm text-gray-600 mb-2'>Credits Remaining</p>
                <div className='flex items-center justify-between'>
                  <span className='text-2xl font-bold text-blue-600'>{userDetails?.credits ?? 0}</span>
                  <Link href='/pricing'>
                    <Button size='sm' className='bg-blue-500 hover:bg-blue-600 text-white' onClick={() => setShowSettings(false)}>
                      Buy More
                    </Button>
                  </Link>
                </div>
                <Progress value={progressValue} className='mt-2' />
              </div>

              {/* Quick Links */}
              <div className='flex gap-2'>
                <Link href='/pricing' className='flex-1'>
                  <Button variant='outline' className='w-full text-sm' onClick={() => setShowSettings(false)}>
                    Pricing Plans
                  </Button>
                </Link>
                <Link href='/contact' className='flex-1'>
                  <Button variant='outline' className='w-full text-sm' onClick={() => setShowSettings(false)}>
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