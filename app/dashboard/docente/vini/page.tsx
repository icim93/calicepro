'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatData } from '@/lib/utils'
import { ChevronLeft, Plus } from 'lucide-react'

type Vino = {
  id: string
  nome: string
  produttore: string
  annata?: string
  tipo: string
  denominazione?: string
  num_bottiglie: number
  stato: string
  note?: string
  lezione: {
    id: string
    numero: number
    titolo: string
    data: string
    corso: { titolo: string }
  }
}

type Lezione = {
  id: string
  numero: number
  titolo: string
  data: string
  corso: { titolo: string }
}

const TIPI_VINO = ['bianco', 'rosso', 'rosato', 'bollicine', 'dolce', 'passito'] as const
const STATI_VINO = ['in_attesa', 'confermato', 'non_disponibile'] as const

const tipoEmoji: Record<string, string> = {
  bianco:    '🥂',
  rosso:     '🍷',
  rosato:    '🌸',
  bollicine: '🍾',
  dolce:     '🍯',
  passito:   '🍇',
}

const badgeStato: Record<string, string> = {
  in_attesa:       'bg-warning/15 text-warning',
  confermato:      'bg-success/15 text-success',
  non_disponibile: 'bg-danger/15 text-danger',
}
const labelStato: Record<string, string> = {
  in_attesa:       'In attesa',
  confermato:      'Confermato',
  non_disponibile: 'Non disponibile',
}

export default function DocenteVini() {
  const router = useRouter()
  const supabase = createClient()
  const [vini, setVini] = useState<Vino[]>([])
  const [lezioni, setLezioni] = useState<Lezione[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'lista' | 'nuovo'>('lista')
  const [filtroLezione, setFiltroLezione] = useState<string>('tutte')
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    produttore: '',
    annata: '',
    tipo: 'rosso',
    denominazione: '',
    num_bottiglie: 2,
    lezione_id: '',
    note: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadAll(user.id) }
    })
  }, [])

  async function loadAll(uid: string) {
    const [{ data: v }, { data: l }] = await Promise.all([
      supabase
        .from('vini')
        .select(`
          *,
          lezione:lezioni(id, numero, titolo, data,
            corso:corsi(titolo))
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('lezioni')
        .select('id, numero, titolo, data, corso:corsi!inner(titolo,docente_id)')
        .eq('corso.docente_id', uid)
        .order('data', { ascending: false }),
    ])
    setVini((v as Vino[]) ?? [])
    setLezioni((l as Lezione[]) ?? [])
    setLoading(false)
  }

  function setF(k: string, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function salva() {
    if (!form.nome || !form.produttore || !form.lezione_id) return
    setSaving(true)
    await supabase.from('vini').insert({
      nome:          form.nome,
      produttore:    form.produttore,
      annata:        form.annata || null,
      tipo:          form.tipo,
      denominazione: form.denominazione || null,
      num_bottiglie: form.num_bottiglie,
      lezione_id:    form.lezione_id,
      note:          form.note || null,
      stato:         'in_attesa',
    })
    if (userId) await loadAll(userId)
    setForm({
      nome: '', produttore: '', annata: '', tipo: 'rosso',
      denominazione: '', num_bottiglie: 2, lezione_id: '', note: '',
    })
    setView('lista')
    setSaving(false)
  }

  async function aggiornaStato(id: string, stato: string) {
    await supabase.from('vini').update({ stato }).eq('id', id)
    if (userId) await loadAll(userId)
  }

  async function elimina(id: string) {
    await supabase.from('vini').delete().eq('id', id)
    if (userId) await loadAll(userId)
  }

  const viniFiltrati = filtroLezione === 'tutte'
    ? vini
    : vini.filter(v => v.lezione?.id === filtroLezione)

  // ── FORM NUOVO ──
  if (view === 'nuovo') {
    return (
      <div className="min-h-screen pb-10">
        <div className="flex items-center gap-3 px-5 pt-14 pb-4">
          <button onClick={() => setView('lista')}
            className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                       flex items-center justify-center text-cream/60">
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-serif text-2xl text-cream">Aggiungi vino</h1>
        </div>

        <div className="px-4 flex flex-col gap-4">

          {/* VINO */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-doc-acc/60 uppercase tracking-[0.5px] mb-3">
              Il vino
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="field-label">Nome vino *</label>
                <input value={form.nome} onChange={e => setF('nome', e.target.value)}
                  placeholder="es. Barolo Riserva" className="field-input" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label">Produttore *</label>
                  <input value={form.produttore} onChange={e => setF('produttore', e.target.value)}
                    placeholder="es. Gaja" className="field-input" />
                </div>
                <div>
                  <label className="field-label">Annata</label>
                  <input value={form.annata} onChange={e => setF('annata', e.target.value)}
                    placeholder="es. 2019" className="field-input" />
                </div>
              </div>
              <div>
                <label className="field-label">Denominazione</label>
                <input value={form.denominazione} onChange={e => setF('denominazione', e.target.value)}
                  placeholder="es. Barolo DOCG" className="field-input" />
              </div>
            </div>
          </div>

          {/* TIPO */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-doc-acc/60 uppercase tracking-[0.5px] mb-3">
              Tipologia
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TIPI_VINO.map(t => (
                <button key={t} onClick={() => setF('tipo', t)}
                  className={`py-3 rounded-[10px] border transition-all
                              flex flex-col items-center gap-1
                    ${form.tipo === t
                      ? 'border-doc-acc bg-doc-acc/15'
                      : 'border-white/[0.07] hover:border-white/15'}`}>
                  <span className="text-xl">{tipoEmoji[t]}</span>
                  <span className={`text-[10px] capitalize
                    ${form.tipo === t ? 'text-doc-acc' : 'text-cream/40'}`}>
                    {t}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* BOTTIGLIE */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-doc-acc/60 uppercase tracking-[0.5px] mb-3">
              Numero bottiglie
            </p>
            <div className="flex items-center gap-4">
              <button onClick={() => setF('num_bottiglie', Math.max(1, form.num_bottiglie - 1))}
                className="w-10 h-10 rounded-xl bg-surf3 border border-white/[0.07]
                           text-cream/60 text-xl flex items-center justify-center
                           hover:text-cream transition-colors">
                −
              </button>
              <div className="flex-1 text-center">
                <p className="font-serif text-4xl text-cream">{form.num_bottiglie}</p>
                <p className="text-[10px] text-cream/30 mt-0.5">bottiglie</p>
              </div>
              <button onClick={() => setF('num_bottiglie', Math.min(20, form.num_bottiglie + 1))}
                className="w-10 h-10 rounded-xl bg-surf3 border border-white/[0.07]
                           text-cream/60 text-xl flex items-center justify-center
                           hover:text-cream transition-colors">
                ＋
              </button>
            </div>
          </div>

          {/* LEZIONE */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-doc-acc/60 uppercase tracking-[0.5px] mb-3">
              Lezione *
            </p>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar">
              {lezioni.length === 0 ? (
                <p className="text-xs text-cream/40 text-center py-4">
                  Nessuna lezione disponibile
                </p>
              ) : lezioni.map(l => (
                <button key={l.id} onClick={() => setF('lezione_id', l.id)}
                  className={`w-full text-left p-3 rounded-[10px] border transition-all
                    ${form.lezione_id === l.id
                      ? 'border-doc-acc bg-doc-acc/10'
                      : 'border-white/[0.07] hover:border-white/15'}`}>
                  <p className={`text-[12px]
                    ${form.lezione_id === l.id ? 'text-doc-acc' : 'text-cream/70'}`}>
                    #{l.numero} {l.titolo}
                  </p>
                  <p className="text-[10px] text-cream/30 mt-0.5">
                    {l.corso?.titolo} · {formatData(l.data)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* NOTE */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-doc-acc/60 uppercase tracking-[0.5px] mb-3">
              Note (opzionale)
            </p>
            <textarea value={form.note} onChange={e => setF('note', e.target.value)}
              placeholder="Indicazioni per la preparazione, temperatura di servizio..."
              rows={3}
              className="w-full bg-surf3 border border-white/[0.07] rounded-[10px]
                         px-3 py-2 text-sm text-cream placeholder:text-cream/20
                         outline-none focus:border-doc-acc/40 transition-colors resize-none" />
          </div>

          {/* SALVA */}
          <button onClick={salva}
            disabled={saving || !form.nome || !form.produttore || !form.lezione_id}
            className="w-full h-[52px] bg-doc-gradient border border-doc-acc/30
                       rounded-[14px] text-[13px] font-semibold text-cream
                       flex items-center justify-center gap-2
                       disabled:opacity-50 transition-all active:scale-[0.98]">
            {saving
              ? <><span className="w-4 h-4 border-2 border-cream/30 border-t-cream
                                   rounded-full animate-spin" />Salvataggio...</>
              : '🍷 Aggiungi vino'}
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
          <h1 className="font-serif text-2xl text-cream">Lista Vini</h1>
        </div>
        <button onClick={() => setView('nuovo')}
          className="flex items-center gap-1.5 h-9 px-4
                     bg-doc border border-doc-acc/20 rounded-xl
                     text-[11px] font-semibold text-cream tracking-wider">
          <Plus size={14} /> Aggiungi
        </button>
      </div>

      {/* FILTRO LEZIONE */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3">
        <button onClick={() => setFiltroLezione('tutte')}
          className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap border transition-all
            ${filtroLezione === 'tutte'
              ? 'border-doc-acc text-doc-acc bg-doc-acc/10'
              : 'border-white/10 text-cream/40'}`}>
          Tutte le lezioni ({vini.length})
        </button>
        {lezioni.slice(0, 5).map(l => (
          <button key={l.id} onClick={() => setFiltroLezione(l.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap border transition-all
              ${filtroLezione === l.id
                ? 'border-doc-acc text-doc-acc bg-doc-acc/10'
                : 'border-white/10 text-cream/40'}`}>
            Lez. #{l.numero}
          </button>
        ))}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4">
        {[
          { label: 'Totale',      val: vini.length,                                          c: 'text-doc-acc' },
          { label: 'Confermati',  val: vini.filter(v => v.stato === 'confermato').length,    c: 'text-success' },
          { label: 'In attesa',   val: vini.filter(v => v.stato === 'in_attesa').length,     c: 'text-warning' },
        ].map(k => (
          <div key={k.label}
            className="bg-surf2 border border-white/[0.055] rounded-[14px] p-3 text-center">
            <p className={`font-serif text-2xl ${k.c}`}>{k.val}</p>
            <p className="text-[9px] text-cream/40 uppercase tracking-[0.5px] mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* LISTA */}
      <div className="px-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-doc-acc/30 border-t-doc-acc
                            rounded-full animate-spin" />
          </div>
        ) : viniFiltrati.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3 opacity-30">🍷</p>
            <p className="font-serif text-lg text-cream/50">Nessun vino</p>
            <p className="text-xs text-cream/30 mt-1 mb-4">
              Aggiungi i vini per le tue degustazioni
            </p>
            <button onClick={() => setView('nuovo')}
              className="px-5 py-2 border border-doc-acc/25 rounded-full
                         text-xs text-doc-acc hover:bg-doc-acc/5 transition-colors">
              + Primo vino
            </button>
          </div>
        ) : viniFiltrati.map(v => (
          <div key={v.id}
            className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{tipoEmoji[v.tipo] ?? '🍷'}</span>
                <div>
                  <p className="text-[14px] font-medium text-cream">{v.nome}</p>
                  <p className="text-[11px] text-cream/50">{v.produttore}
                    {v.annata && <span className="text-cream/30"> · {v.annata}</span>}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium
                                flex-shrink-0 ${badgeStato[v.stato]}`}>
                {labelStato[v.stato]}
              </span>
            </div>

            {/* Dettagli */}
            <div className="flex items-center gap-3 text-[10px] text-cream/30
                            py-2 border-t border-b border-white/[0.04] mb-3">
              {v.denominazione && <span>🏷 {v.denominazione}</span>}
              <span>🍾 {v.num_bottiglie} bott.</span>
              <span className="ml-auto">
                Lez. #{v.lezione?.numero} · {formatData(v.lezione?.data)}
              </span>
            </div>

            {v.note && (
              <p className="text-[11px] text-cream/40 italic mb-3">"{v.note}"</p>
            )}

            {/* Azioni */}
            <div className="flex gap-2">
              {v.stato === 'in_attesa' && (
                <button onClick={() => aggiornaStato(v.id, 'confermato')}
                  className="flex-1 h-9 bg-success/15 border border-success/25
                             rounded-[10px] text-[12px] text-success font-medium
                             transition-all active:scale-[0.97]">
                  ✓ Conferma
                </button>
              )}
              {v.stato === 'confermato' && (
                <button onClick={() => aggiornaStato(v.id, 'in_attesa')}
                  className="flex-1 h-9 bg-warning/10 border border-warning/20
                             rounded-[10px] text-[12px] text-warning
                             transition-all active:scale-[0.97]">
                  ↩ Riporta in attesa
                </button>
              )}
              <button onClick={() => aggiornaStato(v.id, 'non_disponibile')}
                disabled={v.stato === 'non_disponibile'}
                className="h-9 px-3 bg-white/[0.03] border border-white/[0.06]
                           rounded-[10px] text-[11px] text-cream/30
                           disabled:opacity-30 transition-all active:scale-[0.97]">
                N/D
              </button>
              <button onClick={() => elimina(v.id)}
                className="h-9 px-3 bg-danger/10 border border-danger/20
                           rounded-[10px] text-[12px] text-danger
                           transition-all active:scale-[0.97]">
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}