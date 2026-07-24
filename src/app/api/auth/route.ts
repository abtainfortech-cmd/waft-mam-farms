import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST login: verify username + password, return role and staff info
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const staff = await db.staff.findFirst({
      where: { username, password, isActive: true },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const { password: _, ...safe } = staff
    return NextResponse.json({ success: true, staff: safe })
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
