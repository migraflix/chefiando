'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Workflow {
  id: string
  name: string
  active: boolean
  updatedAt: string
  nodes?: { type: string }[]
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/workflows')
      .then(r => r.json())
      .then(data => { setWorkflows(data.data || []); setLoading(false) })
      .catch(() => { setError('No se pudo conectar con n8n'); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <p className="text-gray-400 text-sm">Cargando workflows...</p>
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Workflows activos</h1>
        <p className="text-gray-500 text-sm mt-0.5">{workflows.length} workflows en n8n.migraflix.com</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!error && workflows.length === 0 && <p className="text-gray-500 text-sm">No hay workflows activos.</p>}

      <div className="space-y-2">
        {workflows.map(wf => (
          <Link
            key={wf.id}
            href={`/admin/workflows/${wf.id}`}
            className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-orange-500/50 hover:bg-gray-800 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0 bg-green-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-orange-400 transition-colors">
                  {wf.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {wf.nodes?.length ?? '?'} nodos · {new Date(wf.updatedAt).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>
            <span className="text-gray-600 group-hover:text-orange-400 transition-colors ml-3 flex-shrink-0">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
