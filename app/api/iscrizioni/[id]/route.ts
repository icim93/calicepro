import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createServerSupabaseClient()
  const serviceClient = createServiceClient()

  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Autenticazione richiesta' }, { status: 401 })
  }

  const { data: profilo } = await authClient
    .from('utenti')
    .select('id, ruolo')
    .eq('id', user.id)
    .single()

  if (!profilo || !['admin', 'direttore'].includes(profilo.ruolo)) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
  }

  const { stato } = await req.json()
  if (!['approvata', 'rifiutata', 'sospesa'].includes(stato)) {
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 })
  }

  const { data: iscrizione } = await authClient
    .from('iscrizioni')
    .select('id, corso_id')
    .eq('id', params.id)
    .single()

  if (!iscrizione) {
    return NextResponse.json({ error: 'Iscrizione non trovata' }, { status: 404 })
  }

  if (profilo.ruolo === 'direttore') {
    const { data: corso } = await authClient
      .from('corsi')
      .select('id')
      .eq('id', iscrizione.corso_id)
      .eq('direttore_id', user.id)
      .single()

    if (!corso) {
      return NextResponse.json({ error: 'Corso non autorizzato' }, { status: 403 })
    }
  }

  const { data, error } = await serviceClient
    .from('iscrizioni')
    .update({
      stato,
      approvata_at: stato === 'approvata' ? new Date().toISOString() : null,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (stato === 'approvata') {
    await serviceClient.rpc('genera_rate_pagamento', { p_iscrizione_id: params.id })
  }

  return NextResponse.json({ data })
}
