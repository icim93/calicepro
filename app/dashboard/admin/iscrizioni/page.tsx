'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatData } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'

type Iscrizione = {
  id: string
  stato: string
  created_at: string
  studente: { nome: string; cognome: string; email: string; tessera_ais?: string }
  corso: { titolo: string; livello: string }
}

const STATI = ['tutti', 'in_attesa', 'approvata', 'rifiutata', 'sospesa']

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

export default function AdminIscrizioni() {
  const router = useRouter()
  const [supabase] = useState(createClient)
  const [iscrizioni, setIscrizioni] = useState<Iscrizione[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('in_attesa')
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('iscrizioni')
      .select(`
        *,
        studente:utenti!iscrizioni_studente_id_fkey(nome,cognome,email,tessera_ais),
        corso:corsi(titolo,livello)
      `)
      .order('created_at', { ascending: false })
    setIscrizioni((data as Iscrizione[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { void load() }, [load])

  async function aggiorna(id: string, stato: string) {
    setSaving(id)
    await supabase
      .from('iscrizioni')
      .update({
        stato,
        ...(stato === 'approvata' ? { approvata_at: new Date().toISOString() } : {}),
      })
      .eq('id', id)
    await load()
    setSaving(null)
  }

  const filtrate = iscrizioni.filter(i => filtro === 'tutti' || i.stato === filtro)
  const inAttesa = iscrizioni.filter(i => i.stato === 'in_attesa').length

  return (
    <div className="min-h-screen pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                     flex items-center justify-center text-cream/60">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-2xl text-cream">Iscrizioni</h1>
          {inAttesa > 0 && (
            <p className="text-[11px] text-warning mt-0.5">
              🔔 {inAttesa} in attesa di approvazione
            </p>
          )}
        </div>
      </div>

      {/* FILTRI */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3">
        {STATI.map(f => {
          const count = f === 'tutti'
            ? iscrizioni.length
            : iscrizioni.filter(i => i.stato === f).length
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
        ) : filtrate.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3 opacity-30">📋</p>
            <p className="font-serif text-lg text-cream/50">Nessuna iscrizione</p>
            <p className="text-xs text-cream/30 mt-1">
              {filtro === 'in_attesa' ? 'Nessuna richiesta pendente' : 'Nessun risultato per questo filtro'}
            </p>
          </div>
        ) : filtrate.map(i => (
          <div key={i.id}
            className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4
                       transition-all">
            {/* Intestazione */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[14px] font-medium text-cream">
                  {i.studente?.nome} {i.studente?.cognome}
                </p>
                <p className="text-[11px] text-cream/40">{i.studente?.email}</p>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${badgeStato[i.stato]}`}>
                {labelStato[i.stato]}
              </span>
            </div>

            {/* Corso */}
            <div className="flex items-center gap-2 mb-3 py-2
                            border-t border-b border-white/[0.04]">
              <span className="text-base">🍷</span>
              <div>
                <p className="text-[12px] text-cream/80">{i.corso?.titolo}</p>
                <p className="text-[10px] text-cream/30">{formatData(i.created_at)}</p>
              </div>
            </div>

            {/* Tessera AIS */}
            {i.studente?.tessera_ais && (
              <p className="text-[10px] text-cream/30 mb-3">
                Tessera AIS: <span className="text-cream/50">{i.studente.tessera_ais}</span>
              </p>
            )}

            {/* AZIONI — solo per in_attesa */}
            {i.stato === 'in_attesa' && (
              <div className="flex gap-2">
                <button
                  onClick={() => aggiorna(i.id, 'approvata')}
                  disabled={saving === i.id}
                  className="flex-1 h-9 bg-success/15 border border-success/25
                             rounded-[10px] text-[12px] text-success font-medium
                             flex items-center justify-center gap-1.5
                             disabled:opacity-40 transition-all active:scale-[0.97]">
                  {saving === i.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-success/30
                                     border-t-success rounded-full animate-spin" />
                  ) : '✓ Approva'}
                </button>
                <button
                  onClick={() => aggiorna(i.id, 'rifiutata')}
                  disabled={saving === i.id}
                  className="flex-1 h-9 bg-danger/10 border border-danger/20
                             rounded-[10px] text-[12px] text-danger font-medium
                             flex items-center justify-center gap-1.5
                             disabled:opacity-40 transition-all active:scale-[0.97]">
                  ✕ Rifiuta
                </button>
              </div>
            )}

            {/* AZIONI — per approvata: possibilità di sospendere */}
            {i.stato === 'approvata' && (
              <button
                onClick={() => aggiorna(i.id, 'sospesa')}
                disabled={saving === i.id}
                className="w-full h-8 bg-white/[0.03] border border-white/[0.06]
                           rounded-[10px] text-[11px] text-cream/30
                           transition-all active:scale-[0.97]">
                Sospendi iscrizione
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
