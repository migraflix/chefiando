import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const res = await fetch(`${process.env.N8N_BASE_URL}/api/v1/workflows?limit=250`, {
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY!,
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    return NextResponse.json({ error: `n8n error ${res.status}: ${errText}` }, { status: 500 })
  }

  const data = await res.json()
  // Filter to only active workflows (n8n ignores ?active=true in some versions)
  const filtered = {
    ...data,
    data: (data.data || []).filter((wf: { active: boolean; isArchived?: boolean }) => wf.active && !wf.isArchived),
  }
  return NextResponse.json(filtered)
}
