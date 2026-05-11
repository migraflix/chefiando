// v4
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const N8N_URL = 'https://n8n.migraflix.com'
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NDQ1ODdkZS02M2RmLTRhODgtYTM2Ny0wNjZkNjlkZDM5ZjAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc4NTQxOTM0fQ.yVwDBFbGl2OzahjQ-cpJZ4j-cfTV-jqa5Nuix5TX6ac'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const res = await fetch(`${N8N_URL}/api/v1/workflows/${id}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'User-Agent': 'Mozilla/5.0' },
  })

  if (!res.ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const data = await res.json()
  return NextResponse.json(data)
}
