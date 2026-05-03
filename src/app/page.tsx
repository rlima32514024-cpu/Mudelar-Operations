import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const roleRoutes: Record<string, string> = {
  mario: '/mario',
  sofia: '/sofia',
  susana: '/susana',
  ana: '/ana',
  supervisor: '/supervisor',
  gustavo: '/gustavo',
  admin: '/mario',
}

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as { role?: string } | null)?.role ?? ''
  const route = roleRoutes[role] ?? '/login'
  redirect(route)
}
