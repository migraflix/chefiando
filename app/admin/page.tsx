'use client'

import { useEffect, useState } from 'react'

interface Metrics {
  airtable: {
    totalBrands: number
    brandsByStatus: Record<string, number>
    totalContent: number
    contentByStatus: Record<string, number>
  }
  openai: { totalTokens: number; startDate: string; endDate: string } | null
  fal: Record<string, unknown> | null
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function StatusBreakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const colors: Record<string, string> = {
    Done: 'bg-green-500',
    Approved: 'bg-green-500',
    'Needs Review': 'bg-yellow-500',
    'Manual Review': 'bg-yellow-500',
    'In-Progress': 'bg-blue-500',
    'Creating Image': 'bg-blue-400',
    'Creating Video': 'bg-purple-500',
    Queued: 'bg-gray-500',
    Closed: 'bg-gray-600',
    New: 'bg-orange-400',
    'Basic Register': 'bg-orange-300',
    'Creating Brand Voice and Scrapping': 'bg-blue-300',
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-sm mb-3">{title}</p>
      <div className="space-y-2">
        {Object.entries(data)
          .sort(([, a], [, b]) => b - a)
          .map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] || 'bg-gray-400'}`} />
              <span className="text-sm text-gray-300 flex-1 truncate">{status}</span>
              <span className="text-sm font-medium text-white">{count}</span>
              <span className="text-xs text-gray-500 w-8 text-right">
                {Math.round((count / total) * 100)}%
              </span>
            </div>
          ))}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Cargando métricas...</div>
      </div>
    )
  }

  if (!metrics) {
    return <div className="text-red-400">Error al cargar métricas</div>
  }

  const approvedContent = metrics.airtable.contentByStatus['Approved'] || 0
  const publishedContent = metrics.airtable.contentByStatus['Closed'] || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Vista general del proyecto</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Marcas activas" value={metrics.airtable.totalBrands} />
        <StatCard label="Contenido total" value={metrics.airtable.totalContent} />
        <StatCard label="Aprobado" value={approvedContent} sub="listo para publicar" />
        <StatCard label="Publicado" value={publishedContent} sub="cerrados/publicados" />
      </div>

      {/* Gasto APIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">OpenAI — este mes</p>
          {metrics.openai ? (
            <>
              <p className="text-2xl font-bold text-white">
                {(metrics.openai.totalTokens / 1000).toFixed(1)}K tokens
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {metrics.openai.startDate} → {metrics.openai.endDate}
              </p>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No disponible</p>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">fal.ai — saldo</p>
          {metrics.fal ? (
            <div className="space-y-1">
              {Object.entries(metrics.fal).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="text-white font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No disponible</p>
          )}
        </div>
      </div>

      {/* Breakdown por estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatusBreakdown title="Marcas por estado" data={metrics.airtable.brandsByStatus} />
        <StatusBreakdown title="Contenido por estado" data={metrics.airtable.contentByStatus} />
      </div>
    </div>
  )
}
