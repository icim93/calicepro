// app/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profilo } = await supabase
    .from('utenti')
    .select('ruolo')
    .eq('id', user.id)
    .maybeSingle()

  if (!profilo) redirect('/auth/login')

  redirect(`/dashboard/${profilo.ruolo}`)
}
