// app/dashboard/direttore/page.tsx
import { requireRuolo } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatData, labelLivello } from '@/lib/utils'
import Link from 'next/link'

export default async function DirettoreHome() {
  const utente = await requireRuolo(['direttore'])
  const supabase = createServerSupabaseClient()

  // Corsi assegnati al direttore
  const { data: corsi } = await supabase
    .from('corsi')
    .select(`
      *,
      docente:utenti!corsi_docente_id_fkey(nome,cognome),
      iscrizioni(count)
    `)
    .eq('direttore_id', utente.id)
    .in('stato', ['attivo', 'aperto', 'chiuso'])
    .order('data_inizio', { ascending: false })

  const corsoAttivo = corsi?.find(c => c.stato === 'attivo')
  const corsiIds = (corsi ?? []).map(c => c.id)

  // Prossima lezione
  const { data: prossima } = corsiIds.length ? await supabase
    .from('lezioni')
    .select('*, corso:corsi(titolo,livello)')
    .in('corso_id', corsiIds)
    .gte('data', new Date().toISOString().split('T')[0])
    .order('data', { ascending: true })
    .limit(1)
    .single() : { data: null }

  // Presenze oggi
  const oggi = new Date().toISOString().split('T')[0]
  const { data: lezioniOggi } = await supabase
    .from('lezioni')
    .select('id')
    .in('corso_id', corsiIds.length ? corsiIds : ['none'])
    .eq('data', oggi)

  const lezioniOggiIds = (lezioniOggi ?? []).map(l => l.id)

  const { count: presenzeOggi } = await supabase
    .from('presenze')
    .select('*', { count: 'exact', head: true })
    .in('lezione_id', lezioniOggiIds.length ? lezioniOggiIds : ['none'])
    .eq('stato', 'presente')

  // Iscrizioni in attesa sui corsi del direttore
  const { count: iscrizioniAttesa } = await supabase
    .from('iscrizioni')
    .select('*', { count: 'exact', head: true })
    .in('corso_id', corsiIds.length ? corsiIds : ['none'])
    .eq('stato', 'in_attesa')

  // Totale studenti iscritti
  const totStudenti = (corsi ?? []).reduce(
    (s, c) => s + (c.iscrizioni?.[0]?.count ?? 0), 0
  )

  return (
    <div>
      {/* KPI */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-4 mt-2">
        {[
          { n: corsi?.length ?? 0,   l: 'Corsi',    c: 'text-dir-acc' },
          { n: totStudenti,           l: 'Studenti',  c: 'text-gold'    },
          { n: presenzeOggi ?? 0,    l: 'Oggi',      c: 'text-success' },
          { n: iscrizioniAttesa ?? 0, l: 'Attesa',   c: iscrizioniAttesa ? 'text-warning' : 'text-dir-acc' },
        ].map(k => (
          <div key={k.l}
            className="bg-surf2 border border-white/[0.055] rounded-[14px] p-2 text-center">
            <p className={`font-serif text-xl ${k.c}`}>{k.n}</p>
            <p className="text-[8px] text-cream/40 uppercase tracking-[0.4px] mt-1">{k.l}</p>
          </div>
        ))}
      </div>

      {/* CORSO ATTIVO */}
      {corsoAttivo && (
        <>
          <p className="section-label" style={{ color: 'rgba(90,196,132,0.5)' }}>
            Corso in corso
          </p>
          <div className="mx-4 mb-4 rounded-[18px] bg-gradient-to-br from-dir/30 to-dir-d/30
                          border border-dir-acc/20 p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="badge badge-dir">{labelLivello(corsoAttivo.livello)}</span>
              <span className="text-[10px] text-dir-acc/60">
                {corsoAttivo.iscrizioni?.[0]?.count ?? 0}/{corsoAttivo.capienza_max} iscritti
              </span>
            </div>
            <p className="font-serif text-xl text-cream mb-1">{corsoAttivo.titolo}</p>
            <p className="text-[11px] text-cream/50 mb-4">
              Prof. {corsoAttivo.docente?.nome} {corsoAttivo.docente?.cognome}
              {corsoAttivo.sede && ` · ${corsoAttivo.sede}`}
            </p>
            {/* Progress iscritti */}
            <div className="progress-track mb-1">
              <div className="progress-fill bg-dir-gradient"
                style={{
                  '--progress-w': `${Math.min(100,
                    ((corsoAttivo.iscrizioni?.[0]?.count ?? 0) / corsoAttivo.capienza_max) * 100
                  )}%`
                } as React.CSSProperties} />
            </div>
            <div className="flex justify-between text-[10px] text-cream/30">
              <span>Capienza</span>
              <span>{corsoAttivo.capienza_max - (corsoAttivo.iscrizioni?.[0]?.count ?? 0)} posti liberi</span>
            </div>
          </div>
        </>
      )}

      {/* ALERT ISCRIZIONI */}
      {(iscrizioniAttesa ?? 0) > 0 && (
        <div className="warn-row mx-4 mb-3 cursor-pointer"
          style={{ borderColor: 'rgba(90,196,132,0.2)', backgroundColor: 'rgba(90,196,132,0.08)' }}>
          <span>🔔</span>
          <p className="text-[11px] text-dir-acc flex-1">
            {iscrizioniAttesa} iscrizioni in attesa di approvazione
          </p>
          <Link href="/dashboard/direttore/presenze"
            className="text-[11px] text-dir-acc">
            Gestisci →
          </Link>
        </div>
      )}

      {/* PROSSIMA LEZIONE */}
      {prossima && (
        <>
          <p className="section-label" style={{ color: 'rgba(90,196,132,0.5)' }}>
            Prossima lezione
          </p>
          <div className="mx-4 mb-4 bg-surf2 border border-white/[0.055]
                          rounded-[18px] p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-dir/25 border border-dir-acc/20
                              flex flex-col items-center justify-center flex-shrink-0">
                <span className="font-serif text-xl text-dir-acc leading-none">
                  {new Date(prossima.data).getDate()}
                </span>
                <span className="text-[8px] text-dir-acc/50 uppercase tracking-wider">
                  {new Date(prossima.data).toLocaleDateString('it', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-cream truncate">{prossima.titolo}</p>
                <p className="text-[11px] text-cream/50 mt-0.5">{prossima.corso?.titolo}</p>
                <p className="text-[11px] text-dir-acc/70 mt-0.5">
                  {prossima.ora_inizio?.slice(0,5)} – {prossima.ora_fine?.slice(0,5)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* QUICK ACTIONS */}
      <p className="section-label" style={{ color: 'rgba(90,196,132,0.5)' }}>
        Azioni rapide
      </p>
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        {[
          {
            href:  '/dashboard/direttore/presenze',
            emoji: '✅',
            label: 'Presenze',
            sub:   lezioniOggi?.length ? `${lezioniOggi.length} lezione oggi` : 'Gestisci presenze',
            color: 'text-dir-acc',
          },
          {
            href:  '/dashboard/direttore/import',
            emoji: '📥',
            label: 'Import',
            sub:   'Carica dati CSV',
            color: 'text-dir-acc',
          },
          {
            href:  '/dashboard/direttore/report',
            emoji: '📊',
            label: 'Report',
            sub:   'Statistiche corsi',
            color: 'text-dir-acc',
          },
          {
            href:  corsoAttivo ? `/dashboard/direttore/presenze?corso=${corsoAttivo.id}` : '/dashboard/direttore/presenze',
            emoji: '👥',
            label: 'Studenti',
            sub:   `${totStudenti} iscritti`,
            color: 'text-gold',
          },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-surf2 border border-dir-acc/15 rounded-[18px] p-4
                       hover:border-dir-acc/30 transition-all active:scale-[0.98]">
            <div className="w-9 h-9 rounded-xl bg-dir-acc/10
                            flex items-center justify-center mb-3 text-lg">
              {item.emoji}
            </div>
            <p className="text-[13px] font-medium text-cream">{item.label}</p>
            <p className={`text-[10px] mt-0.5 ${item.color}`}>{item.sub}</p>
          </Link>
        ))}
      </div>

      {/* LISTA CORSI */}
      {(corsi ?? []).length > 0 && (
        <>
          <p className="section-label" style={{ color: 'rgba(90,196,132,0.5)' }}>
            I tuoi corsi
          </p>
          <div className="mx-4 bg-surf2 border border-white/[0.055]
                          rounded-[18px] overflow-hidden mb-6">
            {(corsi ?? []).map((corso, i) => (
              <div key={corso.id}
                className={`flex items-center gap-3 p-4
                  ${i < (corsi ?? []).length - 1 ? 'border-b border-white/[0.055]' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-dir/25 border border-dir-acc/20
                                flex items-center justify-center text-sm flex-shrink-0">
                  🍷
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-cream truncate">{corso.titolo}</p>
                  <p className="text-[11px] text-cream/40">
                    {labelLivello(corso.livello)} ·{' '}
                    {corso.iscrizioni?.[0]?.count ?? 0} studenti ·{' '}
                    {formatData(corso.data_inizio)}
                  </p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full
                  ${corso.stato === 'attivo'  ? 'bg-success/10 text-success'
                  : corso.stato === 'aperto' ? 'bg-warning/10 text-warning'
                  : 'bg-white/5 text-cream/30'}`}>
                  {corso.stato}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}