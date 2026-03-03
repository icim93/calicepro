// app/api/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const formData = await req.formData()
  const file = formData.get('file') as File
  const corsoId = formData.get('corso_id') as string

  if (!file || !corsoId) {
    return NextResponse.json({ error: 'File e corso_id sono obbligatori' }, { status: 400 })
  }

  // Parse Excel / CSV
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[]

  const risultati = {
    importati: 0,
    errori: 0,
    dettagli: [] as { riga: number; email: string; stato: string; messaggio?: string }[],
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const email   = (row['Email'] || row['email'] || '').toString().trim().toLowerCase()
    const nome    = (row['Nome'] || row['nome'] || '').toString().trim()
    const cognome = (row['Cognome'] || row['cognome'] || '').toString().trim()
    const tessera = (row['Tessera AIS'] || row['tessera_ais'] || '').toString().trim()

    if (!email || !nome || !cognome) {
      risultati.errori++
      risultati.dettagli.push({ riga: i + 2, email, stato: 'errore', messaggio: 'Campi obbligatori mancanti' })
      continue
    }

    // Cerca utente esistente
    const { data: utenteEsistente } = await supabase
      .from('utenti').select('id').eq('email', email).single()

    let studenteId = utenteEsistente?.id

    // Se non esiste, crea l'utente via Auth (invio email di invito)
    if (!studenteId) {
      const { data: authUser, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { nome, cognome, ruolo: 'studente', tessera_ais: tessera || null },
      })
      if (authError) {
        risultati.errori++
        risultati.dettagli.push({ riga: i + 2, email, stato: 'errore', messaggio: authError.message })
        continue
      }
      studenteId = authUser.user.id
    }

    // Crea iscrizione (approvata direttamente dall'import)
    const { error: iscrizioneError } = await supabase
      .from('iscrizioni')
      .upsert({
        corso_id: corsoId,
        studente_id: studenteId,
        stato: 'approvata',
        approvata_at: new Date().toISOString(),
      }, { onConflict: 'corso_id,studente_id' })

    if (iscrizioneError) {
      risultati.errori++
      risultati.dettagli.push({ riga: i + 2, email, stato: 'errore', messaggio: iscrizioneError.message })
    } else {
      risultati.importati++
      risultati.dettagli.push({ riga: i + 2, email, stato: 'ok' })
    }
  }

  return NextResponse.json({ data: risultati })
}
