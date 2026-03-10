'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatData, normalizeOne } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Studente = {
  id: string
  nome: string
  cognome: string
  email: string
}

type Presenza = {
  id: string
  studente_id: string
  stato: string
  check_in_at?: string
  metodo?: string
}

type Lezione = {
  id: string
  numero: number
  titolo: string
  data: string
  ora_inizio: string
  ora_fine: string
  sede?: string
  corso: { id: string; titolo: string; livello: string }
}

type Corso = {
  id: string
  titolo: string
  livello: string
  stato: string
}

type LezioneRow = Omit<Lezione, 'corso'> & {
  corso: Lezione['corso'] | Lezione['corso'][]
}

type IscrizioneStudenteRow = {
  studente: Studente | Studente[]
}

const STATI_PRESENZA = ['presente', 'assente', 'giustificato'] as const
type StatoPresenza = typeof STATI_PRESENZA[number]

const badgePresenza: Record<StatoPresenza, string> = {
  presente:    'bg-success/15 text-success border-success/25',
  assente:     'bg-danger/15 text-danger border-danger/25',
  giustificato:'bg-warning/15 text-warning border-warning/25',
}
const labelPresenza: Record<StatoPresenza, string> = {
  presente:    'Presente',
  assente:     'Assente',
  giustificato:'Giustificato',
}

export default function DirettorePresenze() {
  const router = useRouter()
  const supabase = createClient()

  const [corsi, setCorsi] = useState<Corso[]>([])
  const [lezioni, setLezioni] = useState<Lezione[]>([])
  const [studenti, setStudenti] = useState<Studente[]>([])
  const [presenze, setPresenze] = useState<Presenza[]>([])

  const [corsoId, setCorsoId] = useState<string>('')
  const [lezioneId, setLezioneId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) void loadCorsi(user.id)
    })
  }, [])

  async function loadCorsi(uid: string) {
    const { data } = await supabase
      .from('corsi')
      .select('id, titolo, livello, stato')
      .eq('direttore_id', uid)
      .in('stato', ['attivo', 'aperto'])
      .order('data_inizio', { ascending: false })
    const list = (data as Corso[]) ?? []
    setCorsi(list)
    if (list.length > 0) await selectCorso(list[0].id)
    setLoading(false)
  }

  async function selectCorso(cid: string) {
    setCorsoId(cid)
    setLezioneId('')
    setStudenti([])
    setPresenze([])

    const [{ data: lezData }, { data: studData }] = await Promise.all([
      supabase
        .from('lezioni')
        .select('*, corso:corsi(id,titolo,livello)')
        .eq('corso_id', cid)
        .order('numero', { ascending: false }),
      supabase
        .from('iscrizioni')
        .select('studente:utenti!iscrizioni_studente_id_fkey(id,nome,cognome,email)')
        .eq('corso_id', cid)
        .eq('stato', 'approvata'),
    ])
    setLezioni(
      ((lezData as LezioneRow[] | null) ?? []).map((item) => ({
        ...item,
        corso: normalizeOne(item.corso)!,
      }))
    )
    const sList = ((studData as IscrizioneStudenteRow[] | null) ?? [])
      .map((item) => normalizeOne(item.studente))
      .filter((item): item is Studente => Boolean(item))
    setStudenti(sList)

    // Seleziona ultima lezione di default
    if (lezData && lezData.length > 0) {
      await selectLezione((lezData as Lezione[])[0].id, sList)
    }
  }

  async function selectLezione(lid: string, studList?: Studente[]) {
    setLezioneId(lid)
    const sList = studList ?? studenti
    const { data } = await supabase
      .from('presenze')
      .select('*')
      .eq('lezione_id', lid)
    const presenzeEsistenti = (data as Presenza[]) ?? []

    // Crea presenze mancanti come 'assente'
    const mancanti = sList.filter(
      s => !presenzeEsistenti.find(p => p.studente_id === s.id)
    )
    if (mancanti.length > 0) {
      await supabase.from('presenze').insert(
        mancanti.map(s => ({
          lezione_id: lid,
          studente_id: s.id,
          stato: 'assente',
        }))
      )
      const { data: updated } = await supabase
        .from('presenze')
        .select('*')
        .eq('lezione_id', lid)
      setPresenze((updated as Presenza[]) ?? [])
    } else {
      setPresenze(presenzeEsistenti)
    }
  }

  async function togglePresenza(studenteId: string, statoAttuale: string) {
    setSaving(studenteId)
    const nuovoStato: StatoPresenza =
      statoAttuale === 'assente'     ? 'presente'
      : statoAttuale === 'presente'  ? 'giustificato'
      : 'assente'

    await supabase
      .from('presenze')
      .update({ stato: nuovoStato, metodo: 'manuale' })
      .eq('lezione_id', lezioneId)
      .eq('studente_id', studenteId)

    setPresenze(prev => prev.map(p =>
      p.studente_id === studenteId ? { ...p, stato: nuovoStato } : p
    ))
    setSaving(null)
  }

  async function segnaTotti(stato: StatoPresenza) {
    if (!lezioneId) return
    await supabase
      .from('presenze')
      .update({ stato, metodo: 'manuale' })
      .eq('lezione_id', lezioneId)
    setPresenze(prev => prev.map(p => ({ ...p, stato })))
  }

  const lezioneCorrente = lezioni.find(l => l.id === lezioneId)
  const presentiCount   = presenze.filter(p => p.stato === 'presente').length
  const asssentiCount   = presenze.filter(p => p.stato === 'assente').length
  const giustCount      = presenze.filter(p => p.stato === 'giustificato').length
  const pctPresenza     = studenti.length > 0
    ? Math.round((presentiCount / studenti.length) * 100) : 0

  return (
    <div className="min-h-screen pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                     flex items-center justify-center text-cream/60">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-serif text-2xl text-cream">Presenze</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-dir-acc/30 border-t-dir-acc
                          rounded-full animate-spin" />
        </div>
      ) : corsi.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p className="text-4xl mb-3 opacity-30">📋</p>
          <p className="font-serif text-lg text-cream/50">Nessun corso assegnato</p>
          <p className="text-xs text-cream/30 mt-1">
            I corsi attivi appariranno qui
          </p>
        </div>
      ) : (
        <>
          {/* SELETTORE CORSO */}
          {corsi.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3">
              {corsi.map(c => (
                <button key={c.id} onClick={() => selectCorso(c.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap
                              border transition-all
                    ${corsoId === c.id
                      ? 'border-dir-acc text-dir-acc bg-dir-acc/10'
                      : 'border-white/10 text-cream/40'}`}>
                  {c.titolo}
                </button>
              ))}
            </div>
          )}

          {/* SELETTORE LEZIONE */}
          {lezioni.length > 0 && (
            <>
              <p className="section-label" style={{ color: 'rgba(90,196,132,0.5)' }}>
                Lezione
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3">
                {lezioni.map(l => (
                  <button key={l.id} onClick={() => selectLezione(l.id)}
                    className={`flex-shrink-0 px-3 py-2 rounded-[12px] border
                                text-left transition-all
                      ${lezioneId === l.id
                        ? 'border-dir-acc bg-dir-acc/10'
                        : 'border-white/[0.07] bg-surf2'}`}>
                      <p className={`text-[11px] font-medium
                        ${lezioneId === l.id ? 'text-dir-acc' : 'text-cream/60'}`}>
                        Lez. #{l.numero}
                      </p>
                      <p className="text-[10px] text-cream/30">{formatData(l.data)}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* INFO LEZIONE CORRENTE */}
          {lezioneCorrente && (
            <div className="mx-4 mb-4 bg-dir/20 border border-dir-acc/20
                            rounded-[16px] p-4">
              <p className="text-[13px] font-medium text-cream mb-0.5">
                {lezioneCorrente.titolo}
              </p>
              <p className="text-[11px] text-cream/40">
                {formatData(lezioneCorrente.data)} ·{' '}
                {lezioneCorrente.ora_inizio?.slice(0,5)} –{' '}
                {lezioneCorrente.ora_fine?.slice(0,5)}
                {lezioneCorrente.sede && ` · ${lezioneCorrente.sede}`}
              </p>
            </div>
          )}

          {/* KPI PRESENZE */}
          {lezioneId && (
            <div className="grid grid-cols-4 gap-2 px-4 mb-4">
              {[
                { n: presentiCount, l: 'Presenti',     c: 'text-success' },
                { n: asssentiCount, l: 'Assenti',      c: 'text-danger'  },
                { n: giustCount,    l: 'Giustificati', c: 'text-warning' },
                { n: `${pctPresenza}%`, l: 'Tasso',   c: pctPresenza >= 70 ? 'text-success' : 'text-warning' },
              ].map(k => (
                <div key={k.l}
                  className="bg-surf2 border border-white/[0.055] rounded-[12px] p-2 text-center">
                  <p className={`font-serif text-lg ${k.c}`}>{k.n}</p>
                  <p className="text-[8px] text-cream/40 uppercase tracking-[0.3px] mt-0.5">{k.l}</p>
                </div>
              ))}
            </div>
          )}

          {/* AZIONI RAPIDE */}
          {lezioneId && studenti.length > 0 && (
            <div className="flex gap-2 px-4 mb-4">
              <button onClick={() => segnaTotti('presente')}
                className="flex-1 h-9 bg-success/10 border border-success/20
                           rounded-[10px] text-[11px] text-success
                           transition-all active:scale-[0.97]">
                ✓ Tutti presenti
              </button>
              <button onClick={() => segnaTotti('assente')}
                className="flex-1 h-9 bg-danger/10 border border-danger/20
                           rounded-[10px] text-[11px] text-danger
                           transition-all active:scale-[0.97]">
                ✕ Tutti assenti
              </button>
            </div>
          )}

          {/* LISTA STUDENTI */}
          {lezioneId && (
            <>
              <p className="section-label" style={{ color: 'rgba(90,196,132,0.5)' }}>
                Studenti ({studenti.length})
              </p>
              <div className="mx-4 bg-surf2 border border-white/[0.055]
                              rounded-[18px] overflow-hidden mb-6">
                {studenti.length === 0 ? (
                  <p className="text-center py-8 text-sm text-cream/40">
                    Nessuno studente iscritto
                  </p>
                ) : studenti.map((s, i) => {
                  const presenza = presenze.find(p => p.studente_id === s.id)
                  const stato = (presenza?.stato ?? 'assente') as StatoPresenza
                  return (
                    <div key={s.id}
                      className={`flex items-center gap-3 px-4 py-3
                        ${i < studenti.length - 1 ? 'border-b border-white/[0.055]' : ''}`}>
                      {/* Avatar iniziali */}
                      <div className="w-9 h-9 rounded-xl bg-dir/25 border border-dir-acc/15
                                      flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-medium text-dir-acc">
                          {s.nome[0]}{s.cognome[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-cream truncate">
                          {s.nome} {s.cognome}
                        </p>
                        <p className="text-[10px] text-cream/30 truncate">{s.email}</p>
                      </div>
                      {/* Toggle presenza */}
                      <button
                        onClick={() => togglePresenza(s.id, stato)}
                        disabled={saving === s.id}
                        className={`h-8 px-3 rounded-[8px] border text-[11px] font-medium
                                    flex items-center gap-1 flex-shrink-0 transition-all
                                    active:scale-[0.95] disabled:opacity-50
                                    ${badgePresenza[stato]}`}>
                        {saving === s.id
                          ? <span className="w-3 h-3 border border-current/30
                                             border-t-current rounded-full animate-spin" />
                          : labelPresenza[stato]
                        }
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
