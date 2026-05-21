'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Executive Summary' },
  { href: '/site-performance', label: 'Site Performance' },
  { href: '/workforce', label: 'Workforce' },
  { href: '/forecasting', label: 'Forecasting' },
  { href: '/archetypes', label: 'Site Archetypes' },
  { href: '/scenarios', label: 'Scenarios' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-zinc-900 text-zinc-100 flex flex-col shrink-0">
      <div className="px-6 py-6 border-b border-zinc-700">
        <h1 className="text-lg font-bold tracking-tight">COG Analytics</h1>
        <p className="text-xs text-zinc-400 mt-1">Workforce Intelligence</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-6 py-4 border-t border-zinc-700 text-xs text-zinc-500">
        Caldwell Operations Group
      </div>
    </aside>
  )
}
