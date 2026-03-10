import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server'

type ImportRow = Record<string, string | number | undefined>

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

  if (!profilo || !['admin', 'direttore'].includes(profilo.ruolo)) {
    return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  const corsoId = formData.get('corso_id')?.toString() ?? ''

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File obbligatorio' }, { status: 400 })
  }

  if (corsoId && profilo.ruolo === 'direttore') {
    const { data: corso } = await authClient
      .from('corsi')
      .select('id')
      .eq('id', corsoId)
      .eq('direttore_id', user.id)
      .single()

    if (!corso) {
      return NextResponse.json({ error: 'Corso non autorizzato' }, { status: 403 })
    }
  }

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet) as ImportRow[]

  const risultati = {
    importati: 0,
    errori: 0,
    dettagli: [] as { riga: number; email: string; stato: 'ok' | 'errore' | 'esistente'; messaggio: string }[],
  }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const email = (row.Email || row.email || '').toString().trim().toLowerCase()
    const nome = (row.Nome || row.nome || '').toString().trim()
    const cognome = (row.Cognome || row.cognome || '').toString().trim()
    const tessera = (row['Tessera AIS'] || row.tessera_ais || '').toString().trim()
    const delegazione = (row.Delegazione || row.delegazione || 'Bari').toString().trim()

    if (!email || !nome || !cognome) {
      risultati.errori += 1
      risultati.dettagli.push({
        riga: i + 2,
        email,
        stato: 'errore',
        messaggio: 'Campi obbligatori mancanti',
      })
      continue
    }

    const { data: utenteEsistente } = await serviceClient
      .from('utenti')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    let studenteId = utenteEsistente?.id ?? null
    let stato: 'ok' | 'errore' | 'esistente' = utenteEsistente ? 'esistente' : 'ok'
    let messaggio = utenteEsistente ? 'Utente gia presente' : 'Importato con successo'

    if (!studenteId) {
      const { data: invitedUser, error: authError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
        data: {
          nome,
          cognome,
          ruolo: 'studente',
          tessera_ais: tessera || null,
          delegazione,
        },
      })

      if (authError || !invitedUser.user) {
        risultati.errori += 1
        risultati.dettagli.push({
          riga: i + 2,
          email,
          stato: 'errore',
          messaggio: authError?.message ?? 'Invito utente non riuscito',
        })
        continue
      }

      studenteId = invitedUser.user.id
    }

    if (corsoId) {
      const { error: iscrizioneError } = await serviceClient
        .from('iscrizioni')
        .upsert(
          {
            corso_id: corsoId,
            studente_id: studenteId,
            stato: 'approvata',
            approvata_at: new Date().toISOString(),
          },
          { onConflict: 'corso_id,studente_id' }
        )

      if (iscrizioneError) {
        risultati.errori += 1
        risultati.dettagli.push({
          riga: i + 2,
          email,
          stato: 'errore',
          messaggio: iscrizioneError.message,
        })
        continue
      }

      messaggio = stato === 'esistente' ? 'Utente gia presente, iscrizione aggiornata' : 'Importato e iscritto'
    }

    risultati.importati += 1
    risultati.dettagli.push({
      riga: i + 2,
      email,
      stato,
      messaggio,
    })
  }

  return NextResponse.json({ data: risultati })
}
