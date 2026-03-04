'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { labelLivello } from '@/lib/utils'
import { Plus, ChevronLeft } from 'lucide-react'

export default function AdminCorsi() {
  const router = useRouter()
  const supabase = createClient()
  const [corsi, setCorsi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('tutti')

  useEffect(() => {
    supabase.from('corsi')
      .select('*, docente:utenti!corsi_docente_id_fkey(nome,cognome), iscrizioni(count)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setCorsi(data ?? []); setLoading(false) })
  }, [])

  const filtrati = corsi.filter(c => filtro === 'tutti' || c.stato === filtro)

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <h1 className="font-serif text-2xl text-cream">Corsi</h1>
        <button onClick={() => router.push('/dashboard/admin/corsi/nuovo')}
          className="flex items-center gap-1.5 h-9 px-4 bg-adm-l rounded-xl text-[11px] font-semibold text-cream tracking-wider border border-adm-acc/20">
          <Plus size={14} /> Nuovo
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3">
        {['tutti','attivo','aperto','chiuso','bozza'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${filtro===f?'border-adm-acc text-adm-acc bg-adm-acc/10':'border-white/10 text-cream/40'}`}>
            {f==='tutti'?`Tutti (${corsi.length})`:f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6">
        {loading ? <p className="text-center py-12 text-cream/30 text-sm">Caricamento...</p>
        : filtrati.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3 opacity-30">📚</p>
            <p className="font-serif text-lg text-cream/50">Nessun corso</p>
            <p className="text-xs text-cream/30 mt-1">Crea il primo corso con il pulsante +</p>
          </div>
        ) : filtrati.map(corso => (
          <div key={corso.id} onClick={() => router.push(`/dashboard/admin/corsi/${corso.id}`)}
            className="mb-3 rounded-[18px] overflow-hidden border border-white/[0.055] cursor-pointer active:scale-[0.98] transition-all bg-surf2">
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <p className="font-serif text-base text-cream">{corso.titolo}</p>
                <span className="text-xs text-gold">€{corso.quota_euro}</span>
              </div>
              <p className="text-xs text-cream/40 mb-2">
                {labelLivello(corso.livello)} · {corso.docente?`Prof. ${corso.docente.cognome}`:'N.d.'} · {corso.iscrizioni?.[0]?.count??0}/{corso.capienza_max} posti
              </p>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-adm-acc/60 rounded-full" style={{width:`${Math.min(100,((corso.iscrizioni?.[0]?.count??0)/corso.capienza_max)*100)}%`}} />
              </div>
              <div className="flex gap-2 mt-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${corso.stato==='attivo'?'bg-success/10 text-success':corso.stato==='aperto'?'bg-warning/10 text-warning':corso.stato==='chiuso'?'bg-white/5 text-cream/40':'bg-white/5 text-cream/30'}`}>
                  {corso.stato==='attivo'?'In corso':corso.stato==='aperto'?'Iscrizioni aperte':corso.stato==='chiuso'?'Concluso':'Bozza'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}