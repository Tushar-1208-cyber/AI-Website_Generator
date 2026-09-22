"use client"

import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import AppHeader from './_components/AppHeader'
import AppSidebar from './_components/AppSidebar'

function Workspacelayout(
    {
        children,
      }: Readonly<{
        children: React.ReactNode;
      }>) {
  return (
    <SidebarProvider>
    <AppSidebar />
    <div className='w-full'>
        <AppHeader />
        <div className='pt-16'>
          {children}
        </div>
    </div>
    </SidebarProvider>
  )
}

export default Workspacelayout