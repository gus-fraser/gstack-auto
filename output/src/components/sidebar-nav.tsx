'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/documents', label: 'Documents' },
  { href: '/chat', label: 'Chat' },
]

interface SidebarNavProps {
  fundName: string
  fundLogoUrl: string
}

export function SidebarNav({ fundName, fundLogoUrl }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex md:w-14 lg:w-60 flex-col border-r border-border bg-surface h-screen fixed top-0 left-0">
      {/* Fund branding */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <img
          src={fundLogoUrl}
          alt={`${fundName} logo`}
          className="h-8 w-auto max-w-[48px]"
        />
        <span className="hidden lg:block text-[17px] font-medium text-text-secondary truncate">
          {fundName}
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-md px-3 py-2.5 text-[17px] font-medium transition-colors duration-150 ${
                isActive
                  ? 'border-l-4 border-l-accent bg-accent-subtle text-accent'
                  : 'text-text-secondary hover:bg-surface-raised'
              }`}
            >
              <span className="hidden lg:block">{item.label}</span>
              <span className="block lg:hidden text-[13px]">{item.label[0]}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
