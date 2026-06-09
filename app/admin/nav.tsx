'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminNav({ email }: { email?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/airtable', label: 'Base de datos' },
    { href: '/admin/linear', label: 'Kanban' },
    { href: '/admin/workflows', label: 'Workflows' },
  ]

  return (
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-bold text-orange-400">Migraflix Admin</span>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                (link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href))
                  ? 'text-white font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">{email}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
