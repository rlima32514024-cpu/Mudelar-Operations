'use client'

import Link from 'next/link'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { LogOut, UserCircle, Users, ChevronDown } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { useProfile } from '@/components/providers/profile-provider'
import { NotificationBell } from '@/components/layout/notification-bell'
import { ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function Header() {
  const profile = useProfile()
  if (!profile) return null

  const isAdmin = profile.role === 'mario' || profile.role === 'admin'

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold leading-none">M</span>
        </div>
        <span className="text-sm font-semibold text-gray-900 tracking-tight">
          Mudelar Operations
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <NotificationBell />

      {/* User menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors outline-none">
            <div className="w-7 h-7 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {getInitials(profile.full_name)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {profile.full_name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {ROLE_LABELS[profile.role as UserRole]}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="w-52 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50 animate-in fade-in-0 zoom-in-95"
          >
            {/* User info (mobile) */}
            <div className="px-2 py-1.5 sm:hidden border-b border-gray-100 mb-1">
              <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
              <p className="text-xs text-gray-500">
                {ROLE_LABELS[profile.role as UserRole]}
              </p>
            </div>

            <DropdownMenu.Item asChild>
              <Link
                href="/perfil"
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer outline-none"
              >
                <UserCircle className="w-4 h-4 text-gray-400" />
                O meu perfil
              </Link>
            </DropdownMenu.Item>

            {isAdmin && (
              <DropdownMenu.Item asChild>
                <Link
                  href="/admin/utilizadores"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer outline-none"
                >
                  <Users className="w-4 h-4 text-gray-400" />
                  Utilizadores
                </Link>
              </DropdownMenu.Item>
            )}

            <DropdownMenu.Separator className="my-1 -mx-1 h-px bg-gray-100" />

            <DropdownMenu.Item asChild>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 rounded-md hover:bg-red-50 cursor-pointer outline-none w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </form>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      </div>
    </header>
  )
}
