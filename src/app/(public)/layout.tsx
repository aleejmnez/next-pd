import React from 'react'
import { Suspense } from 'react'
import { Navbar } from '@/components/common/Navbar'
import { Footer } from '@/components/common/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-(--background) text-(--foreground)">
      <Suspense fallback={<div className="h-20" aria-hidden="true" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
