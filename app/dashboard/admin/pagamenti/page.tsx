'use client'
import { useCallback, useEffect, useState } from 'react'
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
  studente: { nome: string; cognome: string; email: string }
  corso: { titolo: string }
}

const STATI = ['tutti', 'da_pagare', 'in_ritardo', 'pagato', 'sospeso']

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

export default function AdminPagamenti() {
  const router = useRouter()
  const [supabase] = useState(createClient)
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('da_pagare')
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('pagamenti')
      .select(`
        *,
        studente:utenti!pagamenti_studente_id_fkey(nome,cognome,email),
        corso:corsi(titolo)
      `)
      .order('scadenza', { ascending: true })
    setPagamenti((data as Pagamento[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { void load() }, [load])

  async function segnaComePagato(id: string) {
    setSaving(id)
    await supabase
      .from('pagamenti')
      .update({ stato: 'pagato', pagato_at: new Date().toISOString() })
      .eq('id', id)
    await load()
    setSaving(null)
  }

  async function segnaInRitardo(id: string) {
    setSaving(id)
    await supabase
      .from('pagamenti')
      .update({ stato: 'in_ritardo' })
      .eq('id', id)
    await load()
    setSaving(null)
  }

  const filtrati = pagamenti.filter(p => filtro === 'tutti' || p.stato === filtro)

  // KPI finanziari
  const totDaPagare = pagamenti
    .filter(p => p.stato === 'da_pagare')
    .reduce((s, p) => s + Number(p.importo_euro), 0)
  const totInRitardo = pagamenti
    .filter(p => p.stato === 'in_ritardo')
    .reduce((s, p) => s + Number(p.importo_euro), 0)
  const totIncassato = pagamenti
    .filter(p => p.stato === 'pagato')
    .reduce((s, p) => s + Number(p.importo_euro), 0)

  function isScaduta(scadenza: string) {
    return new Date(scadenza) < new Date()
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

      {/* KPI CARDS */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4">
        {[
          { label: 'Incassato',  val: formatEuro(totIncassato),  c: 'text-success' },
          { label: 'Da pagare',  val: formatEuro(totDaPagare),   c: 'text-warning' },
          { label: 'In ritardo', val: formatEuro(totInRitardo),  c: 'text-danger'  },
        ].map(k => (
          <div key={k.label}
            className="bg-surf2 border border-white/[0.055] rounded-[14px] p-3 text-center">
            <p className={`font-serif text-base ${k.c}`}>{k.val}</p>
            <p className="text-[9px] text-cream/40 uppercase tracking-[0.5px] mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* FILTRI */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3">
        {STATI.map(f => {
          const count = f === 'tutti'
            ? pagamenti.length
            : pagamenti.filter(p => p.stato === f).length
          return (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap border transition-all
                ${filtro === f
                  ? 'border-adm-acc text-adm-acc bg-adm-acc/10'
                  : 'border-white/10 text-cream/40'}`}>
              {f === 'tutti' ? `Tutti (${count})` : `${labelStato[f]} (${count})`}
            </button>
          )
        })}
      </div>

      {/* LISTA */}
      <div className="px-4 flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-adm-acc/30 border-t-adm-acc
                            rounded-full animate-spin mx-auto" />
          </div>
        ) : filtrati.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3 opacity-30">💳</p>
            <p className="font-serif text-lg text-cream/50">Nessun pagamento</p>
            <p className="text-xs text-cream/30 mt-1">Nessun risultato per questo filtro</p>
          </div>
        ) : filtrati.map(p => (
          <div key={p.id}
            className={`bg-surf2 rounded-[18px] p-4 border transition-all
              ${p.stato === 'in_ritardo'
                ? 'border-danger/25'
                : p.stato === 'da_pagare' && isScaduta(p.scadenza)
                  ? 'border-warning/25'
                  : 'border-white/[0.055]'}`}>

            {/* Intestazione */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[14px] font-medium text-cream">
                  {p.studente?.nome} {p.studente?.cognome}
                </p>
                <p className="text-[11px] text-cream/40">{p.studente?.email}</p>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium
                                ${badgeStato[p.stato]}`}>
                {labelStato[p.stato]}
              </span>
            </div>

            {/* Dettaglio rata */}
            <div className="flex items-center justify-between
                            py-2 border-t border-b border-white/[0.04] mb-3">
              <div>
                <p className="text-[12px] text-cream/70 truncate max-w-[180px]">
                  {p.corso?.titolo}
                </p>
                <p className="text-[10px] text-cream/30 mt-0.5">
                  Rata {p.numero_rata} · Scadenza {formatData(p.scadenza)}
                  {isScaduta(p.scadenza) && p.stato !== 'pagato' && (
                    <span className="text-danger ml-1">⚠ Scaduta</span>
                  )}
                </p>
              </div>
              <p className="font-serif text-xl text-cream ml-3">
                {formatEuro(p.importo_euro)}
              </p>
            </div>

            {p.pagato_at && (
              <p className="text-[10px] text-success/70 mb-3">
                ✓ Pagato il {formatData(p.pagato_at)}
              </p>
            )}

            {/* AZIONI */}
            {(p.stato === 'da_pagare' || p.stato === 'in_ritardo') && (
              <div className="flex gap-2">
                <button
                  onClick={() => segnaComePagato(p.id)}
                  disabled={saving === p.id}
                  className="flex-1 h-9 bg-success/15 border border-success/25
                             rounded-[10px] text-[12px] text-success font-medium
                             flex items-center justify-center gap-1.5
                             disabled:opacity-40 transition-all active:scale-[0.97]">
                  {saving === p.id
                    ? <span className="w-3.5 h-3.5 border-2 border-success/30
                                       border-t-success rounded-full animate-spin" />
                    : '✓ Segna pagato'}
                </button>
                {p.stato === 'da_pagare' && (
                  <button
                    onClick={() => segnaInRitardo(p.id)}
                    disabled={saving === p.id}
                    className="h-9 px-3 bg-danger/10 border border-danger/20
                               rounded-[10px] text-[11px] text-danger
                               disabled:opacity-40 transition-all active:scale-[0.97]">
                    In ritardo
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
