// app/api/iscrizioni/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient()
  const { stato } = await req.json()

  if (!['approvata', 'rifiutata', 'sospesa'].includes(stato)) {
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('iscrizioni')
    .update({
      stato,
      approvata_at: stato === 'approvata' ? new Date().toISOString() : null,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Se approvata, genera le rate di pagamento
  if (stato === 'approvata') {
    await supabase.rpc('genera_rate_pagamento', { p_iscrizione_id: params.id })
  }

  return NextResponse.json({ data })
}
