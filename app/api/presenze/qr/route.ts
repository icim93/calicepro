import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'

type TokenPayload = {
  lezione_id: string
  exp: number
}

export async function GET(req: NextRequest) {
  const authClient = createServerSupabaseClient()

  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Autenticazione richiesta' }, { status: 401 })
  }

  const { data: profilo } = await authClient
    .from('utenti')
    .select('ruolo')
    .eq('id', user.id)
    .single()

  if (!profilo || !['admin', 'direttore', 'docente'].includes(profilo.ruolo)) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
  }

  const lezioneId = req.nextUrl.searchParams.get('lezione_id')
  if (!lezioneId) {
    return NextResponse.json({ error: 'lezione_id obbligatorio' }, { status: 400 })
  }

  const token = Buffer.from(
    JSON.stringify({
      lezione_id: lezioneId,
      exp: Date.now() + 4 * 60 * 60 * 1000,
    } satisfies TokenPayload)
  ).toString('base64url')

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/presenze/qr/check?t=${token}`
  return NextResponse.json({ url, token })
}

export async function POST(req: NextRequest) {
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

  if (!profilo || profilo.ruolo !== 'studente') {
    return NextResponse.json({ error: 'Solo gli studenti possono fare check-in' }, { status: 403 })
  }

  const { token } = await req.json()
  if (!token) {
    return NextResponse.json({ error: 'token obbligatorio' }, { status: 400 })
  }

  let payload: TokenPayload
  try {
    payload = JSON.parse(Buffer.from(token, 'base64url').toString())
  } catch {
    return NextResponse.json({ error: 'Token non valido' }, { status: 400 })
  }

  if (Date.now() > payload.exp) {
    return NextResponse.json({ error: 'QR scaduto' }, { status: 410 })
  }

  const { data: lezione } = await serviceClient
    .from('lezioni')
    .select('corso_id')
    .eq('id', payload.lezione_id)
    .single()

  if (!lezione) {
    return NextResponse.json({ error: 'Lezione non trovata' }, { status: 404 })
  }

  const { data: iscrizione } = await serviceClient
    .from('iscrizioni')
    .select('id')
    .eq('corso_id', lezione.corso_id)
    .eq('studente_id', user.id)
    .eq('stato', 'approvata')
    .maybeSingle()

  if (!iscrizione) {
    return NextResponse.json({ error: 'Non risulti iscritto a questo corso' }, { status: 403 })
  }

  const { data, error } = await serviceClient
    .from('presenze')
    .upsert(
      {
        lezione_id: payload.lezione_id,
        studente_id: user.id,
        stato: 'presente',
        check_in_at: new Date().toISOString(),
        metodo: 'qr',
      },
      { onConflict: 'lezione_id,studente_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, message: 'Check-in registrato' })
}
