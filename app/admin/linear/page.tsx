'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Issue {
  id: string
  title: string
  description: string
  priority: number
  state: { name: string; type: string; color: string }
  assignee: { name: string; avatarUrl: string } | null
  createdAt: string
  url: string
}

const PRIORITY_LABEL: Record<number, string> = {
  0: 'Sin prioridad',
  1: 'Urgente',
  2: 'Alta',
  3: 'Media',
  4: 'Baja',
}

const PRIORITY_COLOR: Record<number, string> = {
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-yellow-400',
  4: 'text-gray-400',
  0: 'text-gray-600',
}

const STATE_ORDER = ['triage', 'backlog', 'unstarted', 'started', 'completed', 'cancelled']

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Link href={`/admin/linear/${issue.id}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2 hover:border-orange-500/50 hover:bg-gray-900/80 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-white leading-snug">{issue.title}</p>
          <span className={`text-xs flex-shrink-0 ${PRIORITY_COLOR[issue.priority]}`}>
            {PRIORITY_LABEL[issue.priority]}
          </span>
        </div>
        {issue.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{issue.description}</p>
        )}
        {issue.assignee && (
          <p className="text-xs text-gray-600">{issue.assignee.name}</p>
        )}
      </div>
    </Link>
  )
}

function RequestModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (t: string, d: string) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSubmit(title, description)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6">
        <h2 className="text-white font-semibold mb-4">Nuevo request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Título</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="¿Qué necesitan?"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Contexto adicional..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-white px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              {loading ? 'Enviando...' : 'Crear issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LinearKanban() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/admin/linear')
      .then(r => r.json())
      .then(data => {
        setIssues(data.data?.project?.issues?.nodes || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleCreateIssue(title: string, description: string) {
    const res = await fetch('/api/admin/linear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
    if (res.ok) {
      setToast('Issue creado ✓')
      setTimeout(() => setToast(''), 3000)
      // Refetch
      const updated = await fetch('/api/admin/linear').then(r => r.json())
      setIssues(updated.data?.project?.issues?.nodes || [])
    }
  }

  // Group by state type
  const columns: Record<string, Issue[]> = {}
  for (const issue of issues) {
    const type = issue.state?.type || 'backlog'
    if (!columns[type]) columns[type] = []
    columns[type].push(issue)
  }

  const columnConfig: Record<string, { label: string; color: string }> = {
    triage: { label: 'Triage', color: 'text-red-400' },
    backlog: { label: 'Backlog', color: 'text-gray-400' },
    unstarted: { label: 'Por hacer', color: 'text-blue-400' },
    started: { label: 'En progreso', color: 'text-yellow-400' },
    completed: { label: 'Completado', color: 'text-green-400' },
    cancelled: { label: 'Cancelado', color: 'text-gray-600' },
  }

  const activeColumns = STATE_ORDER.filter(
    type => type !== 'cancelled' && (columns[type]?.length > 0)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Cargando issues...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Kanban — Migraflix</h1>
          <p className="text-gray-500 text-sm mt-0.5">{issues.length} issues en el proyecto</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          + Nuevo request
        </button>
      </div>

      {activeColumns.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay issues activos.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${activeColumns.length}, minmax(240px, 1fr))` }}>
          {activeColumns.map(type => {
            const config = columnConfig[type]
            const colIssues = columns[type] || []
            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-gray-600 bg-gray-800 rounded-full px-2 py-0.5">
                    {colIssues.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colIssues.map(issue => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <RequestModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateIssue}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm rounded-lg px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
