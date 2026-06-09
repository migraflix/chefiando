import { NextResponse } from 'next/server'
import { signToken, isAdminEmail } from '@/lib/auth'

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: 'Email no autorizado' }, { status: 401 })
  }

  const token = await signToken(email)

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
