'use client'

import React, { createContext, useContext, useState } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebarContext() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider')
  }
  return context
}

export function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  )
}

export function HamburgerButton() {
  const { isCollapsed, setIsCollapsed } = useSidebarContext()

  return (
    <button
      onClick={() => setIsCollapsed(!isCollapsed)}
      className="p-2 hover:bg-gray-100 rounded-md transition-colors"
      aria-label={isCollapsed ? 'Apri menu' : 'Chiudi menu'}
    >
      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isCollapsed ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        )}
      </svg>
    </button>
  )
}
