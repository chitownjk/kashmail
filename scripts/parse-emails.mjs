import { simpleParser } from "mailparser"
import { readdir, readFile, writeFile, mkdir } from "fs/promises"
import { join, basename } from "path"
import { createHash } from "crypto"

const DATA_DIR = join(process.cwd(), "data", "emails")
const PARSED_DIR = join(process.cwd(), "data", "parsed")
const ATTACHMENTS_DIR = join(process.cwd(), "public", "attachments")

function generateId(label, filename) {
  return createHash("md5").update(`${label}/${filename}`).digest("hex").slice(0, 12)
}

function extractAddress(addr) {
  if (!addr) return { name: "", email: "" }
  if (addr.value && addr.value.length > 0) {
    const first = addr.value[0]
    return { name: first.name || "", email: first.address || "" }
  }
  return { name: "", email: "" }
}

function extractAddressList(addr) {
  if (!addr) return []
  if (addr.value) {
    return addr.value.map((a) => ({ name: a.name || "", email: a.address || "" }))
  }
  return []
}

async function parseEmail(filePath, label) {
  const raw = await readFile(filePath)
  const parsed = await simpleParser(raw)
  const filename = basename(filePath)
  const id = generateId(label, filename)

  const attachments = []
  const attachmentDir = join(ATTACHMENTS_DIR, id)

  if (parsed.attachments && parsed.attachments.length > 0) {
    await mkdir(attachmentDir, { recursive: true })

    for (const att of parsed.attachments) {
      const safeName = (att.filename || `attachment-${attachments.length}`).replace(/[^a-zA-Z0-9._-]/g, "_")
      const attPath = join(attachmentDir, safeName)
      await writeFile(attPath, att.content)

      attachments.push({
        filename: att.filename || safeName,
        contentType: att.contentType || "application/octet-stream",
        size: att.size || att.content.length,
        path: `/attachments/${id}/${safeName}`,
        contentId: att.contentId || null,
      })
    }
  }

  const from = extractAddress(parsed.from)
  const to = extractAddressList(parsed.to)
  const cc = extractAddressList(parsed.cc)

  let htmlBody = parsed.html || ""
  // Replace cid: references with actual attachment paths
  for (const att of attachments) {
    if (att.contentId) {
      const cid = att.contentId.replace(/^<|>$/g, "")
      htmlBody = htmlBody.replace(new RegExp(`cid:${cid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), att.path)
    }
  }

  return {
    id,
    label,
    subject: parsed.subject || "(no subject)",
    from,
    to,
    cc,
    date: parsed.date ? parsed.date.toISOString() : null,
    textBody: parsed.text || "",
    htmlBody,
    snippet: (parsed.text || "").slice(0, 200).replace(/\s+/g, " ").trim(),
    attachments: attachments.map(({ contentId, ...rest }) => rest),
    hasAttachments: attachments.length > 0,
    messageId: parsed.messageId || null,
    inReplyTo: parsed.inReplyTo || null,
    references: parsed.references || [],
  }
}

async function main() {
  console.log("Parsing email archive...")
  await mkdir(PARSED_DIR, { recursive: true })
  await mkdir(ATTACHMENTS_DIR, { recursive: true })

  const labels = await readdir(DATA_DIR)
  const allEmails = []
  let errorCount = 0

  for (const label of labels) {
    const labelDir = join(DATA_DIR, label)
    const files = (await readdir(labelDir)).filter((f) => f.endsWith(".eml"))
    console.log(`  ${label}: ${files.length} emails`)

    for (const file of files) {
      try {
        const email = await parseEmail(join(labelDir, file), label)
        allEmails.push(email)
      } catch (err) {
        console.error(`  Error parsing ${label}/${file}: ${err.message}`)
        errorCount++
      }
    }
  }

  // Sort by date descending
  allEmails.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  // Group into threads by references/inReplyTo
  const threadMap = new Map()
  for (const email of allEmails) {
    const refs = Array.isArray(email.references) ? email.references : email.references ? [email.references] : []
    const threadKey = refs.length > 0 ? refs[0] : email.inReplyTo || email.messageId || email.id
    if (!threadMap.has(threadKey)) {
      threadMap.set(threadKey, [])
    }
    threadMap.get(threadKey).push(email.id)
  }

  const threads = []
  const emailThreadMap = {}
  let threadIdx = 0
  for (const [, emailIds] of threadMap) {
    const threadId = `thread-${threadIdx++}`
    threads.push({ id: threadId, emailIds })
    for (const eid of emailIds) {
      emailThreadMap[eid] = threadId
    }
  }

  // Assign threadId to each email
  for (const email of allEmails) {
    email.threadId = emailThreadMap[email.id] || null
  }

  // Build label stats
  const labelStats = {}
  for (const email of allEmails) {
    labelStats[email.label] = (labelStats[email.label] || 0) + 1
  }

  const index = {
    totalEmails: allEmails.length,
    labels: labelStats,
    threads,
    generatedAt: new Date().toISOString(),
  }

  await writeFile(join(PARSED_DIR, "index.json"), JSON.stringify(index, null, 2))
  await writeFile(join(PARSED_DIR, "emails.json"), JSON.stringify(allEmails, null, 2))

  console.log(`\nDone! ${allEmails.length} emails parsed, ${errorCount} errors`)
  console.log(`Labels: ${JSON.stringify(labelStats)}`)
  console.log(`Threads: ${threads.length}`)
}

main().catch(console.error)
