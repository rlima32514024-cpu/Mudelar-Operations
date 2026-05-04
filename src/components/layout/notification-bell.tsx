'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/components/providers/profile-provider'

interface AppNotification {
  id: string
  recipient_role: string
  message: string
  action_type: string
  link_url: string | null
  created_at: string
  read_by: string[]
}

const LAST_READ_KEY = 'notifications_last_read'

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function NotificationBell() {
  const profile = useProfile()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const [lastRead, setLastRead] = useState<Date | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Load last-read timestamp from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LAST_READ_KEY)
    setLastRead(stored ? new Date(stored) : null)
  }, [])

  // Fetch initial notifications + subscribe to realtime
  useEffect(() => {
    if (!profile) return
    const supabase = createClient()

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, recipient_role, message, action_type, link_url, created_at, read_by')
        .or(`recipient_role.eq.${profile.role},recipient_role.eq.all`)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications((data as AppNotification[]) ?? [])
    }

    fetchNotifications()

    const channel = supabase
      .channel('notification-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n = payload.new as AppNotification
        if (n.recipient_role === profile.role || n.recipient_role === 'all') {
          setNotifications((prev) => [n, ...prev.slice(0, 19)])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = notifications.filter((n) =>
    lastRead ? new Date(n.created_at) > lastRead : true
  ).length

  function handleOpen() {
    setOpen((v) => !v)
    if (!open) {
      const now = new Date().toISOString()
      localStorage.setItem(LAST_READ_KEY, now)
      setLastRead(new Date(now))
    }
  }

  if (!profile) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors outline-none"
        aria-label="Notificações"
      >
        <Bell className="w-4 h-4 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Notificações</span>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-400">{notifications.length} recentes</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Sem notificações
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.map((n) => {
                const isUnread = lastRead ? new Date(n.created_at) > lastRead : true
                const item = (
                  <div className="flex gap-2.5 items-start">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isUnread ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                )
                return (
                  <li key={n.id}>
                    {n.link_url ? (
                      <Link
                        href={n.link_url}
                        onClick={() => setOpen(false)}
                        className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50/40' : ''}`}
                      >
                        {item}
                      </Link>
                    ) : (
                      <div className={`px-4 py-3 ${isUnread ? 'bg-blue-50/40' : ''}`}>
                        {item}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
