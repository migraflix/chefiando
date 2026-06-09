'use client'

import { useState } from 'react'

interface Field {
  name: string
  type: string
  description: string
}

interface TableDoc {
  id: string
  name: string
  emoji: string
  description: string
  fields: Field[]
  relations?: string[]
}

const TABLES: TableDoc[] = [
  {
    id: 'content',
    name: 'Content',
    emoji: '📝',
    description: 'Registro de cada pieza de contenido generada para las marcas. Incluye el texto, imagen, video, estado de publicación y calificaciones.',
    relations: ['Brands', 'Fotos AI', 'Actions', 'Content Style'],
    fields: [
      { name: 'Content ID', type: 'Formula', description: 'ID único auto-generado (ej: C-001)' },
      { name: 'Title', type: 'Texto', description: 'Título del contenido' },
      { name: 'Description', type: 'Texto', description: 'Descripción breve del contenido' },
      { name: 'Post', type: 'Texto largo', description: 'Texto del post para publicar en redes' },
      { name: 'Status', type: 'Select', description: 'Estado del flujo: Queued → In-Progress → Creating Image → Needs Review → Approved → Closed' },
      { name: 'Categoria', type: 'Select', description: 'Tipo de contenido: Educational, Authority, Inquiry-Driving' },
      { name: 'Brand', type: 'Relación', description: 'Marca a la que pertenece este contenido' },
      { name: 'Publish Date', type: 'Fecha', description: 'Fecha programada de publicación' },
      { name: 'Published', type: 'Checkbox', description: 'Marca si el contenido fue publicado' },
      { name: 'Prompt Text', type: 'Texto largo', description: 'Prompt usado para generar el texto con IA' },
      { name: 'Prompt Image', type: 'Texto largo', description: 'Prompt usado para generar la imagen con IA' },
      { name: '📥 Image', type: 'Adjunto', description: 'Imagen final del contenido' },
      { name: '📥 Video', type: 'Adjunto', description: 'Video final del contenido' },
      { name: 'Calificación Post', type: 'Rating 1-5', description: 'Calidad del texto generado' },
      { name: 'Calificación Imagen', type: 'Rating 1-5', description: 'Calidad de la imagen generada' },
      { name: 'Comentarios Post', type: 'Texto largo', description: 'Notas de revisión del texto' },
      { name: 'Comentario Imagen', type: 'Texto largo', description: 'Notas de revisión de la imagen' },
      { name: 'GHL Social ID', type: 'Texto', description: 'ID del post en GoHighLevel para seguimiento' },
      { name: 'Sent', type: 'Checkbox', description: 'Indica si fue enviado a GHL' },
      { name: 'URL Review', type: 'Formula', description: 'Link de revisión pública del contenido' },
      { name: 'Created', type: 'Fecha auto', description: 'Fecha de creación del registro' },
      { name: 'Last Modified', type: 'Fecha auto', description: 'Última modificación' },
    ],
  },
  {
    id: 'brands',
    name: 'Brands',
    emoji: '🏢',
    description: 'Datos de cada marca/negocio cliente. Contiene toda la información del emprendedor, configuración de la marca y links a recursos.',
    relations: ['Content', 'Fotos AI', 'Brand Tasks', 'Upload Fotos', 'Image Prompt'],
    fields: [
      { name: 'Negocio', type: 'Texto', description: 'Nombre del negocio (campo primario)' },
      { name: 'Status', type: 'Select', description: 'Estado del onboarding: New → Basic Register → Creating Brand Voice → Done' },
      { name: 'Emprendedor', type: 'Texto', description: 'Nombre del dueño/a del negocio' },
      { name: 'Email', type: 'Email', description: 'Email de contacto principal' },
      { name: 'Call to Action (Whatsapp)', type: 'Texto', description: 'Número de WhatsApp para CTAs en contenido' },
      { name: 'País / Ciudad', type: 'Texto', description: 'Ubicación del negocio' },
      { name: 'Idioma', type: 'Texto', description: 'Idioma del contenido a generar' },
      { name: 'Instagram del negocio', type: 'Texto', description: 'Handle de Instagram' },
      { name: 'ICP', type: 'Texto', description: 'Ideal Customer Profile — perfil del cliente objetivo' },
      { name: 'Prompt', type: 'Texto largo', description: 'Prompt base de la voz de marca para generar contenido' },
      { name: 'Brand Voice', type: 'URL', description: 'Link al documento de Brand Voice' },
      { name: 'Logo', type: 'Adjunto', description: 'Logo de la marca' },
      { name: 'Menu', type: 'Adjunto', description: 'Menú o catálogo de productos' },
      { name: 'Foto Emprendedor', type: 'Adjunto', description: 'Foto del emprendedor para contenido' },
      { name: 'Historia Emprendedor', type: 'Texto largo', description: 'Historia personal del emprendedor para storytelling' },
      { name: 'productos y precios', type: 'Texto largo', description: 'Lista de productos y precios actuales' },
      { name: 'Create Weekly Content', type: 'Checkbox', description: 'Activa la generación automática de contenido semanal' },
      { name: 'SendPulse Contact ID', type: 'Texto', description: 'ID en SendPulse para envío de mensajes' },
      { name: 'GHL Location', type: 'Texto', description: 'ID de la ubicación en GoHighLevel' },
      { name: 'IG GHL ID', type: 'Texto', description: 'ID de la cuenta de Instagram en GHL' },
      { name: 'Brand Folder', type: 'URL', description: 'Carpeta en Drive con assets de la marca' },
      { name: 'Content Posts', type: 'URL', description: 'Carpeta con los posts generados' },
      { name: 'Upload Fotos Link', type: 'URL', description: 'Link para que el cliente suba sus fotos' },
      { name: 'Creada', type: 'Fecha auto', description: 'Fecha de alta de la marca' },
    ],
  },
  {
    id: 'fotos-ai',
    name: 'Fotos AI',
    emoji: '🖼️',
    description: 'Imágenes originales de los clientes y sus versiones optimizadas con IA. Sirven como base visual para generar contenido.',
    relations: ['Brands', 'Content'],
    fields: [
      { name: 'Nombre', type: 'Texto', description: 'Nombre descriptivo de la foto (campo primario)' },
      { name: 'Tipo', type: 'Select', description: 'Original (foto del cliente) o Aplicación (versión con IA)' },
      { name: 'Status', type: 'Select', description: 'Nueva → Optimizada' },
      { name: 'Imagen', type: 'Adjunto', description: 'Foto original del cliente' },
      { name: 'Imagen AI', type: 'Adjunto', description: 'Versión mejorada/generada con IA' },
      { name: 'Brand', type: 'Relación', description: 'Marca a la que pertenece la foto' },
      { name: 'Descripción', type: 'Texto largo', description: 'Descripción del contenido de la imagen' },
      { name: 'Prompt_Mejora', type: 'Texto largo', description: 'Prompt usado para optimizar la foto con IA' },
      { name: 'Tags', type: 'Multi-select', description: 'Etiquetas dietéticas: noSugar, noGluten, vegan, vegetarian' },
      { name: 'Precio (BRL)', type: 'Número', description: 'Precio del producto en la imagen (reales brasileños)' },
      { name: 'Ingredientes', type: 'Texto largo', description: 'Ingredientes del plato/producto fotografiado' },
      { name: 'Error', type: 'Checkbox', description: 'Marca si hubo error en el procesamiento con IA' },
      { name: 'Fecha de Creación', type: 'Fecha auto', description: 'Cuando se subió la foto' },
    ],
  },
  {
    id: 'actions',
    name: 'Actions',
    emoji: '⚡',
    description: 'Acciones automatizadas disponibles en el sistema. Cada acción tiene un webhook que dispara un workflow de n8n.',
    relations: ['Content'],
    fields: [
      { name: 'Action Name', type: 'Texto', description: 'Nombre descriptivo de la acción' },
      { name: 'Webhook URL', type: 'URL', description: 'URL del webhook de n8n que ejecuta esta acción' },
      { name: 'Active', type: 'Checkbox', description: 'Si la acción está habilitada' },
      { name: 'System', type: 'Checkbox', description: 'Acciones internas del sistema (no expuestas al usuario)' },
      { name: 'Notes', type: 'Texto largo', description: 'Descripción de qué hace esta acción' },
      { name: 'Content', type: 'Relación', description: 'Registros de contenido asociados a esta acción' },
    ],
  },
  {
    id: 'content-style',
    name: 'Content Style',
    emoji: '🎨',
    description: 'Estilos de contenido reutilizables. Define el tono y formato para diferentes tipos de publicaciones.',
    relations: ['Content'],
    fields: [
      { name: 'Name', type: 'Texto', description: 'Nombre del estilo (ej: "Receta", "Promoción", "Testimonio")' },
      { name: 'Notes', type: 'Texto largo', description: 'Descripción del estilo y cuándo usarlo' },
      { name: 'Content', type: 'Relación', description: 'Contenidos que usan este estilo' },
    ],
  },
  {
    id: 'brand-tasks',
    name: 'Brand Tasks',
    emoji: '✅',
    description: 'Tareas de procesamiento por marca. Registra el estado de operaciones automáticas como generación de Brand Voice.',
    relations: ['Brands'],
    fields: [
      { name: 'Brand Record Id', type: 'Texto', description: 'ID del registro de la marca en Airtable' },
      { name: 'Status', type: 'Select', description: 'On Hold → Working → Done → Error' },
      { name: 'Brands', type: 'Relación', description: 'Marca asociada a esta tarea' },
      { name: 'Fecha Creación', type: 'Fecha auto', description: 'Cuándo se creó la tarea' },
      { name: 'Última modificación', type: 'Fecha auto', description: 'Último cambio de estado' },
    ],
  },
  {
    id: 'upload-fotos',
    name: 'Upload Fotos',
    emoji: '📤',
    description: 'Cola de fotos subidas por los clientes para procesar. Controla el estado de cada lote de imágenes.',
    relations: ['Brands'],
    fields: [
      { name: 'Record ID', type: 'Formula', description: 'ID del registro' },
      { name: 'Status', type: 'Select', description: 'Todo → In progress → Done → Error' },
      { name: 'Attachments', type: 'Adjuntos', description: 'Las fotos subidas por el cliente' },
      { name: 'Brands', type: 'Relación', description: 'Marca que subió estas fotos' },
    ],
  },
  {
    id: 'variables',
    name: 'Variables',
    emoji: '⚙️',
    description: 'Configuración global del sistema. Parámetros que controlan el comportamiento de los workflows de n8n.',
    relations: [],
    fields: [
      { name: 'Name', type: 'Texto', description: 'Nombre de la variable' },
      { name: 'Value', type: 'Texto largo', description: 'Valor de la variable' },
      { name: 'Group', type: 'Texto', description: 'Agrupación para organizar variables relacionadas' },
    ],
  },
]

const FIELD_TYPE_COLORS: Record<string, string> = {
  'Formula': 'bg-purple-900/40 text-purple-300',
  'Select': 'bg-blue-900/40 text-blue-300',
  'Multi-select': 'bg-blue-900/40 text-blue-300',
  'Relación': 'bg-orange-900/40 text-orange-300',
  'Checkbox': 'bg-green-900/40 text-green-300',
  'Fecha': 'bg-yellow-900/40 text-yellow-300',
  'Fecha auto': 'bg-yellow-900/40 text-yellow-300',
  'URL': 'bg-cyan-900/40 text-cyan-300',
  'Adjunto': 'bg-pink-900/40 text-pink-300',
  'Adjuntos': 'bg-pink-900/40 text-pink-300',
  'Rating 1-5': 'bg-red-900/40 text-red-300',
  'Número': 'bg-indigo-900/40 text-indigo-300',
  'Email': 'bg-teal-900/40 text-teal-300',
}

function TypeBadge({ type }: { type: string }) {
  const color = FIELD_TYPE_COLORS[type] || 'bg-gray-800 text-gray-400'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${color}`}>{type}</span>
}

function TableCard({ table }: { table: TableDoc }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-gray-800/50 transition-colors"
      >
        <span className="text-2xl flex-shrink-0 mt-0.5">{table.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">{table.name}</h2>
            <span className="text-xs text-gray-600 bg-gray-800 rounded-full px-2 py-0.5">
              {table.fields.length} campos
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1 leading-snug">{table.description}</p>
          {table.relations && table.relations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {table.relations.map(r => (
                <span key={r} className="text-xs text-orange-400 bg-orange-900/20 rounded-full px-2 py-0.5">
                  ↔ {r}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-gray-600 flex-shrink-0 mt-1">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-800">
          <div className="divide-y divide-gray-800/60">
            {table.fields.map(field => (
              <div key={field.name} className="px-4 py-2.5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">{field.name}</span>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{field.description}</p>
                </div>
                <TypeBadge type={field.type} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AirtableDoc() {
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Base de datos</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {TABLES.length} tablas · Documentación de campos y relaciones
        </p>
      </div>

      {/* Diagrama de relaciones */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Mapa de relaciones</h2>
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="font-semibold text-white">Brands</span>
            <span className="text-gray-600">→</span>
            <span>Content, Fotos AI, Brand Tasks, Upload Fotos</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="font-semibold text-white">Content</span>
            <span className="text-gray-600">→</span>
            <span>Brands, Fotos AI, Actions, Content Style</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="font-semibold text-white">Fotos AI</span>
            <span className="text-gray-600">→</span>
            <span>Brands, Content</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="font-semibold text-white">Actions</span>
            <span className="text-gray-600">→</span>
            <span>Content (via webhook de n8n)</span>
          </div>
        </div>
      </div>

      {/* Tablas */}
      <div className="space-y-3">
        {TABLES.map(table => (
          <TableCard key={table.id} table={table} />
        ))}
      </div>
    </div>
  )
}
