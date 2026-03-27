import { NextRequest, NextResponse } from "next/server"
import { searchEmails } from "@/lib/emails"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || ""

  if (query.length < 2) {
    return NextResponse.json({ emails: [] })
  }

  const emails = await searchEmails(query)
  return NextResponse.json({ emails })
}
