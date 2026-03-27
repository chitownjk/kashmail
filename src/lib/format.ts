export function formatDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const isThisYear = date.getFullYear() === now.getFullYear()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }
  if (isThisYear) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatSender(from: { name: string; email: string }): string {
  return from.name || from.email.split("@")[0] || "Unknown"
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const LABEL_COLORS: Record<string, string> = {
  Aaryan: "bg-blue-100 text-blue-700",
  Business: "bg-yellow-100 text-yellow-700",
  DC: "bg-green-100 text-green-700",
  Photos: "bg-purple-100 text-purple-700",
  Siya: "bg-pink-100 text-pink-700",
  Travel: "bg-orange-100 text-orange-700",
  Work: "bg-gray-100 text-gray-700",
}

export function getLabelColor(label: string): string {
  return LABEL_COLORS[label] || "bg-gray-100 text-gray-700"
}
