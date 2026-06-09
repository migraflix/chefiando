'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface N8nNode {
  id: string
  name: string
  type: string
  position: [number, number]
  parameters?: Record<string, unknown>
}

interface Workflow {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
  nodes: N8nNode[]
  connections: Record<string, { main: Array<Array<{ node: string; type: string; index: number }>> }>
  tags?: { id: string; name: string }[]
}

const N8N_URL = 'https://n8n.migraflix.com'

function nodeStyle(type: string): { color: string; bg: string; icon: string; label: string } {
  const map: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    'webhook': { color: '#f97316', bg: '#431407', icon: '⚡', label: 'Webhook' },
    'httprequest': { color: '#3b82f6', bg: '#1e3a8a', icon: '🌐', label: 'HTTP' },
    'airtable': { color: '#10b981', bg: '#064e3b', icon: '📋', label: 'Airtable' },
    'code': { color: '#a855f7', bg: '#3b0764', icon: '{}', label: 'Code' },
    'set': { color: '#6b7280', bg: '#1f2937', icon: '✏️', label: 'Set' },
    'if': { color: '#eab308', bg: '#422006', icon: '?', label: 'If' },
    'openai': { color: '#10b981', bg: '#064e3b', icon: '🤖', label: 'OpenAI' },
    'executeworkflowtrigger': { color: '#f97316', bg: '#431407', icon: '▶', label: 'Trigger' },
    'scheduletrigger': { color: '#f97316', bg: '#431407', icon: '⏰', label: 'Schedule' },
    'googledrive': { color: '#3b82f6', bg: '#1e3a8a', icon: '📁', label: 'Drive' },
    'googlesheets': { color: '#10b981', bg: '#064e3b', icon: '📊', label: 'Sheets' },
    'slack': { color: '#a855f7', bg: '#3b0764', icon: '💬', label: 'Slack' },
    'sendemail': { color: '#3b82f6', bg: '#1e3a8a', icon: '📧', label: 'Email' },
    'whatsapp': { color: '#10b981', bg: '#064e3b', icon: '📱', label: 'WhatsApp' },
    'fal': { color: '#f97316', bg: '#431407', icon: '🎨', label: 'Fal.ai' },
    'telegram': { color: '#3b82f6', bg: '#1e3a8a', icon: '✈️', label: 'Telegram' },
  }
  const typeLower = type.toLowerCase()
  const key = Object.keys(map).find(k => typeLower.includes(k))
  return map[key || ''] || { color: '#6b7280', bg: '#1f2937', icon: '⬡', label: type.split('.').pop() || type }
}

function FlowChart({ nodes, connections }: { nodes: N8nNode[]; connections: Workflow['connections'] }) {
  if (!nodes.length) return <p className="text-gray-500 text-sm">Sin nodos</p>

  // Sort nodes by x position to build columns
  const sorted = [...nodes].sort((a, b) => a.position[0] - b.position[0])

  // Build adjacency: fromName -> [toName, ...]
  const nextMap: Record<string, string[]> = {}
  for (const [fromName, conns] of Object.entries(connections)) {
    const targets = (conns.main || []).flatMap(outputs => outputs.map(c => c.node))
    if (targets.length) nextMap[fromName] = targets
  }

  // Determine which nodes are roots (no incoming edges)
  const hasIncoming = new Set<string>()
  for (const targets of Object.values(nextMap)) {
    for (const t of targets) hasIncoming.add(t)
  }
  const roots = sorted.filter(n => !hasIncoming.has(n.name))
  if (!roots.length) roots.push(sorted[0])

  // BFS to build ordered steps
  const visited = new Set<string>()
  const steps: N8nNode[][] = []

  let queue = roots
  while (queue.length) {
    const layer: N8nNode[] = []
    const nextQueue: N8nNode[] = []
    for (const node of queue) {
      if (visited.has(node.name)) continue
      visited.add(node.name)
      layer.push(node)
      const nexts = (nextMap[node.name] || []).map(name => nodes.find(n => n.name === name)!).filter(Boolean)
      nextQueue.push(...nexts)
    }
    if (layer.length) steps.push(layer)
    queue = nextQueue
  }

  // Add any unvisited nodes at the end
  const unvisited = nodes.filter(n => !visited.has(n.name))
  if (unvisited.length) steps.push(unvisited)

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-start gap-0 min-w-fit py-2">
        {steps.map((layer, li) => (
          <div key={li} className="flex items-center">
            {/* Layer of nodes */}
            <div className="flex flex-col gap-2">
              {layer.map(node => {
                const s = nodeStyle(node.type)
                return (
                  <div
                    key={node.id}
                    className="rounded-lg border px-3 py-2 w-36 flex-shrink-0"
                    style={{ borderColor: s.color, backgroundColor: s.bg }}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{s.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</span>
                    </div>
                    <p className="text-xs text-gray-200 leading-tight truncate" title={node.name}>{node.name}</p>
                  </div>
                )
              })}
            </div>
            {/* Arrow between layers */}
            {li < steps.length - 1 && (
              <div className="flex items-center justify-center w-8 flex-shrink-0 self-center">
                <span className="text-gray-600 text-lg">→</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [wf, setWf] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/workflows/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setLoading(false); return }
        data.nodes = data.nodes || []
        data.connections = data.connections || {}
        setWf(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <p className="text-gray-400 text-sm">Cargando workflow...</p>
    </div>
  )

  if (!wf) return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-white">← Volver</button>
      <p className="text-red-400">No se pudo cargar el workflow.</p>
    </div>
  )

  const nodeTypes = [...new Set(wf.nodes.map(n => nodeStyle(n.type).label))]
  const triggerNode = wf.nodes.find(n =>
    n.type.toLowerCase().includes('trigger') || n.type.toLowerCase().includes('webhook')
  )
  const integrations = nodeTypes.filter(t => !['Code', 'Set', 'If'].includes(t))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/admin/workflows" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
          ← Workflows
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${wf.active ? 'bg-green-400' : 'bg-gray-600'}`} />
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">{wf.name}</h1>
              <p className="text-gray-500 text-xs mt-1">
                {wf.active ? 'Activo' : 'Inactivo'} · Actualizado {new Date(wf.updatedAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <a
            href={`${N8N_URL}/workflow/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            Abrir en n8n ↗
          </a>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Resumen</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Nodos</p>
            <p className="text-2xl font-bold text-white">{wf.nodes.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Disparo</p>
            <p className="text-sm font-medium text-orange-400">{triggerNode?.name || '—'}</p>
          </div>
        </div>
        {integrations.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Integraciones</p>
            <div className="flex flex-wrap gap-1.5">
              {integrations.map(i => (
                <span key={i} className="text-xs bg-gray-800 text-gray-300 rounded-full px-2.5 py-0.5">{i}</span>
              ))}
            </div>
          </div>
        )}
        {wf.tags && wf.tags.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {wf.tags.map(t => (
                <span key={t.id} className="text-xs bg-orange-900/30 text-orange-400 rounded-full px-2.5 py-0.5">{t.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Diagrama de flujo */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Flujo</h2>
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 overflow-x-auto">
          <FlowChart nodes={wf.nodes} connections={wf.connections} />
        </div>
      </div>

      {/* Tabla de nodos */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Nodos ({wf.nodes.length})</h2>
        <div className="space-y-1.5">
          {wf.nodes.map((node, i) => {
            const s = nodeStyle(node.type)
            return (
              <div key={node.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                <span className="text-gray-600 text-xs w-5 flex-shrink-0">{i + 1}</span>
                <span className="text-base flex-shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{node.name}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
