'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatData, formatEuro } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'

type Pagamento = {
  id: string
  numero_rata: number
  importo_euro: number
  scadenza: string
  stato: string
  pagato_at?: string
  corso: { titolo: string; livello: string }
}

const badgeStato: Record<string, string> = {
  da_pagare:  'bg-warning/15 text-warning',
  in_ritardo: 'bg-danger/15 text-danger',
  pagato:     'bg-success/15 text-success',
  sospeso:    'bg-white/5 text-cream/40',
}
const labelStato: Record<string, string> = {
  da_pagare:  'Da pagare',
  in_ritardo: 'In ritardo',
  pagato:     'Pagato',
  sospeso:    'Sospeso',
}

export default function StudentePagamenti() {
  const router = useRouter()
  const supabase = createClient()
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user
      if (!user) {
        setLoading(false)
        return
      }

      supabase
        .from('pagamenti')
        .select('*, corso:corsi(titolo,livello)')
        .eq('studente_id', user.id)
        .order('scadenza', { ascending: true })
        .then(({ data: rows }: { data: Pagamento[] | null }) => {
          setPagamenti(rows ?? [])
          setLoading(false)
        })
    })
  }, [])

  const totDovuto = pagamenti
    .filter(p => p.stato !== 'pagato')
    .reduce((s, p) => s + Number(p.importo_euro), 0)
  const totPagato = pagamenti
    .filter(p => p.stato === 'pagato')
    .reduce((s, p) => s + Number(p.importo_euro), 0)
  const hasRitardo = pagamenti.some(p => p.stato === 'in_ritardo')
  const prossima = pagamenti.find(p => p.stato === 'da_pagare' || p.stato === 'in_ritardo')

  function isScaduta(scadenza: string) {
    return new Date(scadenza) < new Date()
  }

  function giorniAllaScadenza(scadenza: string) {
    const diff = new Date(scadenza).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
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
        <h1 className="font-serif text-2xl text-cream">Pagamenti</h1>
      </div>

      {/* ALERT RITARDO */}
      {hasRitardo && (
        <div className="mx-4 mb-4 px-4 py-3 bg-danger/10 border border-danger/25
                        rounded-[14px] flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-[12px] font-medium text-danger">Pagamento in ritardo</p>
            <p className="text-[11px] text-danger/70 mt-0.5">
              Contatta la segreteria per regolarizzare la posizione
            </p>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 gap-2 px-4 mb-4">
        <div className="bg-surf2 border border-white/[0.055] rounded-[14px] p-4">
          <p className="text-[10px] text-cream/40 uppercase tracking-[0.5px] mb-1">Pagato</p>
          <p className="font-serif text-2xl text-success">{formatEuro(totPagato)}</p>
        </div>
        <div className={`rounded-[14px] p-4 border
          ${totDovuto > 0
            ? 'bg-warning/5 border-warning/20'
            : 'bg-surf2 border-white/[0.055]'}`}>
          <p className="text-[10px] text-cream/40 uppercase tracking-[0.5px] mb-1">Da pagare</p>
          <p className={`font-serif text-2xl ${totDovuto > 0 ? 'text-warning' : 'text-cream/30'}`}>
            {formatEuro(totDovuto)}
          </p>
        </div>
      </div>

      {/* PROSSIMA RATA */}
      {prossima && (
        <>
          <p className="section-label text-gold-d">Prossima rata</p>
          <div className={`mx-4 mb-4 rounded-[18px] p-4 border
            ${prossima.stato === 'in_ritardo'
              ? 'bg-danger/10 border-danger/25'
              : isScaduta(prossima.scadenza)
                ? 'bg-warning/10 border-warning/25'
                : 'bg-surf2 border-white/[0.055]'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[13px] font-medium text-cream">
                  Rata {prossima.numero_rata}
                </p>
                <p className="text-[11px] text-cream/50 mt-0.5">
                  {prossima.corso?.titolo}
                </p>
              </div>
              <p className="font-serif text-2xl text-cream">
                {formatEuro(prossima.importo_euro)}
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className={`
                ${prossima.stato === 'in_ritardo' ? 'text-danger'
                  : isScaduta(prossima.scadenza) ? 'text-warning'
                  : 'text-cream/40'}`}>
                📅 Scadenza: {formatData(prossima.scadenza)}
                {!isScaduta(prossima.scadenza) && giorniAllaScadenza(prossima.scadenza) <= 7 && (
                  <span className="text-warning ml-1">
                    ({giorniAllaScadenza(prossima.scadenza)} giorni)
                  </span>
                )}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium
                                ${badgeStato[prossima.stato]}`}>
                {labelStato[prossima.stato]}
              </span>
            </div>
          </div>
        </>
      )}

      {/* STORICO COMPLETO */}
      <p className="section-label text-gold-d">Storico rate</p>
      <div className="px-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-gold/30 border-t-gold
                            rounded-full animate-spin" />
          </div>
        ) : pagamenti.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3 opacity-30">💳</p>
            <p className="font-serif text-lg text-cream/50">Nessun pagamento</p>
            <p className="text-xs text-cream/30 mt-1">
              Le rate appariranno dopo l&apos;iscrizione a un corso
            </p>
          </div>
        ) : pagamenti.map(p => (
          <div key={p.id}
            className={`bg-surf2 rounded-[16px] p-4 border
              ${p.stato === 'in_ritardo' ? 'border-danger/20'
                : p.stato === 'pagato' ? 'border-success/15'
                : 'border-white/[0.055]'}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[13px] font-medium text-cream">
                Rata {p.numero_rata} — {p.corso?.titolo}
              </p>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium
                                ${badgeStato[p.stato]}`}>
                {labelStato[p.stato]}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-[11px] text-cream/40">
                {p.stato === 'pagato' && p.pagato_at
                  ? <span className="text-success/70">✓ Pagato il {formatData(p.pagato_at)}</span>
                  : <span>📅 Scadenza: {formatData(p.scadenza)}</span>
                }
              </div>
              <p className="font-serif text-lg text-cream">
                {formatEuro(p.importo_euro)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
