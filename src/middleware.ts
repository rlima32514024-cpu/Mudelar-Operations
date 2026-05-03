import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { UserRole } from '@/types'

// Route → allowed roles mapping
const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/mario': ['mario', 'admin'],
  '/sofia': ['sofia', 'admin'],
  '/susana': ['susana', 'admin'],
  '/ana': ['ana', 'admin'],
  '/supervisor': ['supervisor', 'admin'],
  '/gustavo': ['gustavo', 'admin'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth required
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  const { supabaseResponse, user, supabase } = await updateSession(request)

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Fetch user profile for role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = ((profile as { role?: string } | null)?.role ?? 'supervisor') as UserRole

  // Check route-level permissions
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
      // Redirect to their default dashboard
      const defaultRoute = getDefaultRoute(userRole)
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = defaultRoute
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

function getDefaultRoute(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    mario: '/mario',
    sofia: '/sofia',
    susana: '/susana',
    ana: '/ana',
    supervisor: '/supervisor',
    gustavo: '/gustavo',
    admin: '/mario',
  }
  return routes[role] ?? '/login'
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
