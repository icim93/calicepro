// app/api/presenze/qr/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET: genera token QR per una lezione
export async function GET(req: NextRequest) {
  const lezioneId = req.nextUrl.searchParams.get('lezione_id')
  if (!lezioneId) return NextResponse.json({ error: 'lezione_id obbligatorio' }, { status: 400 })

  // Il token QR è semplicemente l'URL con lezione_id firmato (per ora non firmato, semplice)
  const token = Buffer.from(JSON.stringify({
    lezione_id: lezioneId,
    exp: Date.now() + 4 * 60 * 60 * 1000 // 4 ore
  })).toString('base64url')

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/presenze/qr/check?t=${token}`
  return NextResponse.json({ url, token })
}

// POST: studente fa check-in via QR
export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const { token, studente_id } = await req.json()

  if (!token || !studente_id) {
    return NextResponse.json({ error: 'token e studente_id obbligatori' }, { status: 400 })
  }

  let payload: { lezione_id: string; exp: number }
  try {
    payload = JSON.parse(Buffer.from(token, 'base64url').toString())
  } catch {
    return NextResponse.json({ error: 'Token non valido' }, { status: 400 })
  }

  if (Date.now() > payload.exp) {
    return NextResponse.json({ error: 'QR scaduto' }, { status: 410 })
  }

  // Verifica che lo studente sia iscritto al corso di questa lezione
  const { data: lezione } = await supabase
    .from('lezioni').select('corso_id').eq('id', payload.lezione_id).single()
  if (!lezione) return NextResponse.json({ error: 'Lezione non trovata' }, { status: 404 })

  const { data: iscrizione } = await supabase
    .from('iscrizioni')
    .select('id')
    .eq('corso_id', lezione.corso_id)
    .eq('studente_id', studente_id)
    .eq('stato', 'approvata')
    .single()

  if (!iscrizione) {
    return NextResponse.json({ error: 'Non risulti iscritto a questo corso' }, { status: 403 })
  }

  // Upsert presenza
  const { data, error } = await supabase
    .from('presenze')
    .upsert({
      lezione_id: payload.lezione_id,
      studente_id,
      stato: 'presente',
      check_in_at: new Date().toISOString(),
      metodo: 'qr',
    }, { onConflict: 'lezione_id,studente_id' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, message: 'Check-in registrato ✓' })
}
