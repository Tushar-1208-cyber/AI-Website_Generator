"use client"
import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="size-12 text-amber-500" />
      <h2 className="text-xl font-semibold text-gray-800">Something went wrong</h2>
      <p className="text-sm text-gray-500 max-w-md">
        An unexpected error occurred. This has been logged. You can try again, or go back to your workspace.
      </p>
      <div className="flex gap-3 mt-2">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/workspace')}>
          Go to Workspace
        </Button>
      </div>
    </div>
  )
}
