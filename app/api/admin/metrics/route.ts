import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

async function getAirtableMetrics() {
  const base = process.env.AIRTABLE_BASE_ID
  const key = process.env.AIRTABLE_API_KEY
  const headers = { Authorization: `Bearer ${key}` }

  const [brandsRes, contentRes] = await Promise.all([
    fetch(`https://api.airtable.com/v0/${base}/Brands?fields%5B%5D=Status`, { headers }),
    fetch(`https://api.airtable.com/v0/${base}/Content?fields%5B%5D=Status`, { headers }),
  ])

  const [brandsData, contentData] = await Promise.all([
    brandsRes.json(),
    contentRes.json(),
  ])

  const brands = brandsData.records || []
  const content = contentData.records || []

  const brandsByStatus: Record<string, number> = {}
  for (const b of brands) {
    const s = b.fields?.Status || 'Sin estado'
    brandsByStatus[s] = (brandsByStatus[s] || 0) + 1
  }

  const contentByStatus: Record<string, number> = {}
  for (const c of content) {
    const s = c.fields?.Status || 'Sin estado'
    contentByStatus[s] = (contentByStatus[s] || 0) + 1
  }

  return {
    totalBrands: brands.length,
    brandsByStatus,
    totalContent: content.length,
    contentByStatus,
  }
}

async function getOpenAISpend() {
  try {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const startDate = start.toISOString().split('T')[0]
    const endDate = now.toISOString().split('T')[0]

    const res = await fetch(
      `https://api.openai.com/v1/usage?date=${startDate}`,
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    )
    if (!res.ok) return null

    const data = await res.json()
    // Sum context + generated tokens across all days
    let totalTokens = 0
    for (const day of data.data || []) {
      totalTokens += (day.n_context_tokens_total || 0) + (day.n_generated_tokens_total || 0)
    }
    return { totalTokens, startDate, endDate }
  } catch {
    return null
  }
}

async function getFalSpend() {
  try {
    const res = await fetch('https://rest.alpha.fal.ai/billing/usage', {
      headers: { Authorization: `Key ${process.env.FAL_API_KEY}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch {
    return null
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [airtable, openai, fal] = await Promise.all([
    getAirtableMetrics(),
    getOpenAISpend(),
    getFalSpend(),
  ])

  return NextResponse.json({ airtable, openai, fal })
}
