'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardNavProps {
  associationName: string
  isSuperadminOnly: boolean
}

const NAV_LINKS = [
  { href: '/dashboard/inventaires', label: 'Inventaires' },
  { href: '/dashboard/controles', label: 'Contrôles' },
  { href: '/dashboard/parametres', label: 'Paramètres' },
]

export function DashboardNav({ associationName, isSuperadminOnly }: DashboardNavProps) {
  const pathname = usePathname()

  if (isSuperadminOnly) {
    return (
      <div className="flex items-center gap-6">
        <Link
          href="/admin"
          className={`text-sm transition-colors ${pathname === '/admin' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-blue-600'}`}
        >
          Associations
        </Link>
        <Link
          href="/admin/feedbacks"
          className={`text-sm transition-colors ${pathname.startsWith('/admin/feedbacks') ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-blue-600'}`}
        >
          Feedbacks
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <span className="text-sm font-semibold text-slate-900">{associationName}</span>
      {NAV_LINKS.map(({ href, label }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`text-sm transition-colors ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-blue-600'}`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
