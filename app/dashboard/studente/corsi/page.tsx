'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { labelLivello, formatData } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'

type Iscrizione = {
  id: string
  stato: string
  created_at: string
  corso: {
    id: string
    titolo: string
    livello: string
    stato: string
    sede: string
    data_inizio: string
    num_lezioni: number
    quota_euro: number
    docente: { nome: string; cognome: string }
  }
}

type CorsoAperto = {
  id: string
  titolo: string
  livello: string
  stato: string
  sede: string
  data_inizio: string
  num_lezioni: number
  quota_euro: number
  capienza_max: number
  docente: { nome: string; cognome: string }
  iscrizioni: { count: number }[]
}

const badgeStato: Record<string, string> = {
  in_attesa: 'bg-warning/15 text-warning',
  approvata:  'bg-success/15 text-success',
  rifiutata:  'bg-danger/15 text-danger',
  sospesa:    'bg-white/5 text-cream/40',
}
const labelStato: Record<string, string> = {
  in_attesa: 'In attesa',
  approvata:  'Approvata',
  rifiutata:  'Rifiutata',
  sospesa:    'Sospesa',
}

export default function StudenteCorsi() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'miei' | 'esplora'>('miei')
  const [iscrizioni, setIscrizioni] = useState<Iscrizione[]>([])
  const [corsiAperti, setCorsiAperti] = useState<CorsoAperto[]>([])
  const [loading, setLoading] = useState(true)
  const [iscrivendo, setIscrivendo] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadAll(user.id)
      }
    })
  }, [])

  async function loadAll(uid: string) {
    setLoading(true)
    const [{ data: isc }, { data: aperti }] = await Promise.all([
      supabase
        .from('iscrizioni')
        .select(`
          *,
          corso:corsi(
            id, titolo, livello, stato, sede, data_inizio,
            num_lezioni, quota_euro,
            docente:utenti!corsi_docente_id_fkey(nome,cognome)
          )
        `)
        .eq('studente_id', uid)
        .order('created_at', { ascending: false }),
      supabase
        .from('corsi')
        .select(`
          id, titolo, livello, stato, sede, data_inizio,
          num_lezioni, quota_euro, capienza_max,
          docente:utenti!corsi_docente_id_fkey(nome,cognome),
          iscrizioni(count)
        `)
        .eq('stato', 'aperto')
        .order('data_inizio', { ascending: true }),
    ])
    setIscrizioni((isc as Iscrizione[]) ?? [])
    setCorsiAperti((aperti as CorsoAperto[]) ?? [])
    setLoading(false)
  }

  async function iscriviti(corsoId: string) {
    if (!userId) return
    setIscrivendo(corsoId)
    await supabase.from('iscrizioni').insert({
      corso_id: corsoId,
      studente_id: userId,
      stato: 'in_attesa',
    })
    await loadAll(userId)
    setIscrivendo(null)
  }

  const giaIscritto = (corsoId: string) =>
    iscrizioni.some(i => i.corso?.id === corsoId)

  return (
    <div className="min-h-screen pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                     flex items-center justify-center text-cream/60">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-serif text-2xl text-cream">Corsi</h1>
      </div>

      {/* TAB */}
      <div className="flex gap-1 mx-4 mb-4 p-1 bg-surf2 border border-white/[0.055] rounded-[14px]">
        {(['miei', 'esplora'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-[10px] text-[12px] font-medium transition-all
              ${tab === t
                ? 'bg-gold/15 text-gold border border-gold/20'
                : 'text-cream/40 hover:text-cream/60'}`}>
            {t === 'miei' ? `Le mie iscrizioni (${iscrizioni.length})` : 'Esplora corsi'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold
                          rounded-full animate-spin" />
        </div>
      ) : tab === 'miei' ? (
        /* ── I MIEI CORSI ── */
        <div className="px-4 flex flex-col gap-3">
          {iscrizioni.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3 opacity-30">📚</p>
              <p className="font-serif text-lg text-cream/50">Nessuna iscrizione</p>
              <p className="text-xs text-cream/30 mt-1 mb-4">
                Esplora i corsi disponibili e iscriviti
              </p>
              <button onClick={() => setTab('esplora')}
                className="px-5 py-2 border border-gold/25 rounded-full
                           text-xs text-gold hover:bg-gold/5 transition-colors">
                Esplora corsi →
              </button>
            </div>
          ) : iscrizioni.map(i => (
            <div key={i.id}
              className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="badge badge-gold">{labelLivello(i.corso?.livello)}</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium
                                  ${badgeStato[i.stato]}`}>
                  {labelStato[i.stato]}
                </span>
              </div>
              <p className="font-serif text-lg text-cream mb-1">{i.corso?.titolo}</p>
              <p className="text-[11px] text-cream/40 mb-3">
                Prof. {i.corso?.docente?.cognome} · {i.corso?.sede}
              </p>
              <div className="flex items-center justify-between text-[10px] text-cream/30">
                <span>📅 {formatData(i.corso?.data_inizio)}</span>
                <span>📚 {i.corso?.num_lezioni} lezioni</span>
                <span>💰 €{i.corso?.quota_euro}</span>
              </div>
              {i.stato === 'approvata' && (
                <button
                  onClick={() => router.push(`/dashboard/studente/corsi/${i.corso.id}`)}
                  className="mt-3 w-full h-9 bg-gold/10 border border-gold/20
                             rounded-[10px] text-[12px] text-gold
                             hover:bg-gold/15 transition-colors">
                  Vai al corso →
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── ESPLORA ── */
        <div className="px-4 flex flex-col gap-3">
          {corsiAperti.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3 opacity-30">🔍</p>
              <p className="font-serif text-lg text-cream/50">Nessun corso disponibile</p>
              <p className="text-xs text-cream/30 mt-1">
                Al momento non ci sono corsi con iscrizioni aperte
              </p>
            </div>
          ) : corsiAperti.map(c => {
            const iscritti = c.iscrizioni?.[0]?.count ?? 0
            const pct = Math.min(100, (iscritti / c.capienza_max) * 100)
            const isGiaIscritto = giaIscritto(c.id)
            const esaurito = iscritti >= c.capienza_max

            return (
              <div key={c.id}
                className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="badge badge-gold">{labelLivello(c.livello)}</span>
                  {esaurito && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full
                                     bg-danger/10 text-danger font-medium">
                      Esaurito
                    </span>
                  )}
                </div>
                <p className="font-serif text-lg text-cream mb-1">{c.titolo}</p>
                <p className="text-[11px] text-cream/40 mb-3">
                  Prof. {c.docente?.cognome} · {c.sede}
                </p>

                {/* Occupancy bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-cream/30 mb-1">
                    <span>Posti disponibili</span>
                    <span>{iscritti}/{c.capienza_max}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-gold/60 rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-cream/30 mb-3">
                  <span>📅 {formatData(c.data_inizio)}</span>
                  <span>📚 {c.num_lezioni} lezioni</span>
                  <span className="text-gold font-medium">€{c.quota_euro}</span>
                </div>

                <button
                  onClick={() => !isGiaIscritto && !esaurito && iscriviti(c.id)}
                  disabled={isGiaIscritto || esaurito || iscrivendo === c.id}
                  className={`w-full h-10 rounded-[10px] text-[12px] font-medium
                    transition-all active:scale-[0.97] disabled:opacity-50
                    ${isGiaIscritto
                      ? 'bg-success/10 border border-success/20 text-success'
                      : esaurito
                        ? 'bg-white/5 border border-white/[0.07] text-cream/30'
                        : 'bg-gold/15 border border-gold/25 text-gold hover:bg-gold/20'}`}>
                  {iscrivendo === c.id
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-gold/30
                                         border-t-gold rounded-full animate-spin" />
                        Invio richiesta...
                      </span>
                    : isGiaIscritto ? '✓ Già iscritto'
                    : esaurito ? 'Corso esaurito'
                    : 'Richiedi iscrizione'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}