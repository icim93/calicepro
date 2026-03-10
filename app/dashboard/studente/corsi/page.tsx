'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatData, labelLivello, normalizeOne } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'

type Iscrizione = {
  id: string
  stato: string
  created_at: string
  corso: {
    id: string
    titolo: string
    livello: string
    stato: string
    sede: string
    data_inizio: string
    num_lezioni: number
    quota_euro: number
    docente: { nome: string; cognome: string }
  }
}

type CorsoAperto = {
  id: string
  titolo: string
  livello: string
  stato: string
  sede: string
  data_inizio: string
  num_lezioni: number
  quota_euro: number
  capienza_max: number
  docente: { nome: string; cognome: string }
  iscrizioni: { count: number }[]
}

type IscrizioneRow = Omit<Iscrizione, 'corso'> & {
  corso: Iscrizione['corso'] | Iscrizione['corso'][]
}

type CorsoApertoRow = Omit<CorsoAperto, 'docente'> & {
  docente: CorsoAperto['docente'] | CorsoAperto['docente'][]
}

const badgeStato: Record<string, string> = {
  in_attesa: 'bg-warning/15 text-warning',
  approvata: 'bg-success/15 text-success',
  rifiutata: 'bg-danger/15 text-danger',
  sospesa: 'bg-white/5 text-cream/40',
}

const labelStato: Record<string, string> = {
  in_attesa: 'In attesa',
  approvata: 'Approvata',
  rifiutata: 'Rifiutata',
  sospesa: 'Sospesa',
}

export default function StudenteCorsi() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'miei' | 'esplora'>('miei')
  const [iscrizioni, setIscrizioni] = useState<Iscrizione[]>([])
  const [corsiAperti, setCorsiAperti] = useState<CorsoAperto[]>([])
  const [loading, setLoading] = useState(true)
  const [iscrivendo, setIscrivendo] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)
      void loadAll(user.id)
    })
  }, [])

  async function loadAll(uid: string) {
    setLoading(true)

    const [{ data: isc }, { data: aperti }] = await Promise.all([
      supabase
        .from('iscrizioni')
        .select(`
          *,
          corso:corsi(
            id, titolo, livello, stato, sede, data_inizio,
            num_lezioni, quota_euro,
            docente:utenti!corsi_docente_id_fkey(nome,cognome)
          )
        `)
        .eq('studente_id', uid)
        .order('created_at', { ascending: false }),
      supabase
        .from('corsi')
        .select(`
          id, titolo, livello, stato, sede, data_inizio,
          num_lezioni, quota_euro, capienza_max,
          docente:utenti!corsi_docente_id_fkey(nome,cognome),
          iscrizioni(count)
        `)
        .eq('stato', 'aperto')
        .order('data_inizio', { ascending: true }),
    ])

    setIscrizioni(
      ((isc as IscrizioneRow[] | null) ?? []).map((item) => ({
        ...item,
        corso: normalizeOne(item.corso)!,
      }))
    )
    setCorsiAperti(
      ((aperti as CorsoApertoRow[] | null) ?? []).map((item) => ({
        ...item,
        docente: normalizeOne(item.docente)!,
      }))
    )
    setLoading(false)
  }

  async function iscriviti(corsoId: string) {
    if (!userId) return

    setIscrivendo(corsoId)
    await supabase.from('iscrizioni').insert({
      corso_id: corsoId,
      studente_id: userId,
      stato: 'in_attesa',
    })
    await loadAll(userId)
    setIscrivendo(null)
  }

  const giaIscritto = (corsoId: string) => iscrizioni.some((item) => item.corso?.id === corsoId)

  return (
    <div className="min-h-screen pb-10">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                     flex items-center justify-center text-cream/60"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-serif text-2xl text-cream">Corsi</h1>
      </div>

      <div className="flex gap-1 mx-4 mb-4 p-1 bg-surf2 border border-white/[0.055] rounded-[14px]">
        {(['miei', 'esplora'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`flex-1 py-2 rounded-[10px] text-[12px] font-medium transition-all
              ${
                tab === value
                  ? 'bg-gold/15 text-gold border border-gold/20'
                  : 'text-cream/40 hover:text-cream/60'
              }`}
          >
            {value === 'miei' ? `Le mie iscrizioni (${iscrizioni.length})` : 'Esplora corsi'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      ) : tab === 'miei' ? (
        <div className="px-4 flex flex-col gap-3">
          {iscrizioni.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3 opacity-30">Corsi</p>
              <p className="font-serif text-lg text-cream/50">Nessuna iscrizione</p>
              <p className="text-xs text-cream/30 mt-1 mb-4">
                Esplora i corsi disponibili e iscriviti
              </p>
              <button
                onClick={() => setTab('esplora')}
                className="px-5 py-2 border border-gold/25 rounded-full
                           text-xs text-gold hover:bg-gold/5 transition-colors"
              >
                Esplora corsi
              </button>
            </div>
          ) : (
            iscrizioni.map((item) => (
              <div key={item.id} className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="badge badge-gold">{labelLivello(item.corso?.livello)}</span>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${badgeStato[item.stato]}`}>
                    {labelStato[item.stato]}
                  </span>
                </div>
                <p className="font-serif text-lg text-cream mb-1">{item.corso?.titolo}</p>
                <p className="text-[11px] text-cream/40 mb-3">
                  Prof. {item.corso?.docente?.cognome} - {item.corso?.sede}
                </p>
                <div className="flex items-center justify-between text-[10px] text-cream/30">
                  <span>{formatData(item.corso?.data_inizio)}</span>
                  <span>{item.corso?.num_lezioni} lezioni</span>
                  <span>EUR {item.corso?.quota_euro}</span>
                </div>
                {item.stato === 'approvata' && (
                  <div
                    className="mt-3 w-full h-9 bg-gold/10 border border-gold/20 rounded-[10px]
                               text-[12px] text-gold flex items-center justify-center"
                  >
                    Iscrizione confermata
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3">
          {corsiAperti.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3 opacity-30">Ricerca</p>
              <p className="font-serif text-lg text-cream/50">Nessun corso disponibile</p>
              <p className="text-xs text-cream/30 mt-1">
                Al momento non ci sono corsi con iscrizioni aperte
              </p>
            </div>
          ) : (
            corsiAperti.map((corso) => {
              const iscritti = corso.iscrizioni?.[0]?.count ?? 0
              const pct = Math.min(100, (iscritti / corso.capienza_max) * 100)
              const isGiaIscritto = giaIscritto(corso.id)
              const esaurito = iscritti >= corso.capienza_max

              return (
                <div key={corso.id} className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="badge badge-gold">{labelLivello(corso.livello)}</span>
                    {esaurito && (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-danger/10 text-danger font-medium">
                        Esaurito
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-lg text-cream mb-1">{corso.titolo}</p>
                  <p className="text-[11px] text-cream/40 mb-3">
                    Prof. {corso.docente?.cognome} - {corso.sede}
                  </p>

                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-cream/30 mb-1">
                      <span>Posti disponibili</span>
                      <span>
                        {iscritti}/{corso.capienza_max}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-gold/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-cream/30 mb-3">
                    <span>{formatData(corso.data_inizio)}</span>
                    <span>{corso.num_lezioni} lezioni</span>
                    <span className="text-gold font-medium">EUR {corso.quota_euro}</span>
                  </div>

                  <button
                    onClick={() => !isGiaIscritto && !esaurito && void iscriviti(corso.id)}
                    disabled={isGiaIscritto || esaurito || iscrivendo === corso.id}
                    className={`w-full h-10 rounded-[10px] text-[12px] font-medium
                      transition-all active:scale-[0.97] disabled:opacity-50
                      ${
                        isGiaIscritto
                          ? 'bg-success/10 border border-success/20 text-success'
                          : esaurito
                            ? 'bg-white/5 border border-white/[0.07] text-cream/30'
                            : 'bg-gold/15 border border-gold/25 text-gold hover:bg-gold/20'
                      }`}
                  >
                    {iscrivendo === corso.id ? 'Invio richiesta...' : isGiaIscritto ? 'Gia iscritto' : esaurito ? 'Corso esaurito' : 'Richiedi iscrizione'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
