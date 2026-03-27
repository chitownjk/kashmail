import { readFile } from "fs/promises"
import { join } from "path"

export interface EmailAddress {
  name: string
  email: string
}

export interface Attachment {
  filename: string
  contentType: string
  size: number
  path: string
}

export interface Email {
  id: string
  label: string
  subject: string
  from: EmailAddress
  to: EmailAddress[]
  cc: EmailAddress[]
  date: string | null
  textBody: string
  htmlBody: string
  snippet: string
  attachments: Attachment[]
  hasAttachments: boolean
  messageId: string | null
  inReplyTo: string | null
  references: string[]
  threadId: string | null
}

export interface EmailSummary {
  id: string
  label: string
  subject: string
  from: EmailAddress
  to: EmailAddress[]
  date: string | null
  snippet: string
  hasAttachments: boolean
  threadId: string | null
}

export interface Thread {
  id: string
  emailIds: string[]
}

export interface EmailIndex {
  totalEmails: number
  labels: Record<string, number>
  threads: Thread[]
  generatedAt: string
}

const PARSED_DIR = join(process.cwd(), "data", "parsed")

let cachedEmails: Email[] | null = null
let cachedIndex: EmailIndex | null = null

export async function getIndex(): Promise<EmailIndex> {
  if (cachedIndex) return cachedIndex
  const raw = await readFile(join(PARSED_DIR, "index.json"), "utf-8")
  cachedIndex = JSON.parse(raw)
  return cachedIndex!
}

export async function getAllEmails(): Promise<Email[]> {
  if (cachedEmails) return cachedEmails
  const raw = await readFile(join(PARSED_DIR, "emails.json"), "utf-8")
  cachedEmails = JSON.parse(raw)
  return cachedEmails!
}

export async function getEmailSummaries(): Promise<EmailSummary[]> {
  const emails = await getAllEmails()
  return emails.map(({ id, label, subject, from, to, date, snippet, hasAttachments, threadId }) => ({
    id,
    label,
    subject,
    from,
    to,
    date,
    snippet,
    hasAttachments,
    threadId,
  }))
}

export async function getEmailById(id: string): Promise<Email | null> {
  const emails = await getAllEmails()
  return emails.find((e) => e.id === id) || null
}

export async function searchEmails(query: string): Promise<EmailSummary[]> {
  const emails = await getAllEmails()
  const q = query.toLowerCase()
  return emails
    .filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.from.name.toLowerCase().includes(q) ||
        e.from.email.toLowerCase().includes(q) ||
        e.textBody.toLowerCase().includes(q) ||
        e.to.some((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q))
    )
    .map(({ id, label, subject, from, to, date, snippet, hasAttachments, threadId }) => ({
      id,
      label,
      subject,
      from,
      to,
      date,
      snippet,
      hasAttachments,
      threadId,
    }))
}

export async function getEmailsByLabel(label: string): Promise<EmailSummary[]> {
  const emails = await getAllEmails()
  return emails
    .filter((e) => e.label === label)
    .map(({ id, label: l, subject, from, to, date, snippet, hasAttachments, threadId }) => ({
      id,
      label: l,
      subject,
      from,
      to,
      date,
      snippet,
      hasAttachments,
      threadId,
    }))
}

export async function getThread(threadId: string): Promise<Email[]> {
  const emails = await getAllEmails()
  return emails.filter((e) => e.threadId === threadId).sort((a, b) => {
    if (!a.date) return -1
    if (!b.date) return 1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}
