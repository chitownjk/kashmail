"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/Sidebar"
import { EmailList } from "@/components/EmailList"
import { EmailViewer } from "@/components/EmailViewer"
import { SearchBar } from "@/components/SearchBar"
import { MenuIcon } from "@/components/Icons"
import type { EmailSummary } from "@/lib/emails"

export default function Home() {
  const [emails, setEmails] = useState<EmailSummary[]>([])
  const [labels, setLabels] = useState<Record<string, number>>({})
  const [totalEmails, setTotalEmails] = useState(0)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)

  // Initial load
  useEffect(() => {
    fetch("/api/emails")
      .then((r) => r.json())
      .then((data) => {
        setEmails(data.emails)
        setLabels(data.labels)
        setTotalEmails(data.totalEmails)
      })
      .finally(() => setLoading(false))
  }, [])

  // Filter by label
  const handleSelectLabel = useCallback((label: string | null) => {
    setActiveLabel(label)
    setSelectedEmailId(null)
    setSearching(false)
    setLoading(true)

    const url = label ? `/api/emails?label=${encodeURIComponent(label)}` : "/api/emails"
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setEmails(data.emails)
      })
      .finally(() => setLoading(false))
  }, [])

  // Search
  const handleSearch = useCallback((query: string) => {
    setSearching(true)
    setSelectedEmailId(null)
    setLoading(true)

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        setEmails(data.emails)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleClearSearch = useCallback(() => {
    if (!searching) return
    setSearching(false)
    handleSelectLabel(activeLabel)
  }, [searching, activeLabel, handleSelectLabel])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top bar - Gmail style */}
      <header className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-200 z-10">
        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="p-2 hover:bg-gray-100 rounded-full"
          title="Toggle sidebar"
        >
          <MenuIcon className="w-6 h-6 text-gray-600" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 w-[180px]">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
            <rect width="24" height="24" rx="4" fill="#EA4335" />
            <path d="M4 8l8 5 8-5" stroke="white" strokeWidth="1.5" fill="none" />
            <rect x="4" y="7" width="16" height="11" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
          </svg>
          <span className="text-xl text-gray-700">KashMail</span>
        </div>

        <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />

        <div className="w-[180px]" /> {/* Spacer */}
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          labels={labels}
          totalEmails={totalEmails}
          activeLabel={activeLabel}
          onSelectLabel={handleSelectLabel}
          collapsed={sidebarCollapsed}
        />

        <main className="flex-1 flex overflow-hidden">
          {selectedEmailId ? (
            <div className="flex-1 overflow-hidden">
              <EmailViewer emailId={selectedEmailId} onBack={() => setSelectedEmailId(null)} />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <EmailList
                  emails={emails}
                  selectedId={selectedEmailId}
                  onSelect={setSelectedEmailId}
                  sortOrder={sortOrder}
                  onSortChange={setSortOrder}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
