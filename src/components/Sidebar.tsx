"use client"

import { InboxIcon, LabelIcon } from "./Icons"
import { getLabelColor } from "@/lib/format"

interface SidebarProps {
  labels: Record<string, number>
  totalEmails: number
  activeLabel: string | null
  onSelectLabel: (label: string | null) => void
  collapsed: boolean
}

export function Sidebar({ labels, totalEmails, activeLabel, onSelectLabel, collapsed }: SidebarProps) {
  if (collapsed) {
    return (
      <aside className="w-[68px] border-r border-gray-200 bg-white pt-2 flex-shrink-0 overflow-hidden">
        <button
          onClick={() => onSelectLabel(null)}
          className={`w-full flex justify-center py-3 rounded-r-full ${
            activeLabel === null ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
          title="All Mail"
        >
          <InboxIcon className={`w-5 h-5 ${activeLabel === null ? "text-blue-700" : "text-gray-600"}`} />
        </button>
        {Object.keys(labels)
          .sort()
          .map((label) => (
            <button
              key={label}
              onClick={() => onSelectLabel(label)}
              className={`w-full flex justify-center py-3 rounded-r-full ${
                activeLabel === label ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              title={label}
            >
              <LabelIcon className={`w-5 h-5 ${activeLabel === label ? "text-blue-700" : "text-gray-600"}`} />
            </button>
          ))}
      </aside>
    )
  }

  return (
    <aside className="w-[256px] border-r border-gray-200 bg-white pt-2 flex-shrink-0 overflow-y-auto">
      <button
        onClick={() => onSelectLabel(null)}
        className={`w-full flex items-center gap-3 px-6 py-2 text-sm rounded-r-full transition-colors ${
          activeLabel === null
            ? "bg-blue-100 text-blue-700 font-semibold"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <InboxIcon className="w-5 h-5" />
        <span className="flex-1 text-left">All Mail</span>
        <span className="text-xs">{totalEmails}</span>
      </button>

      <div className="mt-4 px-6 mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Labels</span>
      </div>

      {Object.entries(labels)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, count]) => (
          <button
            key={label}
            onClick={() => onSelectLabel(label)}
            className={`w-full flex items-center gap-3 px-6 py-2 text-sm rounded-r-full transition-colors ${
              activeLabel === label
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LabelIcon className="w-5 h-5" />
            <span className="flex-1 text-left">{label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getLabelColor(label)}`}>{count}</span>
          </button>
        ))}
    </aside>
  )
}
