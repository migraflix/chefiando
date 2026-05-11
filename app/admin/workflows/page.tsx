'use client'

import { useEffect, useState } from 'react'

interface Workflow {
  id: string
  name: string
  active: boolean
  createdAt: string
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
      .then(data => {
        setWorkflows(data.data || [])
        setLoading(false)
      })
      .catch(() => {
        setError('No se pudo conectar con n8n')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Cargando workflows...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Workflows activos</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {workflows.length} workflows en n8n.migraflix.com
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {workflows.length === 0 && !error && (
        <p className="text-gray-500 text-sm">No hay workflows activos.</p>
      )}

      <div className="grid gap-3">
        {workflows.map(wf => (
          <div
            key={wf.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${wf.active ? 'bg-green-400' : 'bg-gray-600'}`} />
              <div>
                <p className="text-sm font-medium text-white">{wf.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Actualizado: {new Date(wf.updatedAt).toLocaleDateString('es', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                wf.active
                  ? 'bg-green-900/40 text-green-400'
                  : 'bg-gray-800 text-gray-500'
              }`}>
                {wf.active ? 'Activo' : 'Inactivo'}
              </span>
              <a
                href={`${process.env.NEXT_PUBLIC_N8N_URL || 'https://n8n.migraflix.com'}/workflow/${wf.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
              >
                Abrir →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
