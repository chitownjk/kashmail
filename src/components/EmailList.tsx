"use client"

import { formatDate, formatSender, getLabelColor } from "@/lib/format"
import { AttachmentIcon } from "./Icons"
import type { EmailSummary } from "@/lib/emails"

interface EmailListProps {
  emails: EmailSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
  sortOrder: "newest" | "oldest"
  onSortChange: (order: "newest" | "oldest") => void
}

export function EmailList({ emails, selectedId, onSelect, sortOrder, onSortChange }: EmailListProps) {
  const sorted = [...emails].sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime()
    return sortOrder === "newest" ? diff : -diff
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <span className="text-sm text-gray-600">
          1-{sorted.length} of {sorted.length}
        </span>
        <select
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
          className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 bg-white"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No emails found</div>
        )}
        {sorted.map((email) => (
          <button
            key={email.id}
            onClick={() => onSelect(email.id)}
            className={`email-row w-full flex items-center gap-2 px-4 py-2 text-left border-b border-gray-100 relative cursor-pointer transition-colors ${
              selectedId === email.id ? "bg-blue-50" : "bg-white hover:bg-gray-50"
            }`}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {formatSender(email.from).charAt(0).toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {formatSender(email.from)}
                </span>
                {email.hasAttachments && (
                  <AttachmentIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm flex-shrink-0 ${getLabelColor(email.label)}`}>
                  {email.label}
                </span>
                <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                  {formatDate(email.date)}
                </span>
              </div>
              <div className="text-sm text-gray-900 truncate">{email.subject}</div>
              <div className="text-xs text-gray-500 truncate">{email.snippet}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
