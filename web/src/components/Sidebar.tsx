'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

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
  const [open, setOpen] = useState(false)

  const nav = (
    <>
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
              onClick={() => setOpen(false)}
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
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden bg-zinc-900 text-white p-2.5 rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop sidebar + mobile drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-zinc-900 text-zinc-100 flex flex-col shrink-0 transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {nav}
      </aside>
    </>
  )
}
