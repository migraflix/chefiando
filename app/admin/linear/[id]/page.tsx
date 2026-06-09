'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Comment {
  id: string
  body: string
  createdAt: string
  user: { name: string; avatarUrl: string }
}

interface Issue {
  id: string
  title: string
  description: string
  priority: number
  state: { name: string; type: string; color: string }
  assignee: { name: string; avatarUrl: string } | null
  creator: { name: string; avatarUrl: string } | null
  createdAt: string
  updatedAt: string
  url: string
  comments: { nodes: Comment[] }
  labels: { nodes: { id: string; name: string; color: string }[] }
}

const PRIORITY_LABEL: Record<number, string> = {
  0: 'Sin prioridad', 1: 'Urgente', 2: 'Alta', 3: 'Media', 4: 'Baja',
}
const PRIORITY_COLOR: Record<number, string> = {
  1: 'text-red-400', 2: 'text-orange-400', 3: 'text-yellow-400', 4: 'text-gray-400', 0: 'text-gray-600',
}

function Avatar({ name, url }: { name: string; url?: string }) {
  if (url) return <img src={url} alt={name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
  return (
    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
      <span className="text-xs text-gray-300">{name[0]?.toUpperCase()}</span>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')

  async function loadIssue() {
    const res = await fetch(`/api/admin/linear/${id}`)
    const data = await res.json()
    if (data.data?.issue) setIssue(data.data.issue)
    setLoading(false)
  }

  useEffect(() => { loadIssue() }, [id])

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    setSending(true)
    const res = await fetch(`/api/admin/linear/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: comment }),
    })
    const data = await res.json()
    if (data.data?.commentCreate?.success) {
      setComment('')
      setToast('Comentario enviado ✓')
      setTimeout(() => setToast(''), 3000)
      await loadIssue()
    }
    setSending(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <p className="text-gray-400 text-sm">Cargando issue...</p>
    </div>
  )

  if (!issue) return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Link href="/admin/linear" className="text-sm text-gray-500 hover:text-orange-400">← Kanban</Link>
      <p className="text-red-400">No se pudo cargar el issue.</p>
    </div>
  )

  const comments = issue.comments?.nodes || []

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/admin/linear" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
          ← Kanban
        </Link>
        <div className="mt-3">
          <div className="flex items-start gap-2 mb-2">
            <span
              className="mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: issue.state.color }}
            />
            <h1 className="text-xl font-bold text-white leading-tight">{issue.title}</h1>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span
              className="px-2 py-0.5 rounded-full text-white text-xs"
              style={{ backgroundColor: issue.state.color + '33', color: issue.state.color }}
            >
              {issue.state.name}
            </span>
            <span className={PRIORITY_COLOR[issue.priority]}>{PRIORITY_LABEL[issue.priority]}</span>
            {issue.assignee && <span>→ {issue.assignee.name}</span>}
            <span>{formatDate(issue.createdAt)}</span>
          </div>
          {issue.labels.nodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {issue.labels.nodes.map(l => (
                <span
                  key={l.id}
                  className="text-xs rounded-full px-2 py-0.5"
                  style={{ backgroundColor: l.color + '33', color: l.color }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {issue.description && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripción</h2>
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{issue.description}</p>
        </div>
      )}

      {/* Comments */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">
          Comentarios {comments.length > 0 && <span className="text-gray-600 font-normal">({comments.length})</span>}
        </h2>

        {comments.length === 0 && (
          <p className="text-gray-600 text-sm mb-4">Sin comentarios aún.</p>
        )}

        <div className="space-y-3 mb-4">
          {comments.map(c => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Avatar name={c.user.name} url={c.user.avatarUrl} />
                <span className="text-sm font-medium text-white">{c.user.name}</span>
                <span className="text-xs text-gray-600 ml-auto">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        {/* New comment form */}
        <form onSubmit={handleComment} className="space-y-3">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Escribe un comentario..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || !comment.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              {sending ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm rounded-lg px-4 py-2 shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
