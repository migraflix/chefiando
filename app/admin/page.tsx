'use client'

import { useEffect, useState } from 'react'

interface MonthMetric {
  tokens: number
  startDate: string
  endDate: string
}

interface Metrics {
  airtable: {
    totalBrands: number
    brandsByStatus: Record<string, number>
    totalContent: number
    contentByStatus: Record<string, number>
  }
  openai: {
    previous: MonthMetric | null
    current: MonthMetric | null
  } | null
  fal: null
}

const STATUS_COLORS: Record<string, string> = {
  Done: 'bg-green-500',
  Approved: 'bg-green-500',
  'Needs Review': 'bg-yellow-400',
  'Manual Review': 'bg-yellow-400',
  Revisado: 'bg-yellow-400',
  'In-Progress': 'bg-blue-500',
  'Creating Image': 'bg-blue-400',
  'Creating Video': 'bg-purple-500',
  Queued: 'bg-gray-500',
  Closed: 'bg-gray-600',
  New: 'bg-orange-400',
  'Basic Register': 'bg-orange-300',
  'Creating Brand Voice and Scrapping': 'bg-blue-300',
  'Sin estado': 'bg-gray-700',
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function StatusTable({ title, data }: { title: string; data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">Total: {total}</p>
      </div>
      <div className="divide-y divide-gray-800">
        {sorted.map(([status, count]) => (
          <div key={status} className="flex items-center gap-3 px-4 py-2.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[status] || 'bg-gray-500'}`} />
            <span className="text-sm text-gray-300 flex-1 truncate">{status}</span>
            <span className="text-sm font-semibold text-white tabular-nums">{count}</span>
            <span className="text-xs text-gray-500 tabular-nums w-9 text-right">
              {Math.round((count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TokensToUSD(tokens: number): string {
  // Approx GPT-4o pricing: $5/1M input tokens
  const usd = (tokens / 1_000_000) * 5
  return usd < 0.01 ? '< $0.01' : `~$${usd.toFixed(2)}`
}

function OpenAITable({ openai }: { openai: Metrics['openai'] }) {
  const months = [
    { label: 'Mes anterior', data: openai?.previous },
    { label: 'Mes actual', data: openai?.current },
  ]

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <span className="text-sm font-semibold text-white">OpenAI</span>
        <span className="text-xs text-gray-500">gasto estimado</span>
      </div>
      {!openai || (!openai.previous && !openai.current) ? (
        <div className="px-4 py-4">
          <p className="text-gray-500 text-sm">No disponible — verificá la API key en OpenAI Platform.</p>
          <a
            href="https://platform.openai.com/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-400 hover:text-orange-300 mt-1 block"
          >
            Ver en platform.openai.com →
          </a>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {months.map(({ label, data }) => (
            <div key={label} className="px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                {data && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    {data.startDate} → {data.endDate}
                  </p>
                )}
              </div>
              {data ? (
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{TokensToUSD(data.tokens)}</p>
                  <p className="text-xs text-gray-500 tabular-nums">{(data.tokens / 1000).toFixed(1)}K tokens</p>
                </div>
              ) : (
                <p className="text-xs text-gray-600">—</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FalCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <span className="text-sm font-semibold text-white">fal.ai</span>
        <span className="text-xs text-gray-500">saldo y gasto</span>
      </div>
      <div className="px-4 py-4 space-y-2">
        <p className="text-gray-500 text-sm">fal.ai no expone una API pública de billing.</p>
        <a
          href="https://fal.ai/dashboard/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          Ver saldo en fal.ai →
        </a>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then(r => r.json())
      .then(data => { setMetrics(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <p className="text-gray-400 text-sm">Cargando métricas...</p>
    </div>
  )

  if (!metrics) return <p className="text-red-400 text-sm">Error al cargar métricas.</p>

  const approvedContent = metrics.airtable.contentByStatus['Approved'] || 0
  const closedContent = metrics.airtable.contentByStatus['Closed'] || 0

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-xs mt-0.5">Vista general del proyecto</p>
      </div>

      {/* Stats 2x2 en mobile */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Marcas" value={metrics.airtable.totalBrands} />
        <StatCard label="Contenidos" value={metrics.airtable.totalContent} />
        <StatCard label="Aprobado" value={approvedContent} sub="listo para publicar" />
        <StatCard label="Publicado" value={closedContent} sub="cerrados" />
      </div>

      {/* Gasto APIs */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Gasto APIs</h2>
        <OpenAITable openai={metrics.openai} />
        <FalCard />
      </div>

      {/* Tablas de estado */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Por estado</h2>
        <StatusTable title="Marcas" data={metrics.airtable.brandsByStatus} />
        <StatusTable title="Contenido" data={metrics.airtable.contentByStatus} />
      </div>
    </div>
  )
}
