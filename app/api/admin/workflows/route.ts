// v4
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const N8N_URL = 'https://n8n.migraflix.com'
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NDQ1ODdkZS02M2RmLTRhODgtYTM2Ny0wNjZkNjlkZDM5ZjAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc4NTQxOTM0fQ.yVwDBFbGl2OzahjQ-cpJZ4j-cfTV-jqa5Nuix5TX6ac'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const res = await fetch(`${N8N_URL}/api/v1/workflows?limit=250`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'User-Agent': 'Mozilla/5.0' },
  })

  if (!res.ok) {
    const errText = await res.text()
    return NextResponse.json({ error: `n8n ${res.status}: ${errText}` }, { status: 500 })
  }

  const data = await res.json()
  const filtered = {
    ...data,
    data: (data.data || []).filter((wf: { active: boolean; isArchived?: boolean }) => wf.active && !wf.isArchived),
  }
  return NextResponse.json(filtered)
}
