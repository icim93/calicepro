'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { labelLivello, normalizeOne } from '@/lib/utils'
import { Plus } from 'lucide-react'

type Corso = {
  id: string
  titolo: string
  livello: string
  stato: string
  quota_euro: number
  capienza_max: number
  docente: { nome: string; cognome: string } | null
  iscrizioni: { count: number }[]
}

type CorsoRow = Omit<Corso, 'docente'> & {
  docente: NonNullable<Corso['docente']> | NonNullable<Corso['docente']>[]
}

export default function AdminCorsi() {
  const router = useRouter()
  const supabase = createClient()
  const [corsi, setCorsi] = useState<Corso[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('tutti')

  useEffect(() => {
    supabase
      .from('corsi')
      .select('*, docente:utenti!corsi_docente_id_fkey(nome,cognome), iscrizioni(count)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const rows = ((data as CorsoRow[] | null) ?? []).map((item) => ({
          ...item,
          docente: normalizeOne(item.docente),
        }))
        setCorsi(rows)
        setLoading(false)
      })
  }, [])

  const filtrati = corsi.filter((corso) => filtro === 'tutti' || corso.stato === filtro)

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <h1 className="font-serif text-2xl text-cream">Corsi</h1>
        <button
          onClick={() => router.push('/dashboard/admin/corsi/nuovo')}
          className="flex items-center gap-1.5 h-9 px-4 bg-adm-l rounded-xl text-[11px]
                     font-semibold text-cream tracking-wider border border-adm-acc/20"
        >
          <Plus size={14} /> Nuovo
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3">
        {['tutti', 'attivo', 'aperto', 'chiuso', 'bozza'].map((value) => (
          <button
            key={value}
            onClick={() => setFiltro(value)}
            className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${
              filtro === value ? 'border-adm-acc text-adm-acc bg-adm-acc/10' : 'border-white/10 text-cream/40'
            }`}
          >
            {value === 'tutti' ? `Tutti (${corsi.length})` : value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6">
        {loading ? (
          <p className="text-center py-12 text-cream/30 text-sm">Caricamento...</p>
        ) : filtrati.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3 opacity-30">Corsi</p>
            <p className="font-serif text-lg text-cream/50">Nessun corso</p>
            <p className="text-xs text-cream/30 mt-1">Crea il primo corso con il pulsante Nuovo</p>
          </div>
        ) : (
          filtrati.map((corso) => {
            const iscritti = corso.iscrizioni?.[0]?.count ?? 0
            const progress = corso.capienza_max > 0 ? Math.min(100, (iscritti / corso.capienza_max) * 100) : 0

            return (
              <div
                key={corso.id}
                className="mb-3 rounded-[18px] overflow-hidden border border-white/[0.055] bg-surf2"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-serif text-base text-cream">{corso.titolo}</p>
                    <span className="text-xs text-gold">EUR {corso.quota_euro}</span>
                  </div>
                  <p className="text-xs text-cream/40 mb-2">
                    {labelLivello(corso.livello)} - {corso.docente ? `Prof. ${corso.docente.cognome}` : 'Docente non assegnato'} - {iscritti}/{corso.capienza_max} posti
                  </p>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-adm-acc/60 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        corso.stato === 'attivo'
                          ? 'bg-success/10 text-success'
                          : corso.stato === 'aperto'
                            ? 'bg-warning/10 text-warning'
                            : corso.stato === 'chiuso'
                              ? 'bg-white/5 text-cream/40'
                              : 'bg-white/5 text-cream/30'
                      }`}
                    >
                      {corso.stato === 'attivo' ? 'In corso' : corso.stato === 'aperto' ? 'Iscrizioni aperte' : corso.stato === 'chiuso' ? 'Concluso' : 'Bozza'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
