"use client"
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, Loader2, Save, Settings2, ChevronDown, Plus, Layers } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

interface PlaygroundHeaderProps {
  onSettingsToggle?: () => void
  currentDesignCode?: string
}

interface VersionItem {
  frameID: string
  createdOn: string
}

function PlaygroundHeader({ onSettingsToggle, currentDesignCode }: PlaygroundHeaderProps) {
  const { projectId } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const frameId = searchParams.get('frameId')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [creatingVersion, setCreatingVersion] = useState(false)
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
      // Verify the frame exists (design code is auto-saved in the background)
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
    <div className='flex h-16 shrink-0 items-center justify-between p-4 shadow'>
      {/* Logo — click to go back to workspace */}
      <Link href="/workspace">
        <Image src="/logo.svg" alt="Logo" width={35} height={35} priority />
      </Link>

      {/* Right buttons */}
      <div className='flex items-center gap-2'>
        {/* Version Switcher */}
        <div className='relative' ref={dropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVersions((prev) => !prev)}
            className='flex items-center gap-1.5'
          >
            <Layers className='size-4' />
            {frameId && versionIndex(frameId) >= 0 ? `V${versionIndex(frameId) + 1}` : 'Version'}
            <ChevronDown className='size-3' />
          </Button>

          {showVersions && (
            <div className='absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1'>
              <div className='px-3 py-1.5 text-xs font-medium text-gray-400'>Versions</div>
              <div className='max-h-56 overflow-y-auto'>
                {versions.map((v, idx) => (
                  <Link
                    key={v.frameID}
                    href={`/playground/${projectId}?frameId=${v.frameID}`}
                    onClick={() => setShowVersions(false)}
                    className={`flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 ${
                      v.frameID === frameId ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    Version {idx + 1}
                    {v.frameID === frameId && <Check className='size-3.5' />}
                  </Link>
                ))}
              </div>
              <div className='border-t border-gray-100 mt-1 pt-1'>
                <button
                  onClick={handleNewVersion}
                  disabled={creatingVersion}
                  className='w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50'
                >
                  {creatingVersion ? (
                    <Loader2 className='size-3.5 animate-spin' />
                  ) : (
                    <Plus className='size-3.5' />
                  )}
                  New Version
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={onSettingsToggle}
          title="Toggle Settings"
        >
          <Settings2 className='size-4' />
        </Button>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 transition-all ${
            saved ? 'bg-green-600 hover:bg-green-600' : 'bg-black hover:bg-black/90'
          } text-white`}
        >
          {saving ? (
            <Loader2 className='size-4 animate-spin' />
          ) : saved ? (
            <Check className='size-4' />
          ) : (
            <Save className='size-4' />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

export default PlaygroundHeader
