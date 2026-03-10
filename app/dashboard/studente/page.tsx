// app/dashboard/studente/page.tsx
import { requireRuolo } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatData, percentuale, labelLivello, normalizeOne } from '@/lib/utils'
import Link from 'next/link'
import { Bell, BookOpen, ClipboardCheck, GlassWater, Receipt } from 'lucide-react'

export default async function StudenteHome() {
  const utente = await requireRuolo(['studente'])
  const supabase = createServerSupabaseClient()

  // Iscrizioni attive
  const { data: iscrizioni } = await supabase
    .from('iscrizioni')
    .select(`*, corso:corsi(*, docente:utenti!corsi_docente_id_fkey(nome,cognome))`)
    .eq('studente_id', utente.id)
    .eq('stato', 'approvata')

  const iscrizioniNormalizzate =
    (iscrizioni ?? []).map((item) => ({
      ...item,
      corso: normalizeOne(item.corso),
    }))

  // Prossima lezione
  const corsiIds = iscrizioniNormalizzate.map((item) => item.corso_id)
  const { data: prossima } = corsiIds.length ? await supabase
    .from('lezioni')
    .select('*, corso:corsi(titolo,livello)')
    .in('corso_id', corsiIds)
    .gte('data', new Date().toISOString().split('T')[0])
    .order('data', { ascending: true })
    .limit(1)
    .single() : { data: null }

  // Presenze totali (tutte le lezioni passate)
  const { count: presenzeCount } = await supabase
    .from('presenze')
    .select('*', { count: 'exact', head: true })
    .eq('studente_id', utente.id)
    .eq('stato', 'presente')

  // Degustazioni
  const { count: deguCount } = await supabase
    .from('degustazioni')
    .select('*', { count: 'exact', head: true })
    .eq('studente_id', utente.id)

  // Pagamenti in scadenza
  const { data: pagamenti } = await supabase
    .from('pagamenti')
    .select('*')
    .eq('studente_id', utente.id)
    .in('stato', ['da_pagare', 'in_ritardo'])
    .order('scadenza', { ascending: true })
    .limit(1)

  const corsoCorrente = iscrizioniNormalizzate[0]?.corso
  const lezioniTotali = corsoCorrente?.num_lezioni ?? 0

  return (
    <div className="px-0">
      {/* HERO CORSO */}
      {corsoCorrente ? (
        <div className="mx-4 mb-4 rounded-[18px] overflow-hidden
                        bg-gradient-to-br from-bx/30 via-bx-d/40 to-dark
                        border border-gold/14 p-5">
          <div className="flex items-start justify-between mb-3">
            <span className="badge badge-gold">{labelLivello(corsoCorrente.livello)}</span>
            <Link href="/dashboard/studente/corsi">
              <Bell className="w-5 h-5 text-cream/30 hover:text-cream/60 transition-colors" />
            </Link>
          </div>
          <h2 className="font-serif text-2xl text-cream mb-1">{corsoCorrente.titolo}</h2>
          <p className="text-xs text-cream/50 mb-4">
            {corsoCorrente.docente?.nome} {corsoCorrente.docente?.cognome}
          </p>
          <div className="progress-track mb-2">
            <div className="progress-fill bg-gold-gradient"
              style={{ '--progress-w': `${percentuale(presenzeCount ?? 0, lezioniTotali)}%` } as React.CSSProperties} />
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-cream/50">Progresso corso</span>
            <span className="text-gold">{presenzeCount ?? 0}/{lezioniTotali} lezioni</span>
          </div>
        </div>
      ) : (
        <div className="mx-4 mb-4 rounded-[18px] border border-white/[0.055] p-5 text-center">
          <p className="font-serif text-xl text-cream mb-2">Nessun corso attivo</p>
          <p className="text-xs text-cream/40 mb-3">Iscriviti a un corso per iniziare</p>
          <Link href="/dashboard/studente/corsi"
            className="inline-flex items-center gap-2 text-xs text-gold border border-gold/20
                       px-4 py-2 rounded-full hover:bg-gold/5 transition-colors">
            Esplora corsi disponibili
          </Link>
        </div>
      )}

      {/* PROSSIMA LEZIONE */}
      {prossima && (
        <>
          <p className="section-label text-gold-d">Prossima lezione</p>
          <Link href="/dashboard/studente/corsi"
            className="mx-4 mb-4 block rounded-[18px] border border-white/[0.055] p-4
                       bg-surf2 hover:border-gold/20 transition-all active:scale-[0.98]">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-bx/25 border border-gold/14
                              flex flex-col items-center justify-center flex-shrink-0">
                <span className="font-serif text-xl text-gold leading-none">
                  {new Date(prossima.data).getDate()}
                </span>
                <span className="text-[8px] text-gold/50 uppercase tracking-wider">
                  {new Date(prossima.data).toLocaleDateString('it', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cream truncate">{prossima.titolo}</p>
                <p className="text-xs text-cream/50 mt-0.5">
                  {prossima.corso?.titolo} · {prossima.ora_inizio?.slice(0,5)}
                </p>
                {prossima.sede && (
                  <p className="text-xs text-cream/30 mt-0.5 truncate">📍 {prossima.sede}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-cream/20 flex-shrink-0 mt-1" />
            </div>
          </Link>
        </>
      )}

      {/* QUICK ACTIONS */}
      <p className="section-label text-gold-d">Accesso rapido</p>
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        {[
          { href: '/dashboard/studente/corsi',        icon: <BookOpen size={18}/>,       label: 'I miei corsi',    sub: `${iscrizioniNormalizzate.length} iscrizioni` },
          { href: '/dashboard/studente/degustazione',  icon: <GlassWater size={18}/>,     label: 'Cellar Book',     sub: `${deguCount ?? 0} degustazioni` },
          { href: '/dashboard/studente/quiz',          icon: <ClipboardCheck size={18}/>, label: 'Simulatore Quiz', sub: 'Preparati all\'esame' },
          { href: '/dashboard/studente/pagamenti',     icon: <Receipt size={18}/>,        label: 'Pagamenti',       sub: pagamenti?.[0] ? `⚠ Rata in scadenza` : 'In regola ✓' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4
                       hover:border-gold/20 transition-all active:scale-[0.98]">
            <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center
                            text-gold mb-3">
              {item.icon}
            </div>
            <p className="text-[13px] font-medium text-cream">{item.label}</p>
            <p className="text-[10px] text-cream/40 mt-0.5">{item.sub}</p>
          </Link>
        ))}
      </div>

      {/* KPI */}
      <p className="section-label text-gold-d">Le tue statistiche</p>
      <div className="grid grid-cols-3 gap-2 px-4 mb-6">
        {[
          { n: deguCount ?? 0,      l: 'Degu',     c: 'text-gold' },
          { n: `${presenzeCount ?? 0}/${lezioniTotali}`, l: 'Presenze', c: 'text-success' },
          { n: iscrizioniNormalizzate.length, l: 'Corsi', c: 'text-doc-acc' },
        ].map(k => (
          <div key={k.l} className="bg-surf2 border border-white/[0.055] rounded-[14px] p-3 text-center">
            <p className={`font-serif text-2xl ${k.c}`}>{k.n}</p>
            <p className="text-[9px] text-cream/40 uppercase tracking-[0.5px] mt-1">{k.l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
}
