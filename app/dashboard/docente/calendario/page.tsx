'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatData } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Lezione = {
  id: string
  numero: number
  titolo: string
  data: string
  ora_inizio: string
  ora_fine: string
  sede?: string
  note?: string
  corso: { id: string; titolo: string; livello: string }
}

export default function DocenteCalendario() {
  const router = useRouter()
  const [supabase] = useState(createClient)
  const [lezioni, setLezioni] = useState<Lezione[]>([])
  const [loading, setLoading] = useState(true)
  const [meseOffset, setMeseOffset] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('lezioni')
        .select('*, corso:corsi!inner(id,titolo,livello,docente_id)')
        .eq('corso.docente_id', user.id)
        .order('data', { ascending: true })
        .then(({ data }: { data: any }) => {
          setLezioni(data ?? [])
          setLoading(false)
        })
    })
  }, [supabase])

  const oggi = new Date()
  const mese = new Date(oggi.getFullYear(), oggi.getMonth() + meseOffset, 1)
  const nomeMese = mese.toLocaleDateString('it', { month: 'long', year: 'numeric' })

  const lezioniDelMese = lezioni.filter(l => {
    const d = new Date(l.data)
    return d.getMonth() === mese.getMonth() && d.getFullYear() === mese.getFullYear()
  })

  const lezioniPassate = lezioni.filter(l => new Date(l.data) < oggi)
  const lezioniFuture  = lezioni.filter(l => new Date(l.data) >= oggi)
  const prossima       = lezioniFuture[0] ?? null

  function isOggi(data: string) {
    return new Date(data).toDateString() === oggi.toDateString()
  }
  function isPassata(data: string) {
    return new Date(data) < oggi
  }

  // Griglia calendario del mese
  const primoGiorno  = new Date(mese.getFullYear(), mese.getMonth(), 1).getDay()
  const giorniInMese = new Date(mese.getFullYear(), mese.getMonth() + 1, 0).getDate()
  const offset       = primoGiorno === 0 ? 6 : primoGiorno - 1 // lun=0

  const giorniConLezione = new Set(
    lezioniDelMese.map(l => new Date(l.data).getDate())
  )

  return (
    <div className="min-h-screen pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                     flex items-center justify-center text-cream/60">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-serif text-2xl text-cream">Calendario</h1>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4">
        {[
          { val: lezioni.length,        label: 'Totale',   c: 'text-doc-acc' },
          { val: lezioniPassate.length, label: 'Erogate',  c: 'text-success' },
          { val: lezioniFuture.length,  label: 'Future',   c: 'text-gold'    },
        ].map(k => (
          <div key={k.label}
            className="bg-surf2 border border-white/[0.055] rounded-[14px] p-3 text-center">
            <p className={`font-serif text-2xl ${k.c}`}>{k.val}</p>
            <p className="text-[9px] text-cream/40 uppercase tracking-[0.5px] mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* PROSSIMA LEZIONE */}
      {prossima && (
        <>
          <p className="section-label" style={{ color: 'rgba(90,188,212,0.5)' }}>
            Prossima lezione
          </p>
          <div className="mx-4 mb-4 rounded-[18px] bg-gradient-to-br from-doc/30 to-doc-d/30
                          border border-doc-acc/20 p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-doc-acc/15 border border-doc-acc/20
                              flex flex-col items-center justify-center flex-shrink-0">
                <span className="font-serif text-xl text-doc-acc leading-none">
                  {new Date(prossima.data).getDate()}
                </span>
                <span className="text-[8px] text-doc-acc/50 uppercase tracking-wider">
                  {new Date(prossima.data).toLocaleDateString('it', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-cream truncate">{prossima.titolo}</p>
                <p className="text-[11px] text-cream/50 mt-0.5">{prossima.corso?.titolo}</p>
                <p className="text-[11px] text-doc-acc/70 mt-0.5">
                  {prossima.ora_inizio?.slice(0,5)} – {prossima.ora_fine?.slice(0,5)}
                  {prossima.sede && <span className="text-cream/30"> · {prossima.sede}</span>}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MINI CALENDARIO */}
      <p className="section-label" style={{ color: 'rgba(90,188,212,0.5)' }}>
        Calendario
      </p>
      <div className="mx-4 mb-4 bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
        {/* Navigazione mese */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMeseOffset(o => o - 1)}
            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07]
                       flex items-center justify-center text-cream/50
                       hover:text-cream transition-colors">
            <ChevronLeft size={16} />
          </button>
          <p className="text-[13px] font-medium text-cream capitalize">{nomeMese}</p>
          <button onClick={() => setMeseOffset(o => o + 1)}
            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07]
                       flex items-center justify-center text-cream/50
                       hover:text-cream transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Giorni settimana */}
        <div className="grid grid-cols-7 mb-2">
          {['L','M','M','G','V','S','D'].map((g, i) => (
            <div key={i} className="text-center text-[10px] text-cream/30 py-1">{g}</div>
          ))}
        </div>

        {/* Celle giorni */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: giorniInMese }).map((_, i) => {
            const giorno = i + 1
            const haLezione = giorniConLezione.has(giorno)
            const isOggiGiorno = giorno === oggi.getDate()
              && mese.getMonth() === oggi.getMonth()
              && mese.getFullYear() === oggi.getFullYear()

            return (
              <div key={giorno}
                className={`aspect-square flex flex-col items-center justify-center
                             rounded-[8px] text-[12px] relative transition-all
                  ${isOggiGiorno
                    ? 'bg-doc-acc text-dark font-bold'
                    : haLezione
                      ? 'bg-doc-acc/15 text-doc-acc'
                      : 'text-cream/40'}`}>
                {giorno}
                {haLezione && !isOggiGiorno && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-doc-acc" />
                )}
              </div>
            )
          })}
        </div>

        {lezioniDelMese.length > 0 && (
          <p className="text-[10px] text-doc-acc/50 text-center mt-3">
            {lezioniDelMese.length} lezioni in {nomeMese}
          </p>
        )}
      </div>

      {/* LISTA LEZIONI DEL MESE */}
      {lezioniDelMese.length > 0 && (
        <>
          <p className="section-label" style={{ color: 'rgba(90,188,212,0.5)' }}>
            Lezioni di {mese.toLocaleDateString('it', { month: 'long' })}
          </p>
          <div className="px-4 flex flex-col gap-2 mb-4">
            {lezioniDelMese.map(l => (
              <div key={l.id}
                className={`rounded-[14px] p-3 border flex items-center gap-3
                  ${isPassata(l.data)
                    ? 'bg-white/[0.02] border-white/[0.04]'
                    : isOggi(l.data)
                      ? 'bg-doc-acc/10 border-doc-acc/25'
                      : 'bg-surf2 border-white/[0.055]'}`}>
                <div className={`w-10 h-10 rounded-xl flex flex-col items-center
                                  justify-center flex-shrink-0 text-xs
                  ${isOggi(l.data)
                    ? 'bg-doc-acc text-dark font-bold'
                    : isPassata(l.data)
                      ? 'bg-white/[0.04] text-cream/30'
                      : 'bg-doc-acc/15 text-doc-acc'}`}>
                  <span className="font-serif text-base leading-none">
                    {new Date(l.data).getDate()}
                  </span>
                  <span className="text-[7px] uppercase tracking-wider opacity-70">
                    {new Date(l.data).toLocaleDateString('it', { month: 'short' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] truncate
                    ${isPassata(l.data) ? 'text-cream/40' : 'text-cream'}`}>
                    {l.titolo}
                  </p>
                  <p className="text-[10px] text-cream/30 mt-0.5">
                    {l.ora_inizio?.slice(0,5)} – {l.ora_fine?.slice(0,5)}
                    {l.sede && ` · ${l.sede}`}
                  </p>
                </div>
                {isPassata(l.data) && (
                  <span className="text-[9px] text-success/60 flex-shrink-0">✓</span>
                )}
                {isOggi(l.data) && (
                  <span className="text-[9px] px-2 py-0.5 bg-doc-acc/20
                                   text-doc-acc rounded-full flex-shrink-0">
                    Oggi
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* EMPTY STATE */}
      {!loading && lezioni.length === 0 && (
        <div className="text-center py-16 px-4">
          <p className="text-4xl mb-3 opacity-30">📅</p>
          <p className="font-serif text-lg text-cream/50">Nessuna lezione</p>
          <p className="text-xs text-cream/30 mt-1">
            Le lezioni appariranno quando verranno assegnate ai tuoi corsi
          </p>
        </div>
      )}
    </div>
  )
}
