'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatData } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'

type Diploma = {
  id: string
  stato: string
  emesso_at?: string
  url?: string
  studente: { nome: string; cognome: string; email: string; tessera_ais?: string }
  corso: { titolo: string; livello: string }
}

const STATI = ['tutti', 'idoneo', 'emesso', 'in_attesa_pagamento', 'non_idoneo']

const badgeStato: Record<string, string> = {
  idoneo:                'bg-gold/15 text-gold',
  emesso:                'bg-success/15 text-success',
  in_attesa_pagamento:   'bg-warning/15 text-warning',
  non_idoneo:            'bg-danger/15 text-danger',
}
const labelStato: Record<string, string> = {
  idoneo:                'Idoneo',
  emesso:                'Emesso',
  in_attesa_pagamento:   'Att. pagamento',
  non_idoneo:            'Non idoneo',
}

export default function AdminDiplomi() {
  const router = useRouter()
  const [supabase] = useState(createClient)
  const [diplomi, setDiplomi] = useState<Diploma[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('idoneo')
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('diplomi')
      .select(`
        *,
        studente:utenti!diplomi_studente_id_fkey(nome,cognome,email,tessera_ais),
        corso:corsi(titolo,livello)
      `)
      .order('created_at', { ascending: false })
    setDiplomi((data as Diploma[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { void load() }, [load])

  async function emettiDiploma(id: string) {
    setSaving(id)
    await supabase
      .from('diplomi')
      .update({
        stato: 'emesso',
        emesso_at: new Date().toISOString(),
      })
      .eq('id', id)
    await load()
    setSaving(null)
  }

  async function cambiaStato(id: string, stato: string) {
    setSaving(id)
    await supabase.from('diplomi').update({ stato }).eq('id', id)
    await load()
    setSaving(null)
  }

  const filtrati = diplomi.filter(d => filtro === 'tutti' || d.stato === filtro)
  const idonei = diplomi.filter(d => d.stato === 'idoneo').length
  const emessi = diplomi.filter(d => d.stato === 'emesso').length

  function livelloEmoji(livello: string) {
    return livello === '1_livello' ? '①'
         : livello === '2_livello' ? '②'
         : livello === '3_livello' ? '③'
         : '★'
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
        <div className="flex-1">
          <h1 className="font-serif text-2xl text-cream">Diplomi</h1>
          {idonei > 0 && (
            <p className="text-[11px] text-gold mt-0.5">
              🎓 {idonei} studenti pronti per il diploma
            </p>
          )}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4">
        {[
          { label: 'Idonei',   val: idonei,  c: 'text-gold' },
          { label: 'Emessi',   val: emessi,  c: 'text-success' },
          { label: 'Totale',   val: diplomi.length, c: 'text-adm-acc' },
        ].map(k => (
          <div key={k.label}
            className="bg-surf2 border border-white/[0.055] rounded-[14px] p-3 text-center">
            <p className={`font-serif text-2xl ${k.c}`}>{k.val}</p>
            <p className="text-[9px] text-cream/40 uppercase tracking-[0.5px] mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* FILTRI */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3">
        {STATI.map(f => {
          const count = f === 'tutti'
            ? diplomi.length
            : diplomi.filter(d => d.stato === f).length
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
            <p className="text-4xl mb-3 opacity-30">🎓</p>
            <p className="font-serif text-lg text-cream/50">Nessun diploma</p>
            <p className="text-xs text-cream/30 mt-1">
              {filtro === 'idoneo' ? 'Nessuno studente idoneo al momento' : 'Nessun risultato'}
            </p>
          </div>
        ) : filtrati.map(d => (
          <div key={d.id}
            className={`bg-surf2 rounded-[18px] p-4 border transition-all
              ${d.stato === 'idoneo' ? 'border-gold/20' : 'border-white/[0.055]'}`}>

            {/* Intestazione */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20
                                flex items-center justify-center text-base flex-shrink-0">
                  {livelloEmoji(d.corso?.livello)}
                </div>
                <div>
                  <p className="text-[14px] font-medium text-cream">
                    {d.studente?.nome} {d.studente?.cognome}
                  </p>
                  <p className="text-[11px] text-cream/40">{d.studente?.email}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium flex-shrink-0
                                ${badgeStato[d.stato]}`}>
                {labelStato[d.stato]}
              </span>
            </div>

            {/* Corso */}
            <div className="py-2 border-t border-b border-white/[0.04] mb-3">
              <p className="text-[12px] text-cream/70">{d.corso?.titolo}</p>
              {d.studente?.tessera_ais && (
                <p className="text-[10px] text-cream/30 mt-0.5">
                  Tessera AIS: {d.studente.tessera_ais}
                </p>
              )}
              {d.emesso_at && (
                <p className="text-[10px] text-success/60 mt-0.5">
                  ✓ Emesso il {formatData(d.emesso_at)}
                </p>
              )}
            </div>

            {/* AZIONI */}
            {d.stato === 'idoneo' && (
              <div className="flex gap-2">
                <button
                  onClick={() => emettiDiploma(d.id)}
                  disabled={saving === d.id}
                  className="flex-1 h-9 bg-gold/15 border border-gold/25
                             rounded-[10px] text-[12px] text-gold font-medium
                             flex items-center justify-center gap-1.5
                             disabled:opacity-40 transition-all active:scale-[0.97]">
                  {saving === d.id
                    ? <span className="w-3.5 h-3.5 border-2 border-gold/30
                                       border-t-gold rounded-full animate-spin" />
                    : '🎓 Emetti diploma'}
                </button>
                <button
                  onClick={() => cambiaStato(d.id, 'in_attesa_pagamento')}
                  disabled={saving === d.id}
                  className="h-9 px-3 bg-warning/10 border border-warning/20
                             rounded-[10px] text-[11px] text-warning
                             disabled:opacity-40 transition-all active:scale-[0.97]">
                  Att. pag.
                </button>
              </div>
            )}

            {d.stato === 'in_attesa_pagamento' && (
              <div className="flex gap-2">
                <button
                  onClick={() => emettiDiploma(d.id)}
                  disabled={saving === d.id}
                  className="flex-1 h-9 bg-success/15 border border-success/25
                             rounded-[10px] text-[12px] text-success font-medium
                             flex items-center justify-center
                             disabled:opacity-40 transition-all active:scale-[0.97]">
                  ✓ Pagato, emetti
                </button>
                <button
                  onClick={() => cambiaStato(d.id, 'non_idoneo')}
                  disabled={saving === d.id}
                  className="h-9 px-3 bg-danger/10 border border-danger/20
                             rounded-[10px] text-[11px] text-danger
                             disabled:opacity-40 transition-all active:scale-[0.97]">
                  Non idoneo
                </button>
              </div>
            )}

            {d.stato === 'emesso' && d.url && (
              <a href={d.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-9
                           bg-white/[0.03] border border-white/[0.06] rounded-[10px]
                           text-[11px] text-cream/40 transition-all active:scale-[0.97]">
                📄 Visualizza diploma
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
