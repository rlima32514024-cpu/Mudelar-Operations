import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Auth admin client — service role, bypasses RLS, server-side only
export function createAuthAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
