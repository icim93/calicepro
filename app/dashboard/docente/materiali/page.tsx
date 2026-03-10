'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatData, normalizeOne } from '@/lib/utils'
import { ChevronLeft, Plus, FileText, Video, Presentation, File } from 'lucide-react'

type Materiale = {
  id: string
  titolo: string
  tipo: string
  url: string
  visibilita: string
  dimensione_bytes?: number
  created_at: string
  lezione: {
    id: string
    titolo: string
    data: string
    numero: number
    corso: { titolo: string }
  }
}

type Lezione = {
  id: string
  numero: number
  titolo: string
  data: string
  corso: { id: string; titolo: string }
}

type MaterialeRow = Omit<Materiale, 'lezione'> & {
  lezione: Materiale['lezione'] | Materiale['lezione'][]
}

type LezioneRow = Omit<Lezione, 'corso'> & {
  corso: Lezione['corso'] | Lezione['corso'][]
}

const TIPI = ['pdf', 'video', 'presentazione', 'altro'] as const
type TipoMateriale = typeof TIPI[number]

const tipoIcon: Record<TipoMateriale, React.ReactNode> = {
  pdf:           <FileText size={16} />,
  video:         <Video size={16} />,
  presentazione: <Presentation size={16} />,
  altro:         <File size={16} />,
}

const tipoLabel: Record<TipoMateriale, string> = {
  pdf: 'PDF', video: 'Video', presentazione: 'Presentazione', altro: 'Altro',
}

const tipoColor: Record<TipoMateriale, string> = {
  pdf:           'text-danger bg-danger/10 border-danger/20',
  video:         'text-doc-acc bg-doc-acc/10 border-doc-acc/20',
  presentazione: 'text-gold bg-gold/10 border-gold/20',
  altro:         'text-cream/50 bg-white/5 border-white/10',
}

function formatBytes(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocenteMateriali() {
  const router = useRouter()
  const supabase = createClient()
  const [materiali, setMateriali] = useState<Materiale[]>([])
  const [lezioni, setLezioni] = useState<Lezione[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'lista' | 'nuovo'>('lista')
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [form, setForm] = useState({
    titolo: '',
    tipo: 'pdf' as TipoMateriale,
    url: '',
    lezione_id: '',
    visibilita: 'dopo_lezione' as 'immediata' | 'dopo_lezione',
    dimensione_bytes: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadAll(user.id) }
    })
  }, [])

  async function loadAll(uid: string) {
    const [{ data: mat }, { data: lez }] = await Promise.all([
      supabase
        .from('materiali')
        .select(`
          *,
          lezione:lezioni(id, titolo, data, numero,
            corso:corsi(titolo))
        `)
        .eq('docente_id', uid)
        .order('created_at', { ascending: false }),
      supabase
        .from('lezioni')
        .select('id, numero, titolo, data, corso:corsi!inner(id,titolo,docente_id)')
        .eq('corso.docente_id', uid)
        .order('data', { ascending: false }),
    ])
    setMateriali(
      ((mat as MaterialeRow[] | null) ?? []).map((item) => ({
        ...item,
        lezione: normalizeOne(item.lezione)!,
      }))
    )
    setLezioni(
      ((lez as LezioneRow[] | null) ?? []).map((item) => ({
        ...item,
        corso: normalizeOne(item.corso)!,
      }))
    )
    setLoading(false)
  }

  function setF(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function salva() {
    if (!form.titolo || !form.url || !form.lezione_id || !userId) return
    setSaving(true)
    await supabase.from('materiali').insert({
      titolo:           form.titolo,
      tipo:             form.tipo,
      url:              form.url,
      lezione_id:       form.lezione_id,
      docente_id:       userId,
      visibilita:       form.visibilita,
      dimensione_bytes: form.dimensione_bytes ? parseInt(form.dimensione_bytes) : null,
    })
    await loadAll(userId)
    setForm({
      titolo: '', tipo: 'pdf', url: '', lezione_id: '',
      visibilita: 'dopo_lezione', dimensione_bytes: '',
    })
    setView('lista')
    setSaving(false)
  }

  async function elimina(id: string) {
    if (!userId) return
    await supabase.from('materiali').delete().eq('id', id)
    await loadAll(userId)
  }

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
          <h1 className="font-serif text-2xl text-cream">Nuovo materiale</h1>
        </div>

        <div className="px-4 flex flex-col gap-4">

          {/* INFO BASE */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-doc-acc/60 uppercase tracking-[0.5px] mb-3">
              Informazioni
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="field-label">Titolo *</label>
                <input value={form.titolo} onChange={e => setF('titolo', e.target.value)}
                  placeholder="es. Slide lezione 3 — Vitigni autoctoni"
                  className="field-input" style={{ '--tw-ring-color': 'rgba(90,188,212,0.4)' } as React.CSSProperties} />
              </div>
              <div>
                <label className="field-label">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPI.map(t => (
                    <button key={t} onClick={() => setF('tipo', t)}
                      className={`py-2.5 rounded-[10px] text-xs border transition-all
                                  flex items-center justify-center gap-1.5
                        ${form.tipo === t
                          ? 'border-doc-acc bg-doc-acc/15 text-doc-acc'
                          : 'border-white/[0.07] text-cream/40'}`}>
                      {tipoIcon[t]} {tipoLabel[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">URL / Link *</label>
                <input value={form.url} onChange={e => setF('url', e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="field-input" />
              </div>
            </div>
          </div>

          {/* LEZIONE */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-doc-acc/60 uppercase tracking-[0.5px] mb-3">
              Lezione di riferimento *
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
                  <p className={`text-[12px] ${form.lezione_id === l.id ? 'text-doc-acc' : 'text-cream/70'}`}>
                    #{l.numero} {l.titolo}
                  </p>
                  <p className="text-[10px] text-cream/30 mt-0.5">
                    {l.corso?.titolo} · {formatData(l.data)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* VISIBILITÀ */}
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-doc-acc/60 uppercase tracking-[0.5px] mb-3">
              Visibilità per gli studenti
            </p>
            <div className="flex gap-2">
              {[
                { val: 'immediata',    label: '🔓 Subito', sub: 'Visibile ora' },
                { val: 'dopo_lezione', label: '🔒 Dopo',   sub: 'Dal giorno della lezione' },
              ].map(v => (
                <button key={v.val}
                  onClick={() => setF('visibilita', v.val)}
                  className={`flex-1 py-3 rounded-[10px] border text-left px-3 transition-all
                    ${form.visibilita === v.val
                      ? 'border-doc-acc bg-doc-acc/10'
                      : 'border-white/[0.07] hover:border-white/15'}`}>
                  <p className={`text-[12px] font-medium
                    ${form.visibilita === v.val ? 'text-doc-acc' : 'text-cream/60'}`}>
                    {v.label}
                  </p>
                  <p className="text-[10px] text-cream/30 mt-0.5">{v.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* SALVA */}
          <button onClick={salva}
            disabled={saving || !form.titolo || !form.url || !form.lezione_id}
            className="w-full h-[52px] bg-doc-gradient border border-doc-acc/30
                       rounded-[14px] text-[13px] font-semibold text-cream
                       flex items-center justify-center gap-2
                       disabled:opacity-50 transition-all active:scale-[0.98]">
            {saving
              ? <><span className="w-4 h-4 border-2 border-cream/30 border-t-cream
                                   rounded-full animate-spin" />Salvataggio...</>
              : '📎 Aggiungi materiale'}
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
          <h1 className="font-serif text-2xl text-cream">Materiali</h1>
        </div>
        <button onClick={() => setView('nuovo')}
          className="flex items-center gap-1.5 h-9 px-4
                     bg-doc border border-doc-acc/20 rounded-xl
                     text-[11px] font-semibold text-cream tracking-wider">
          <Plus size={14} /> Nuovo
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4">
        {TIPI.slice(0, 3).map(t => (
          <div key={t}
            className="bg-surf2 border border-white/[0.055] rounded-[14px] p-3 text-center">
            <p className="font-serif text-2xl text-doc-acc">
              {materiali.filter(m => m.tipo === t).length}
            </p>
            <p className="text-[9px] text-cream/40 uppercase tracking-[0.5px] mt-1">
              {tipoLabel[t]}
            </p>
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
        ) : materiali.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3 opacity-30">📎</p>
            <p className="font-serif text-lg text-cream/50">Nessun materiale</p>
            <p className="text-xs text-cream/30 mt-1 mb-4">
              Carica slide, PDF e video per i tuoi studenti
            </p>
            <button onClick={() => setView('nuovo')}
              className="px-5 py-2 border border-doc-acc/25 rounded-full
                         text-xs text-doc-acc hover:bg-doc-acc/5 transition-colors">
              + Primo materiale
            </button>
          </div>
        ) : materiali.map(m => (
          <div key={m.id}
            className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center
                               flex-shrink-0 ${tipoColor[m.tipo as TipoMateriale]}`}>
                {tipoIcon[m.tipo as TipoMateriale]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-cream truncate">{m.titolo}</p>
                <p className="text-[11px] text-cream/40 mt-0.5 truncate">
                  {m.lezione?.corso?.titolo} · Lez. #{m.lezione?.numero}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-cream/30">
                  <span>{formatData(m.created_at)}</span>
                  {m.dimensione_bytes && <span>{formatBytes(m.dimensione_bytes)}</span>}
                  <span className={`px-2 py-0.5 rounded-full border text-[9px]
                    ${m.visibilita === 'immediata'
                      ? 'bg-success/10 border-success/20 text-success'
                      : 'bg-white/5 border-white/10 text-cream/30'}`}>
                    {m.visibilita === 'immediata' ? '🔓 Visibile' : '🔒 Dopo lezione'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <a href={m.url} target="_blank" rel="noopener noreferrer"
                className="flex-1 h-9 bg-doc-acc/10 border border-doc-acc/20
                           rounded-[10px] text-[12px] text-doc-acc
                           flex items-center justify-center gap-1.5
                           hover:bg-doc-acc/15 transition-colors">
                🔗 Apri
              </a>
              <button onClick={() => elimina(m.id)}
                className="h-9 px-3 bg-danger/10 border border-danger/20
                           rounded-[10px] text-[12px] text-danger
                           hover:bg-danger/15 transition-colors">
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
