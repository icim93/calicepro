// app/dashboard/docente/page.tsx
import { requireRuolo } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatData, labelLivello } from '@/lib/utils'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default async function DocenteHome() {
  const utente = await requireRuolo(['docente'])
  const supabase = createServerSupabaseClient()

  // Corsi assegnati
  const { data: corsi } = await supabase
    .from('corsi')
    .select(`*, iscrizioni(count)`)
    .eq('docente_id', utente.id)
    .in('stato', ['attivo', 'aperto'])

  // Prossima lezione
  const corsiIds = (corsi ?? []).map(c => c.id)
  const { data: prossima } = corsiIds.length
    ? await supabase
        .from('lezioni')
        .select('*, corso:corsi(titolo,livello)')
        .in('corso_id', corsiIds)
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true })
        .limit(1)
        .single()
    : { data: null }

  // Lezioni erogate (passate)
  const { count: lezErogate } = await supabase
    .from('lezioni')
    .select('*', { count: 'exact', head: true })
    .in('corso_id', corsiIds.length ? corsiIds : ['none'])
    .lt('data', new Date().toISOString().split('T')[0])

  const totStudenti = (corsi ?? []).reduce(
    (s, c) => s + (c.iscrizioni?.[0]?.count ?? 0),
    0
  )

  return (
    <div>
      {/* KPI */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4 mt-2">
        {[
          { n: corsi?.length ?? 0, l: 'Corsi attivi', c: 'text-doc-acc' },
          { n: totStudenti, l: 'Studenti', c: 'text-gold' },
          { n: lezErogate ?? 0, l: 'Lez. erogate', c: 'text-success' },
        ].map(k => (
          <div
            key={k.l}
            className="bg-surf2 border border-white/[0.055] rounded-[14px] p-3 text-center"
          >
            <p className={`font-serif text-2xl ${k.c}`}>{k.n}</p>
            <p className="text-[9px] text-cream/40 uppercase tracking-[0.5px] mt-1">
              {k.l}
            </p>
          </div>
        ))}
      </div>

      {/* PROSSIMA LEZIONE */}
      {prossima && (
        <>
          <p className="section-label" style={{ color: 'rgba(90,188,212,0.5)' }}>
            Prossima lezione
          </p>
          <Link
            href={`/dashboard/docente/lezioni/${prossima.id}`}
            className="mx-4 mb-4 block rounded-[18px]
                       bg-gradient-to-br from-doc/30 to-doc-d/30
                       border border-doc-acc/20 p-5
                       hover:border-doc-acc/40 transition-all active:scale-[0.98]"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="badge badge-doc">
                <span className="dot-live bg-doc-acc w-1.5 h-1.5 mr-1"></span>
                {formatData(prossima.data)}
              </span>
              <span className="text-[11px] text-cream/40">
                {prossima.ora_inizio?.slice(0, 5)} – {prossima.ora_fine?.slice(0, 5)}
              </span>
            </div>
            <p className="font-serif text-xl text-cream mb-1">{prossima.titolo}</p>
            <p className="text-xs text-cream/50 mb-4">{prossima.corso?.titolo}</p>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/docente/vini?lezione=${prossima.id}`}
                onClick={e => e.stopPropagation()}
                className="flex-1 h-9 bg-doc-acc/15 border border-doc-acc/20 rounded-[10px]
                           flex items-center justify-center gap-1.5
                           text-[11px] text-doc-acc font-medium
                           hover:bg-doc-acc/20 transition-colors"
              >
                🍷 Lista vini
              </Link>
              <Link
                href="/dashboard/docente/materiali"
                onClick={e => e.stopPropagation()}
                className="flex-1 h-9 bg-white/5 border border-white/[0.07] rounded-[10px]
                           flex items-center justify-center gap-1.5
                           text-[11px] text-cream/60
                           hover:bg-white/[0.08] transition-colors"
              >
                📎 Materiali
              </Link>
            </div>
          </Link>
        </>
      )}

      {/* CORSI ASSEGNATI */}
      <p className="section-label" style={{ color: 'rgba(90,188,212,0.5)' }}>
        Corsi assegnati
      </p>
      <div className="mx-4 bg-surf2 border border-white/[0.055] rounded-[18px] overflow-hidden mb-4">
        {(corsi ?? []).length === 0 ? (
          <p className="text-sm text-cream/40 text-center py-8">
            Nessun corso assegnato
          </p>
        ) : (
          (corsi ?? []).map((corso, i) => (
            <Link
              key={corso.id}
              href={`/dashboard/docente/lezioni?corso=${corso.id}`}
              className={`flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors
                        ${
                          i < (corsi ?? []).length - 1
                            ? 'border-b border-white/[0.055]'
                            : ''
                        }`}
            >
              <div className="w-9 h-9 rounded-xl bg-doc/25 border border-doc-acc/20 flex items-center justify-center text-sm">
                🍷
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-cream truncate">{corso.titolo}</p>
                <p className="text-[11px] text-cream/40">
                  {corso.iscrizioni?.[0]?.count ?? 0} studenti · {labelLivello(corso.livello)}
                </p>
              </div>

              <ChevronRight
                className="text-cream/20 flex-shrink-0"
                size={16}
                strokeWidth={1.5}
              />
            </Link>
          ))
        )}
      </div>

      {/* STORICO */}
      {lezErogate! > 0 && (
        <>
          <p className="section-label" style={{ color: 'rgba(90,188,212,0.5)' }}>
            Storico recente
          </p>
          <Link
            href="/dashboard/docente/calendario"
            className="mx-4 bg-surf2 border border-white/[0.055] rounded-[18px] p-4
                       flex items-center justify-between mb-4
                       hover:border-doc-acc/20 transition-colors"
          >
            <div>
              <p className="text-[13px] text-cream">{lezErogate} lezioni erogate</p>
              <p className="text-[11px] text-cream/40">Vedi calendario completo</p>
            </div>

            <ChevronRight
              className="text-cream/20 flex-shrink-0"
              size={16}
              strokeWidth={1.5}
            />
          </Link>
        </>
      )}
    </div>
  )
}