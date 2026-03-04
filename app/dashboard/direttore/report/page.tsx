'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatData, formatEuro, labelLivello } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'

type Corso = {
  id: string
  titolo: string
  livello: string
  stato: string
  data_inizio: string
  num_lezioni: number
  capienza_max: number
  quota_euro: number
  docente: { nome: string; cognome: string }
}

type StatCorso = {
  corso: Corso
  iscritti: number
  presenzaMedia: number
  incassato: number
  atteso: number
  diplomandi: number
  lezioniErogate: number
}

export default function DirettoreReport() {
  const router = useRouter()
  const supabase = createClient()

  const [stats, setStats] = useState<StatCorso[]>([])
  const [loading, setLoading] = useState(true)
  const [corsoSelezionato, setCorsoSelezionato] = useState<string>('tutti')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadReport(user.id) }
    })
  }, [])

  async function loadReport(uid: string) {
    setLoading(true)

    const { data: corsi } = await supabase
      .from('corsi')
      .select(`
        *,
        docente:utenti!corsi_docente_id_fkey(nome,cognome)
      `)
      .eq('direttore_id', uid)
      .order('data_inizio', { ascending: false })

    if (!corsi || corsi.length === 0) { setLoading(false); return }

    const corsiIds = corsi.map(c => c.id)

    const [
      { data: iscrizioni },
      { data: presenze },
      { data: pagamenti },
      { data: diplomi },
      { data: lezioni },
    ] = await Promise.all([
      supabase
        .from('iscrizioni')
        .select('corso_id, stato')
        .in('corso_id', corsiIds),
      supabase
        .from('presenze')
        .select('stato, lezione:lezioni!inner(corso_id)')
        .in('lezione.corso_id', corsiIds),
      supabase
        .from('pagamenti')
        .select('corso_id, importo_euro, stato')
        .in('corso_id', corsiIds),
      supabase
        .from('diplomi')
        .select('corso_id, stato')
        .in('corso_id', corsiIds),
      supabase
        .from('lezioni')
        .select('corso_id, data')
        .in('corso_id', corsiIds),
    ])

    const oggi = new Date().toISOString().split('T')[0]

    const statsCalcolate: StatCorso[] = corsi.map(corso => {
      const iscCorso    = (iscrizioni ?? []).filter(i => i.corso_id === corso.id && i.stato === 'approvata')
      const pagCorso    = (pagamenti ?? []).filter(p => p.corso_id === corso.id)
      const dipCorso    = (diplomi ?? []).filter(d => d.corso_id === corso.id)
      const lezCorso    = (lezioni ?? []).filter(l => l.corso_id === corso.id)
      const lezPassate  = lezCorso.filter(l => l.data <= oggi)
      const presCorso   = (presenze ?? []).filter(
        (p: any) => p.lezione?.corso_id === corso.id
      )

      const presenti    = presCorso.filter((p: any) => p.stato === 'presente').length
      const totAttese   = lezPassate.length * iscCorso.length
      const presenzaMedia = totAttese > 0 ? Math.round((presenti / totAttese) * 100) : 0

      const incassato   = pagCorso
        .filter(p => p.stato === 'pagato')
        .reduce((s, p) => s + Number(p.importo_euro), 0)
      const atteso      = pagCorso
        .filter(p => p.stato !== 'pagato')
        .reduce((s, p) => s + Number(p.importo_euro), 0)

      const diplomandi  = dipCorso.filter(d => d.stato === 'idoneo' || d.stato === 'emesso').length

      return {
        corso:           corso as Corso,
        iscritti:        iscCorso.length,
        presenzaMedia,
        incassato,
        atteso,
        diplomandi,
        lezioniErogate:  lezPassate.length,
      }
    })

    setStats(statsCalcolate)
    setLoading(false)
  }

  // Totali globali
  const totIscritti   = stats.reduce((s, c) => s + c.iscritti, 0)
  const totIncassato  = stats.reduce((s, c) => s + c.incassato, 0)
  const totAtteso     = stats.reduce((s, c) => s + c.atteso, 0)
  const mediaPresenze = stats.length > 0
    ? Math.round(stats.reduce((s, c) => s + c.presenzaMedia, 0) / stats.length) : 0

  const statFiltrate  = corsoSelezionato === 'tutti'
    ? stats
    : stats.filter(s => s.corso.id === corsoSelezionato)

  function colorePresenza(pct: number) {
    if (pct >= 75) return 'text-success'
    if (pct >= 50) return 'text-warning'
    return 'text-danger'
  }

  return (
    <div className="min-h-screen pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                     flex items-center justify-center text-cream/60">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-serif text-2xl text-cream">Report</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-dir-acc/30 border-t-dir-acc
                          rounded-full animate-spin" />
        </div>
      ) : stats.length === 0 ? (
        <div className="text-center py-20 px-4">
          <p className="text-4xl mb-3 opacity-30">📊</p>
          <p className="font-serif text-lg text-cream/50">Nessun dato disponibile</p>
          <p className="text-xs text-cream/30 mt-1">
            I report appariranno quando ci sono corsi attivi
          </p>
        </div>
      ) : (
        <>
          {/* KPI GLOBALI */}
          <div className="mx-4 mb-4 rounded-[18px] bg-gradient-to-br
                          from-dir/30 to-dir-d/30
                          border border-dir-acc/20 p-5">
            <p className="text-[10px] text-dir-acc/60 uppercase tracking-[0.5px] mb-3">
              Riepilogo generale
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] text-cream/40 mb-0.5">Totale incassato</p>
                <p className="font-serif text-2xl text-success">
                  {formatEuro(totIncassato)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-cream/40 mb-0.5">Da incassare</p>
                <p className="font-serif text-2xl text-warning">
                  {formatEuro(totAtteso)}
                </p>
              </div>
            </div>
            {/* Barra incasso */}
            <div className="progress-track h-[6px] mb-2">
              <div className="progress-fill bg-dir-gradient"
                style={{
                  '--progress-w': `${totIncassato + totAtteso > 0
                    ? Math.round((totIncassato / (totIncassato + totAtteso)) * 100)
                    : 0}%`
                } as React.CSSProperties} />
            </div>
            <div className="h-px bg-white/[0.06] my-3" />
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { n: stats.length,   l: 'Corsi',    c: 'text-dir-acc' },
                { n: totIscritti,    l: 'Studenti',  c: 'text-gold'    },
                { n: `${mediaPresenze}%`, l: 'Presenze', c: colorePresenza(mediaPresenze) },
              ].map(k => (
                <div key={k.l}>
                  <p className={`font-serif text-xl ${k.c}`}>{k.n}</p>
                  <p className="text-[9px] text-cream/40 mt-0.5">{k.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FILTRO CORSO */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3">
            <button
              onClick={() => setCorsoSelezionato('tutti')}
              className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap
                          border transition-all
                ${corsoSelezionato === 'tutti'
                  ? 'border-dir-acc text-dir-acc bg-dir-acc/10'
                  : 'border-white/10 text-cream/40'}`}>
              Tutti i corsi
            </button>
            {stats.map(s => (
              <button key={s.corso.id}
                onClick={() => setCorsoSelezionato(s.corso.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap
                            border transition-all
                  ${corsoSelezionato === s.corso.id
                    ? 'border-dir-acc text-dir-acc bg-dir-acc/10'
                    : 'border-white/10 text-cream/40'}`}>
                {s.corso.titolo}
              </button>
            ))}
          </div>

          {/* CARDS CORSI */}
          <div className="px-4 flex flex-col gap-4 mt-2">
            {statFiltrate.map(s => (
              <div key={s.corso.id}
                className="bg-surf2 border border-white/[0.055] rounded-[18px] overflow-hidden">

                {/* Header corso */}
                <div className="p-4 border-b border-white/[0.055]">
                  <div className="flex items-start justify-between mb-1">
                    <span className="badge badge-dir">{labelLivello(s.corso.livello)}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full
                      ${s.corso.stato === 'attivo'  ? 'bg-success/10 text-success'
                      : s.corso.stato === 'aperto' ? 'bg-warning/10 text-warning'
                      : 'bg-white/5 text-cream/30'}`}>
                      {s.corso.stato}
                    </span>
                  </div>
                  <p className="font-serif text-[17px] text-cream mt-1">{s.corso.titolo}</p>
                  <p className="text-[11px] text-cream/40 mt-0.5">
                    Prof. {s.corso.docente?.nome} {s.corso.docente?.cognome} ·{' '}
                    {formatData(s.corso.data_inizio)}
                  </p>
                </div>

                {/* KPI corso */}
                <div className="grid grid-cols-3 divide-x divide-white/[0.055]">
                  {[
                    { n: `${s.iscritti}/${s.corso.capienza_max}`, l: 'Iscritti',  c: 'text-gold'    },
                    { n: `${s.presenzaMedia}%`,                   l: 'Presenze',  c: colorePresenza(s.presenzaMedia) },
                    { n: `${s.lezioniErogate}/${s.corso.num_lezioni}`, l: 'Lezioni', c: 'text-dir-acc' },
                  ].map(k => (
                    <div key={k.l} className="p-3 text-center">
                      <p className={`font-serif text-lg ${k.c}`}>{k.n}</p>
                      <p className="text-[9px] text-cream/40 mt-0.5">{k.l}</p>
                    </div>
                  ))}
                </div>

                {/* Barra presenze */}
                <div className="px-4 pb-1 pt-1">
                  <div className="progress-track h-[5px]">
                    <div className="progress-fill"
                      style={{
                        '--progress-w': `${s.presenzaMedia}%`,
                        background: s.presenzaMedia >= 75
                          ? 'linear-gradient(90deg,#3da85a,#5DBF7A)'
                          : s.presenzaMedia >= 50
                            ? 'linear-gradient(90deg,#c07a20,#E8A04A)'
                            : 'linear-gradient(90deg,#b04040,#E06060)',
                      } as React.CSSProperties} />
                  </div>
                </div>

                {/* Finanziario */}
                <div className="p-4 border-t border-white/[0.055]">
                  <p className="text-[10px] text-cream/30 uppercase tracking-[0.4px] mb-2">
                    Situazione finanziaria
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-success">
                      ✓ {formatEuro(s.incassato)}
                    </span>
                    <span className="text-[12px] text-warning">
                      ⏳ {formatEuro(s.atteso)}
                    </span>
                    <span className="text-[12px] text-cream/50">
                      Tot. {formatEuro(s.incassato + s.atteso)}
                    </span>
                  </div>
                  {(s.incassato + s.atteso) > 0 && (
                    <div className="progress-track h-[5px]">
                      <div className="progress-fill bg-dir-gradient"
                        style={{
                          '--progress-w': `${Math.round(
                            (s.incassato / (s.incassato + s.atteso)) * 100
                          )}%`
                        } as React.CSSProperties} />
                    </div>
                  )}
                </div>

                {/* Diplomandi */}
                {s.diplomandi > 0 && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 px-3 py-2
                                    bg-gold/10 border border-gold/20 rounded-[10px]">
                      <span>🎓</span>
                      <p className="text-[11px] text-gold">
                        {s.diplomandi} studenti idonei al diploma
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}