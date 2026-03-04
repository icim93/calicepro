'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft } from 'lucide-react'

const LIVELLI = [
  { value: '1_livello', label: '1° Livello' },
  { value: '2_livello', label: '2° Livello' },
  { value: '3_livello', label: '3° Livello' },
  { value: 'master',    label: 'Master' },
]

export default function NuovoCorso() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    titolo: '',
    livello: '1_livello',
    sede: '',
    delegazione: 'Bari',
    data_inizio: '',
    data_fine: '',
    num_lezioni: 10,
    capienza_max: 20,
    quota_euro: '',
    num_rate: 2,
    docente_id: '',
    direttore_id: '',
    stato: 'bozza',
  })

  function set(k: string, v: unknown) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function salva() {
    if (!form.titolo || !form.sede || !form.data_inizio || !form.quota_euro) {
      setError('Compila tutti i campi obbligatori')
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('corsi').insert({
      ...form,
      quota_euro: parseFloat(form.quota_euro as string),
      docente_id:   form.docente_id   || null,
      direttore_id: form.direttore_id || null,
    })
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/dashboard/admin/corsi')
    router.refresh()
  }

  return (
    <div className="min-h-screen pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                     flex items-center justify-center text-cream/60
                     hover:text-cream transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-serif text-2xl text-cream">Nuovo Corso</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">

        {/* SEZIONE: Informazioni base */}
        <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
          <p className="text-[10px] text-adm-acc/60 uppercase tracking-[0.5px] mb-3">Informazioni base</p>

          <div className="flex flex-col gap-3">
            <div>
              <label className="field-label">Titolo corso *</label>
              <input value={form.titolo} onChange={e => set('titolo', e.target.value)}
                placeholder="es. Corso Sommelier 1° Livello 2025"
                className="field-input" />
            </div>

            <div>
              <label className="field-label">Livello *</label>
              <div className="grid grid-cols-2 gap-2">
                {LIVELLI.map(l => (
                  <button key={l.value} onClick={() => set('livello', l.value)}
                    className={`py-2.5 rounded-[10px] text-xs border transition-all
                      ${form.livello === l.value
                        ? 'border-adm-acc bg-adm-acc/15 text-adm-acc'
                        : 'border-white/[0.07] text-cream/40 hover:border-white/15'}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label">Stato iniziale</label>
              <div className="flex gap-2">
                {['bozza', 'aperto'].map(s => (
                  <button key={s} onClick={() => set('stato', s)}
                    className={`flex-1 py-2 rounded-[10px] text-xs border transition-all
                      ${form.stato === s
                        ? 'border-adm-acc bg-adm-acc/15 text-adm-acc'
                        : 'border-white/[0.07] text-cream/40'}`}>
                    {s === 'bozza' ? 'Bozza' : 'Pubblica subito'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEZIONE: Sede & date */}
        <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
          <p className="text-[10px] text-adm-acc/60 uppercase tracking-[0.5px] mb-3">Sede & Date</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="field-label">Sede *</label>
              <input value={form.sede} onChange={e => set('sede', e.target.value)}
                placeholder="es. Hotel Palace, Bari"
                className="field-input" />
            </div>
            <div>
              <label className="field-label">Delegazione</label>
              <input value={form.delegazione} onChange={e => set('delegazione', e.target.value)}
                className="field-input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="field-label">Data inizio *</label>
                <input type="date" value={form.data_inizio} onChange={e => set('data_inizio', e.target.value)}
                  className="field-input" />
              </div>
              <div>
                <label className="field-label">Data fine</label>
                <input type="date" value={form.data_fine} onChange={e => set('data_fine', e.target.value)}
                  className="field-input" />
              </div>
            </div>
          </div>
        </div>

        {/* SEZIONE: Struttura */}
        <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
          <p className="text-[10px] text-adm-acc/60 uppercase tracking-[0.5px] mb-3">Struttura del corso</p>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="field-label">N° lezioni</label>
                <input type="number" min={1} max={50}
                  value={form.num_lezioni} onChange={e => set('num_lezioni', parseInt(e.target.value))}
                  className="field-input" />
              </div>
              <div>
                <label className="field-label">Capienza max</label>
                <input type="number" min={1} max={100}
                  value={form.capienza_max} onChange={e => set('capienza_max', parseInt(e.target.value))}
                  className="field-input" />
              </div>
            </div>
          </div>
        </div>

        {/* SEZIONE: Pagamento */}
        <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
          <p className="text-[10px] text-adm-acc/60 uppercase tracking-[0.5px] mb-3">Quota & Pagamento</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="field-label">Quota iscrizione (€) *</label>
              <input type="number" min={0} step={0.01}
                value={form.quota_euro} onChange={e => set('quota_euro', e.target.value)}
                placeholder="es. 450.00"
                className="field-input" />
            </div>
            <div>
              <label className="field-label">Numero rate</label>
              <div className="flex gap-2">
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => set('num_rate', n)}
                    className={`flex-1 py-2.5 rounded-[10px] text-sm border transition-all
                      ${form.num_rate === n
                        ? 'border-adm-acc bg-adm-acc/15 text-adm-acc font-medium'
                        : 'border-white/[0.07] text-cream/40'}`}>
                    {n === 1 ? 'Unica' : `${n} rate`}
                  </button>
                ))}
              </div>
            </div>
            {form.quota_euro && (
              <div className="bg-adm/20 border border-adm-acc/15 rounded-[10px] p-3">
                <p className="text-[11px] text-cream/50">
                  {form.num_rate === 1
                    ? `Pagamento unico: €${parseFloat(form.quota_euro as string).toFixed(2)}`
                    : `${form.num_rate} rate da €${(parseFloat(form.quota_euro as string) / form.num_rate).toFixed(2)}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ERRORE */}
        {error && (
          <div className="mx-0 px-4 py-3 bg-danger/10 border border-danger/20 rounded-[12px]">
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        {/* CTA */}
        <button onClick={salva} disabled={saving}
          className="w-full h-13 bg-adm-gradient border border-adm-acc/30
                     rounded-[14px] text-[13px] font-semibold text-cream
                     flex items-center justify-center gap-2
                     disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{ height: '52px' }}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
              Salvataggio...
            </span>
          ) : '✓ Crea corso'}
        </button>
      </div>
    </div>
  )
}