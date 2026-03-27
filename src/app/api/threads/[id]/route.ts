import { NextRequest, NextResponse } from "next/server"
import { getThread } from "@/lib/emails"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const emails = await getThread(id)
  return NextResponse.json({ emails })
}
