import { NextResponse } from 'next/server'
import { ensureDbSchema } from '@/lib/db-setup'

export async function GET() {
  await ensureDbSchema()
  return NextResponse.json({ ok: true })
}

export async function POST() {
  await ensureDbSchema()
  return NextResponse.json({ ok: true })
}
