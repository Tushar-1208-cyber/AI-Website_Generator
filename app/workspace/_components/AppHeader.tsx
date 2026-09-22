'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { UserButton } from '@clerk/nextjs'
import React from 'react'

function AppHeader() {
  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 z-50">
      {/* Left side (logo or sidebar trigger) */}
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold text-gray-800">Workspace</h1>
      </div>

      {/* Right side (User button) */}
      <div className="flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  )
}

export default AppHeader
