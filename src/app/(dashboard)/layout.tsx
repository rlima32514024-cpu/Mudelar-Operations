import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/queries'
import { ProfileProvider } from '@/components/providers/profile-provider'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  return (
    <ProfileProvider profile={profile}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>{children}</main>
      </div>
    </ProfileProvider>
  )
}
