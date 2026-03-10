'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatData } from '@/lib/utils'
import { ChevronLeft, Plus } from 'lucide-react'

type Degustazione = {
  id: string
  nome_vino: string
  produttore?: string
  annata?: string
  tipo_vino?: string
  denominazione?: string
  valutazione?: number
  commento_finale?: string
  created_at: string
}

type NuovaDegu = {
  nome_vino: string
  produttore: string
  annata: string
  denominazione: string
  colore: string
  limpidezza: string
  consistenza: string
  intensita_olf: string
  qualita_olf: string
  note_olfatto: string
  acidita: string
  tannini: string
  corpo: string
  pai: string
  note_gusto: string
  valutazione: number
  abbinamenti: string
  commento_finale: string
}

const EMPTY: NuovaDegu = {
  nome_vino: '', produttore: '', annata: '', denominazione: '',
  colore: '', limpidezza: '', consistenza: '',
  intensita_olf: '', qualita_olf: '', note_olfatto: '',
  acidita: '', tannini: '', corpo: '', pai: '', note_gusto: '',
  valutazione: 0, abbinamenti: '', commento_finale: '',
}

const STELLE = [1, 2, 3, 4]
const labelStelle: Record<number, string> = {
  1: 'Semplice', 2: 'Buono', 3: 'Ottimo', 4: 'Eccellente',
}

function Chip({ options, value, onChange }: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-3 py-1.5 rounded-full text-[11px] border transition-all
            ${value === o
              ? 'border-gold bg-gold/15 text-gold'
              : 'border-white/[0.07] text-cream/40 hover:border-white/15'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}

export default function StudenteDegustazione() {
  const router = useRouter()
  const supabase = createClient()
  const [degu, setDegu] = useState<Degustazione[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'lista' | 'nuova'>('lista')
  const [form, setForm] = useState<NuovaDegu>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id) }
    })
  }, [])

  async function load(uid: string) {
    const { data } = await supabase
      .from('degustazioni')
      .select('*')
      .eq('studente_id', uid)
      .order('created_at', { ascending: false })
    setDegu((data as Degustazione[]) ?? [])
    setLoading(false)
  }

  function set(k: keyof NuovaDegu, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function salva() {
    if (!form.nome_vino || !userId) return
    setSaving(true)
    await supabase.from('degustazioni').insert({
      ...form,
      studente_id: userId,
      valutazione: form.valutazione || null,
    })
    await load(userId)
    setForm(EMPTY)
    setView('lista')
    setSaving(false)
  }

  if (view === 'nuova') {
    return (
      <div className="min-h-screen pb-10">
        {/* HEADER */}
        <div className="flex items-center gap-3 px-5 pt-14 pb-4">
          <button onClick={() => setView('lista')}
            className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                       flex items-center justify-center text-cream/60">
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-serif text-2xl text-cream">Nuova Degustazione</h1>
        </div>

        <div className="px-4 flex flex-col gap-4">

          {/* VINO */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-gold/60 uppercase tracking-[0.5px] mb-3">Il vino</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="field-label">Nome vino *</label>
                <input value={form.nome_vino} onChange={e => set('nome_vino', e.target.value)}
                  placeholder="es. Barolo Riserva" className="field-input" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label">Produttore</label>
                  <input value={form.produttore} onChange={e => set('produttore', e.target.value)}
                    placeholder="es. Gaja" className="field-input" />
                </div>
                <div>
                  <label className="field-label">Annata</label>
                  <input value={form.annata} onChange={e => set('annata', e.target.value)}
                    placeholder="es. 2019" className="field-input" />
                </div>
              </div>
              <div>
                <label className="field-label">Denominazione</label>
                <input value={form.denominazione} onChange={e => set('denominazione', e.target.value)}
                  placeholder="es. Barolo DOCG" className="field-input" />
              </div>
            </div>
          </div>

          {/* ESAME VISIVO */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-gold/60 uppercase tracking-[0.5px] mb-3">👁 Esame visivo</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="field-label">Colore</label>
                <Chip
                  options={['Giallo paglierino', 'Giallo dorato', 'Rosso rubino', 'Rosso granato', 'Rosso porpora', 'Rosato']}
                  value={form.colore} onChange={v => set('colore', v)} />
              </div>
              <div>
                <label className="field-label">Limpidezza</label>
                <Chip options={['Cristallino', 'Limpido', 'Velato', 'Torbido']}
                  value={form.limpidezza} onChange={v => set('limpidezza', v)} />
              </div>
              <div>
                <label className="field-label">Consistenza</label>
                <Chip options={['Scarso', 'Poco consistente', 'Abbastanza consistente', 'Consistente']}
                  value={form.consistenza} onChange={v => set('consistenza', v)} />
              </div>
            </div>
          </div>

          {/* ESAME OLFATTIVO */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-gold/60 uppercase tracking-[0.5px] mb-3">👃 Esame olfattivo</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="field-label">Intensità</label>
                <Chip options={['Carente', 'Poco intenso', 'Abbastanza intenso', 'Intenso', 'Molto intenso']}
                  value={form.intensita_olf} onChange={v => set('intensita_olf', v)} />
              </div>
              <div>
                <label className="field-label">Qualità</label>
                <Chip options={['Comune', 'Poco fine', 'Abbastanza fine', 'Fine', 'Eccellente']}
                  value={form.qualita_olf} onChange={v => set('qualita_olf', v)} />
              </div>
              <div>
                <label className="field-label">Note olfattive libere</label>
                <textarea value={form.note_olfatto} onChange={e => set('note_olfatto', e.target.value)}
                  placeholder="Frutti rossi, spezie, vaniglia..."
                  rows={2}
                  className="w-full bg-surf3 border border-white/[0.07] rounded-[10px]
                             px-3 py-2 text-sm text-cream placeholder:text-cream/20
                             outline-none focus:border-gold/40 transition-colors resize-none" />
              </div>
            </div>
          </div>

          {/* ESAME GUSTATIVO */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-gold/60 uppercase tracking-[0.5px] mb-3">👅 Esame gustativo</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="field-label">Acidità</label>
                <Chip options={['Piatta', 'Poco acida', 'Abbastanza acida', 'Acida', 'Molto acida']}
                  value={form.acidita} onChange={v => set('acidita', v)} />
              </div>
              <div>
                <label className="field-label">Tannini</label>
                <Chip options={['Assenti', 'Leggeri', 'Abbastanza tannico', 'Tannico', 'Molto tannico']}
                  value={form.tannini} onChange={v => set('tannini', v)} />
              </div>
              <div>
                <label className="field-label">Corpo</label>
                <Chip options={['Leggero', 'Abbastanza strutturato', 'Strutturato', 'Molto strutturato']}
                  value={form.corpo} onChange={v => set('corpo', v)} />
              </div>
              <div>
                <label className="field-label">PAI (Persistenza aromatica intensa)</label>
                <Chip options={['Corto', 'Abbastanza lungo', 'Lungo', 'Molto lungo']}
                  value={form.pai} onChange={v => set('pai', v)} />
              </div>
              <div>
                <label className="field-label">Note gustative libere</label>
                <textarea value={form.note_gusto} onChange={e => set('note_gusto', e.target.value)}
                  placeholder="Fresco, sapido, equilibrato..."
                  rows={2}
                  className="w-full bg-surf3 border border-white/[0.07] rounded-[10px]
                             px-3 py-2 text-sm text-cream placeholder:text-cream/20
                             outline-none focus:border-gold/40 transition-colors resize-none" />
              </div>
            </div>
          </div>

          {/* VALUTAZIONE FINALE */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-gold/60 uppercase tracking-[0.5px] mb-3">⭐ Valutazione finale</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="field-label">Punteggio</label>
                <div className="flex gap-2">
                  {STELLE.map(s => (
                    <button key={s} onClick={() => set('valutazione', s)}
                      className={`flex-1 py-3 rounded-[10px] border transition-all flex flex-col
                                  items-center gap-1
                        ${form.valutazione === s
                          ? 'border-gold bg-gold/15 text-gold'
                          : 'border-white/[0.07] text-cream/30 hover:border-white/15'}`}>
                      <span className="text-lg">{'★'.repeat(s)}{'☆'.repeat(4 - s)}</span>
                      <span className="text-[9px]">{labelStelle[s]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">Abbinamenti consigliati</label>
                <input value={form.abbinamenti} onChange={e => set('abbinamenti', e.target.value)}
                  placeholder="es. Arrosto, formaggi stagionati" className="field-input" />
              </div>
              <div>
                <label className="field-label">Commento finale</label>
                <textarea value={form.commento_finale} onChange={e => set('commento_finale', e.target.value)}
                  placeholder="Vino elegante, con buona struttura..."
                  rows={3}
                  className="w-full bg-surf3 border border-white/[0.07] rounded-[10px]
                             px-3 py-2 text-sm text-cream placeholder:text-cream/20
                             outline-none focus:border-gold/40 transition-colors resize-none" />
              </div>
            </div>
          </div>

          {/* SALVA */}
          <button onClick={salva} disabled={saving || !form.nome_vino}
            className="w-full h-[52px] bg-gradient-to-br from-bx-l via-bx to-bx-d
                       border border-gold/20 rounded-[14px]
                       text-[13px] font-semibold text-cream
                       flex items-center justify-center gap-2
                       disabled:opacity-50 transition-all active:scale-[0.98]">
            {saving
              ? <><span className="w-4 h-4 border-2 border-cream/30 border-t-cream
                                   rounded-full animate-spin" />Salvataggio...</>
              : '🍷 Salva degustazione'}
          </button>
        </div>
      </div>
    )
  }

  // ── LISTA ──
  return (
    <div className="min-h-screen pb-10">
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                       flex items-center justify-center text-cream/60">
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-serif text-2xl text-cream">Cellar Book</h1>
        </div>
        <button onClick={() => setView('nuova')}
          className="flex items-center gap-1.5 h-9 px-4
                     bg-bx border border-gold/20 rounded-xl
                     text-[11px] font-semibold text-cream tracking-wider">
          <Plus size={14} /> Nuova
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4">
        {[
          { label: 'Totale', val: degu.length, c: 'text-gold' },
          { label: 'Con voto', val: degu.filter(d => d.valutazione).length, c: 'text-success' },
          { label: 'Questo mese', val: degu.filter(d => {
              const m = new Date(); return new Date(d.created_at).getMonth() === m.getMonth()
            }).length, c: 'text-doc-acc' },
        ].map(k => (
          <div key={k.label}
            className="bg-surf2 border border-white/[0.055] rounded-[14px] p-3 text-center">
            <p className={`font-serif text-2xl ${k.c}`}>{k.val}</p>
            <p className="text-[9px] text-cream/40 uppercase tracking-[0.5px] mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : degu.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3 opacity-30">🍷</p>
            <p className="font-serif text-lg text-cream/50">Nessuna degustazione</p>
            <p className="text-xs text-cream/30 mt-1 mb-4">
              Inizia a registrare le tue degustazioni
            </p>
            <button onClick={() => setView('nuova')}
              className="px-5 py-2 border border-gold/25 rounded-full
                         text-xs text-gold hover:bg-gold/5 transition-colors">
              + Prima degustazione
            </button>
          </div>
        ) : degu.map(d => (
          <div key={d.id}
            className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4
                       active:scale-[0.99] transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-1">
              <p className="font-serif text-[16px] text-cream">{d.nome_vino}</p>
              {d.valutazione && (
                <span className="text-gold text-sm flex-shrink-0 ml-2">
                  {'★'.repeat(d.valutazione)}{'☆'.repeat(4 - d.valutazione)}
                </span>
              )}
            </div>
            {d.produttore && (
              <p className="text-[12px] text-cream/50 mb-1">{d.produttore}</p>
            )}
            <div className="flex items-center gap-3 text-[10px] text-cream/30 mb-2">
              {d.annata && <span>📅 {d.annata}</span>}
              {d.denominazione && <span>🏷 {d.denominazione}</span>}
              <span className="ml-auto">{formatData(d.created_at)}</span>
            </div>
            {d.commento_finale && (
              <p className="text-[11px] text-cream/40 italic line-clamp-2 border-t
                            border-white/[0.04] pt-2 mt-1">
                &quot;{d.commento_finale}&quot;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
