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

// Map n8n node types to readable labels and colors
function nodeStyle(type: string): { color: string; bg: string; icon: string; label: string } {
  const map: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    'n8n-nodes-base.webhook': { color: '#f97316', bg: '#431407', icon: '⚡', label: 'Webhook' },
    'n8n-nodes-base.httpRequest': { color: '#3b82f6', bg: '#1e3a8a', icon: '🌐', label: 'HTTP' },
    'n8n-nodes-base.airtable': { color: '#10b981', bg: '#064e3b', icon: '📋', label: 'Airtable' },
    'n8n-nodes-base.code': { color: '#a855f7', bg: '#3b0764', icon: '{}', label: 'Code' },
    'n8n-nodes-base.set': { color: '#6b7280', bg: '#1f2937', icon: '✏️', label: 'Set' },
    'n8n-nodes-base.if': { color: '#eab308', bg: '#422006', icon: '?', label: 'If' },
    'n8n-nodes-base.openAi': { color: '#10b981', bg: '#064e3b', icon: '🤖', label: 'OpenAI' },
    'n8n-nodes-base.executeWorkflowTrigger': { color: '#f97316', bg: '#431407', icon: '▶', label: 'Trigger' },
    'n8n-nodes-base.scheduleTrigger': { color: '#f97316', bg: '#431407', icon: '⏰', label: 'Schedule' },
    'n8n-nodes-base.googleDrive': { color: '#3b82f6', bg: '#1e3a8a', icon: '📁', label: 'Drive' },
    'n8n-nodes-base.googleSheets': { color: '#10b981', bg: '#064e3b', icon: '📊', label: 'Sheets' },
    'n8n-nodes-base.slack': { color: '#a855f7', bg: '#3b0764', icon: '💬', label: 'Slack' },
    'n8n-nodes-base.sendEmail': { color: '#3b82f6', bg: '#1e3a8a', icon: '📧', label: 'Email' },
    'n8n-nodes-base.whatsApp': { color: '#10b981', bg: '#064e3b', icon: '📱', label: 'WhatsApp' },
    '@n8n/n8n-nodes-langchain.openAi': { color: '#10b981', bg: '#064e3b', icon: '🤖', label: 'OpenAI' },
  }
  const key = Object.keys(map).find(k => type.toLowerCase().includes(k.split('.')[1]?.toLowerCase() || ''))
  return map[key || ''] || { color: '#6b7280', bg: '#1f2937', icon: '⬡', label: type.split('.').pop() || type }
}

function WorkflowDiagram({ nodes, connections }: { nodes: N8nNode[]; connections: Workflow['connections'] }) {
  if (!nodes.length) return <p className="text-gray-500 text-sm">Sin nodos</p>

  const NODE_W = 140
  const NODE_H = 56
  const PAD = 40

  const xs = nodes.map(n => n.position[0])
  const ys = nodes.map(n => n.position[1])
  const minX = Math.min(...xs) - PAD
  const minY = Math.min(...ys) - PAD
  const maxX = Math.max(...xs) + NODE_W + PAD
  const maxY = Math.max(...ys) + NODE_H + PAD
  const vw = maxX - minX
  const vh = maxY - minY

  // Build edges from connections
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = []
  const nodeMap = Object.fromEntries(nodes.map(n => [n.name, n]))

  for (const [fromName, conns] of Object.entries(connections)) {
    const from = nodeMap[fromName]
    if (!from) continue
    for (const outputs of conns.main || []) {
      for (const conn of outputs) {
        const to = nodeMap[conn.node]
        if (!to) continue
        edges.push({
          x1: from.position[0] - minX + NODE_W,
          y1: from.position[1] - minY + NODE_H / 2,
          x2: to.position[0] - minX,
          y2: to.position[1] - minY + NODE_H / 2,
        })
      }
    }
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl bg-gray-950 border border-gray-800 p-2">
      <svg
        viewBox={`0 0 ${vw} ${vh}`}
        width="100%"
        style={{ minWidth: Math.min(vw, 320), maxHeight: 420 }}
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#4b5563" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const mx = (e.x1 + e.x2) / 2
          return (
            <path
              key={i}
              d={`M${e.x1},${e.y1} C${mx},${e.y1} ${mx},${e.y2} ${e.x2},${e.y2}`}
              fill="none"
              stroke="#4b5563"
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
          )
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const s = nodeStyle(node.type)
          const x = node.position[0] - minX
          const y = node.position[1] - minY
          const label = node.name.length > 18 ? node.name.slice(0, 16) + '…' : node.name
          return (
            <g key={node.id}>
              <rect
                x={x} y={y}
                width={NODE_W} height={NODE_H}
                rx="8"
                fill={s.bg}
                stroke={s.color}
                strokeWidth="1.5"
              />
              <text x={x + 10} y={y + 22} fill={s.color} fontSize="14" fontWeight="bold">{s.icon}</text>
              <text x={x + 28} y={y + 22} fill={s.color} fontSize="9" fontWeight="600">{s.label}</text>
              <text x={x + 8} y={y + 40} fill="#e5e7eb" fontSize="9.5">{label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function NodeList({ nodes }: { nodes: N8nNode[] }) {
  const grouped: Record<string, N8nNode[]> = {}
  for (const n of nodes) {
    const s = nodeStyle(n.type)
    if (!grouped[s.label]) grouped[s.label] = []
    grouped[s.label].push(n)
  }

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([label, ns]) => (
        <div key={label} className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
          <span className="text-xs font-semibold text-gray-400 w-20 flex-shrink-0 mt-0.5">{label}</span>
          <div className="flex flex-wrap gap-1">
            {ns.map(n => (
              <span key={n.id} className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-0.5">{n.name}</span>
            ))}
          </div>
        </div>
      ))}
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
        // Ensure nodes and connections always exist
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

  // Summarize what this workflow does
  const nodeTypes = [...new Set(wf.nodes.map(n => nodeStyle(n.type).label))]
  const triggerNode = wf.nodes.find(n =>
    n.type.includes('Trigger') || n.type.includes('trigger') || n.type.includes('webhook')
  )
  const integrations = nodeTypes.filter(t => !['Trigger', 'Code', 'Set', 'If'].includes(t))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/admin/workflows" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
          ← Workflows
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${wf.active ? 'bg-green-400' : 'bg-gray-600'}`} />
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">{wf.name}</h1>
            <p className="text-gray-500 text-xs mt-1">
              {wf.active ? 'Activo' : 'Inactivo'} · Actualizado {new Date(wf.updatedAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
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

      {/* Diagrama */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Diagrama</h2>
        <WorkflowDiagram nodes={wf.nodes} connections={wf.connections} />
      </div>

      {/* Nodos por tipo */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Nodos ({wf.nodes.length})</h2>
        <NodeList nodes={wf.nodes} />
      </div>
    </div>
  )
}
