"use client"
import React, { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <html>
      <body style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', gap: '1rem' }}>
        <h2>Something went wrong.</h2>
        <button
          onClick={() => reset()}
          style={{ padding: '0.5rem 1rem', background: 'black', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </body>
    </html>
  )
}
