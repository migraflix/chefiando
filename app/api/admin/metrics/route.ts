import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

async function getAirtableMetrics() {
  const base = process.env.AIRTABLE_BASE_ID
  const key = process.env.AIRTABLE_API_KEY
  const headers = { Authorization: `Bearer ${key}` }

  const fetchAll = async (table: string, fields: string[]) => {
    const records: unknown[] = []
    let offset: string | undefined
    do {
      const params = new URLSearchParams()
      fields.forEach(f => params.append('fields[]', f))
      if (offset) params.set('offset', offset)
      const res = await fetch(`https://api.airtable.com/v0/${base}/${table}?${params}`, { headers })
      const data = await res.json()
      records.push(...(data.records || []))
      offset = data.offset
    } while (offset)
    return records
  }

  const [brands, content] = await Promise.all([
    fetchAll('Brands', ['Status']),
    fetchAll('Content', ['Status']),
  ])

  const count = (records: unknown[], field: string) => {
    const map: Record<string, number> = {}
    for (const r of records as { fields: Record<string, string> }[]) {
      const s = r.fields?.[field] || 'Sin estado'
      map[s] = (map[s] || 0) + 1
    }
    return map
  }

  return {
    totalBrands: brands.length,
    brandsByStatus: count(brands, 'Status'),
    totalContent: content.length,
    contentByStatus: count(content, 'Status'),
  }
}

async function getOpenAICosts() {
  try {
    const now = new Date()
    // Previous month
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    // Current month
    const currStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const fmt = (d: Date) => d.toISOString().split('T')[0]

    const fetchCosts = async (startDate: string, endDate: string) => {
      const res = await fetch(
        `https://api.openai.com/v1/usage?date=${startDate}`,
        { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
      )
      if (!res.ok) return null
      const data = await res.json()
      let tokens = 0
      for (const day of data.data || []) {
        tokens += (day.n_context_tokens_total || 0) + (day.n_generated_tokens_total || 0)
      }
      return { tokens, startDate, endDate }
    }

    const [prev, curr] = await Promise.all([
      fetchCosts(fmt(prevStart), fmt(prevEnd)),
      fetchCosts(fmt(currStart), fmt(now)),
    ])

    return { previous: prev, current: curr }
  } catch {
    return null
  }
}

async function getFalBalance() {
  // fal.ai doesn't have a public billing REST API
  // Return null so the UI can show a direct link to dashboard
  return null
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [airtable, openai] = await Promise.all([
    getAirtableMetrics(),
    getOpenAICosts(),
  ])

  return NextResponse.json({ airtable, openai, fal: null })
}
