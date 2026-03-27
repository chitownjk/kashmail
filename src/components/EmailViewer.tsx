"use client"

import { useState, useEffect, useRef } from "react"
import { formatFullDate, formatSender, formatFileSize, getLabelColor } from "@/lib/format"
import { ArrowBackIcon, ImageIcon, FileIcon, DownloadIcon } from "./Icons"
import type { Email } from "@/lib/emails"

interface EmailViewerProps {
  emailId: string
  onBack: () => void
}

export function EmailViewer({ emailId, onBack }: EmailViewerProps) {
  const [email, setEmail] = useState<Email | null>(null)
  const [thread, setThread] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set())
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/emails/${emailId}`)
      .then((r) => r.json())
      .then((data) => {
        setEmail(data.email)
        setExpandedEmails(new Set([data.email.id]))

        if (data.email.threadId) {
          fetch(`/api/threads/${data.email.threadId}`)
            .then((r) => r.json())
            .then((threadData) => {
              setThread(threadData.emails)
              if (threadData.emails.length > 1) {
                setExpandedEmails(new Set([threadData.emails[threadData.emails.length - 1].id]))
              }
            })
        }
      })
      .finally(() => setLoading(false))
  }, [emailId])

  const toggleExpand = (id: string) => {
    setExpandedEmails((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!email) {
    return <div className="flex items-center justify-center h-full text-gray-400">Email not found</div>
  }

  const emailsToShow = thread.length > 1 ? thread : [email]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full" title="Back to list">
          <ArrowBackIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Subject */}
      <div className="px-16 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-xl text-gray-900">{email.subject}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-sm ${getLabelColor(email.label)}`}>{email.label}</span>
        </div>
        {thread.length > 1 && <span className="text-sm text-gray-500">{thread.length} messages in thread</span>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {emailsToShow.map((msg) => (
          <EmailMessage
            key={msg.id}
            email={msg}
            expanded={expandedEmails.has(msg.id)}
            onToggle={() => toggleExpand(msg.id)}
            iframeRef={msg.id === emailId ? iframeRef : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function EmailMessage({
  email,
  expanded,
  onToggle,
  iframeRef,
}: {
  email: Email
  expanded: boolean
  onToggle: () => void
  iframeRef?: React.RefObject<HTMLIFrameElement | null>
}) {
  const [iframeHeight, setIframeHeight] = useState(200)

  const handleIframeLoad = () => {
    const iframe = iframeRef?.current
    if (iframe?.contentDocument) {
      const height = iframe.contentDocument.documentElement.scrollHeight
      setIframeHeight(Math.min(Math.max(height, 100), 2000))
    }
  }

  if (!expanded) {
    return (
      <button onClick={onToggle} className="w-full text-left px-16 py-3 hover:bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {formatSender(email.from).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900">{formatSender(email.from)}</span>
            <span className="text-sm text-gray-500 ml-2 truncate">{email.snippet}</span>
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0">{formatFullDate(email.date)}</span>
        </div>
      </button>
    )
  }

  const imageAttachments = email.attachments.filter((a) => a.contentType.startsWith("image/"))
  const otherAttachments = email.attachments.filter((a) => !a.contentType.startsWith("image/"))

  return (
    <div className="border-b border-gray-100">
      {/* Message header */}
      <div className="px-16 py-4 cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {formatSender(email.from).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{formatSender(email.from)}</span>
              <span className="text-sm text-gray-500">&lt;{email.from.email}&gt;</span>
            </div>
            <div className="text-xs text-gray-500">
              to {email.to.map((t) => t.name || t.email).join(", ")}
              {email.cc.length > 0 && <>, cc: {email.cc.map((c) => c.name || c.email).join(", ")}</>}
            </div>
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
            {formatFullDate(email.date)}
          </span>
        </div>
      </div>

      {/* Message body */}
      <div className="px-16 pb-4">
        {email.htmlBody ? (
          <iframe
            ref={iframeRef}
            srcDoc={`<!DOCTYPE html><html><head><style>body{font-family:"Google Sans",Roboto,Arial,sans-serif;font-size:14px;line-height:1.6;color:#333;margin:0;padding:0;}img{max-width:100%;height:auto;}a{color:#1a73e8;}</style></head><body>${email.htmlBody}</body></html>`}
            className="w-full border-0"
            style={{ height: iframeHeight }}
            onLoad={handleIframeLoad}
            sandbox="allow-same-origin"
            title="Email content"
          />
        ) : (
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{email.textBody}</div>
        )}
      </div>

      {/* Image attachments - inline preview */}
      {imageAttachments.length > 0 && (
        <div className="px-16 pb-4">
          <div className="flex flex-wrap gap-3">
            {imageAttachments.map((att) => (
              <a
                key={att.path}
                href={att.path}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
              >
                <img
                  src={att.path}
                  alt={att.filename}
                  className="max-h-48 w-auto object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    <span className="truncate">{att.filename}</span>
                    <span className="ml-auto">{formatFileSize(att.size)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Other attachments */}
      {otherAttachments.length > 0 && (
        <div className="px-16 pb-4">
          <div className="flex flex-wrap gap-2">
            {otherAttachments.map((att) => (
              <a
                key={att.path}
                href={att.path}
                download={att.filename}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FileIcon className="w-5 h-5 text-gray-400" />
                <div className="text-sm">
                  <div className="text-gray-700 truncate max-w-[200px]">{att.filename}</div>
                  <div className="text-gray-400 text-xs">{formatFileSize(att.size)}</div>
                </div>
                <DownloadIcon className="w-4 h-4 text-gray-400 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
