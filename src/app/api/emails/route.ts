import { NextRequest, NextResponse } from "next/server"
import { getEmailSummaries, getEmailsByLabel, getIndex } from "@/lib/emails"

export async function GET(request: NextRequest) {
  const label = request.nextUrl.searchParams.get("label")

  if (label) {
    const emails = await getEmailsByLabel(label)
    return NextResponse.json({ emails })
  }

  const [emails, index] = await Promise.all([getEmailSummaries(), getIndex()])
  return NextResponse.json({ emails, labels: index.labels, totalEmails: index.totalEmails })
}
