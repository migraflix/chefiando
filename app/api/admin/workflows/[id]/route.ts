import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const n8nUrl = process.env.N8N_BASE_URL || 'https://n8n.migraflix.com'
  const n8nKey = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NDQ1ODdkZS02M2RmLTRhODgtYTM2Ny0wNjZkNjlkZDM5ZjAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc4NTM4NjEyfQ.q7L3noP5pVcsefm37dWtV-ar-j3u1ComT0_bTzgCZqo'

  const res = await fetch(`${n8nUrl}/api/v1/workflows/${id}`, {
    headers: { 'X-N8N-API-KEY': n8nKey },
  })

  if (!res.ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const data = await res.json()
  return NextResponse.json(data)
}
