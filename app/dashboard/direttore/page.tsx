// app/dashboard/direttore/page.tsx
import { requireRuolo } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatData, formatEuroCompatto, percentuale } from '@/lib/utils'
import Link from 'next/link'

export default async function DirettoreHome() {
  const utente = await requireRuolo(['direttore'])
  const supabase = createServerSupabaseClient()

  const { data: corsi } = await supabase
    .from('corsi')
    .select('*, iscrizioni(count)')
    .eq('direttore_id', utente.id)
    .in('stato', ['attivo', 'aperto'])

  const corsiIds = (corsi ?? []).map(c => c.id)

  // Prossima lezione
  const { data: prossima } = corsiIds.length ? await supabase
    .from('lezioni')
    .select('*, corso:corsi(titolo,docente:utenti!corsi_docente_id_fkey(nome,cognome))')
    .in('corso_id', corsiIds)
    .gte('data', new Date().toISOString().split('T')[0])
    .order('data', { ascending: true })
    .limit(1).single() : { data: null }

  // Studenti sotto soglia presenze (< 75%)
  const { data: sottoSoglia } = corsiIds.length ? await supabase.rpc('studenti_sotto_soglia', {
    p_corso_ids: corsiIds
  }) : { data: [] }

  // Pagamenti in ritardo
  const { count: pagRitardo } = await supabase
    .from('pagamenti')
    .select('*', { count: 'exact', head: true })
    .in('corso_id', corsiIds.length ? corsiIds : ['none'])
    .in('stato', ['in_ritardo', 'da_pagare'])

  // Iscrizioni in attesa
  const { count: iscrizioniAttesa } = await supabase
    .from('iscrizioni')
    .select('*', { count: 'exact', head: true })
    .in('corso_id', corsiIds.length ? corsiIds : ['none'])
    .eq('stato', 'in_attesa')

  const totStudenti = (corsi ?? []).reduce((s, c) => s + (c.iscrizioni?.[0]?.count ?? 0), 0)
  const sottoSogliaCount = (sottoSoglia as unknown[])?.length ?? 0

  return (
    <div>
      {/* KPI */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4 mt-2">
        {[
          { n: corsi?.length ?? 0,  l: 'Corsi',       c: 'text-dir-acc' },
          { n: totStudenti,          l: 'Corsisti',     c: 'text-gold' },
          { n: sottoSogliaCount,     l: 'Sotto soglia', c: sottoSogliaCount > 0 ? 'text-warning' : 'text-success' },
        ].map(k => (
          <div key={k.l} className="bg-surf2 border border-white/[0.055] rounded-[14px] p-3 text-center">
            <p className={`font-serif text-2xl ${k.c}`}>{k.n}</p>
            <p className="text-[9px] text-cream/40 uppercase tracking-[0.5px] mt-1">{k.l}</p>
          </div>
        ))}
      </div>

      {/* ALERT */}
      {sottoSogliaCount > 0 && (
        <div className="warn-row mx-4 mb-3 cursor-pointer" onClick={() => {}}>
          <span className="text-sm">⚠️</span>
          <p className="text-[11px] text-warning flex-1">
            {sottoSogliaCount} studenti sotto la soglia del 75% di presenze
          </p>
          <Link href="/dashboard/direttore/report" className="text-[11px] text-dir-acc">Report →</Link>
        </div>
      )}

      {/* PROSSIMA LEZIONE */}
      {prossima && (
        <>
          <p className="section-label" style={{ color: 'rgba(90,196,132,0.5)' }}>Prossima lezione da gestire</p>
          <Link href={`/dashboard/direttore/presenze?lezione=${prossima.id}`}
            className="mx-4 mb-4 block rounded-[18px]
                       bg-gradient-to-br from-dir/30 to-dir-d/30
                       border border-dir-acc/20 p-5
                       hover:border-dir-acc/40 transition-all active:scale-[0.98]">
            <div className="flex justify-between items-start mb-2">
              <span className="badge badge-dir">
                <span className="dot-live bg-dir-acc w-1.5 h-1.5 mr-1"></span>
                {formatData(prossima.data)}
              </span>
              <span className="text-[11px] text-cream/40">{prossima.ora_inizio?.slice(0,5)}</span>
            </div>
            <p className="font-serif text-xl text-cream mb-1">{prossima.titolo}</p>
            <p className="text-xs text-cream/50 mb-4">
              {prossima.corso?.titolo} · Prof. {prossima.corso?.docente?.cognome}
            </p>
            <div className="flex gap-2">
              <Link href={`/dashboard/direttore/presenze?lezione=${prossima.id}`}
                onClick={e => e.stopPropagation()}
                className="flex-1 h-9 bg-dir-acc/15 border border-dir-acc/20 rounded-[10px]
                           flex items-center justify-center text-[11px] text-dir-acc font-medium
                           hover:bg-dir-acc/20 transition-colors">
                ✓ Gestisci presenze
              </Link>
              <Link href="/dashboard/direttore/comunicazioni"
                onClick={e => e.stopPropagation()}
                className="flex-1 h-9 bg-white/5 border border-white/[0.07] rounded-[10px]
                           flex items-center justify-center text-[11px] text-cream/60
                           hover:bg-white/[0.08] transition-colors">
                📩 Comunica
              </Link>
            </div>
          </Link>
        </>
      )}

      {/* AZIONI RAPIDE */}
      <p className="section-label" style={{ color: 'rgba(90,196,132,0.5)' }}>Azioni rapide</p>
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        {[
          { href: '/dashboard/direttore/import',        emoji: '📊', label: 'Import Corsisti',   sub: 'Excel / CSV', color: 'bg-dir-acc/10 text-dir-acc' },
          { href: '/dashboard/direttore/report',         emoji: '📈', label: 'Report Presenze',   sub: `${sottoSogliaCount} sotto soglia`, color: sottoSogliaCount > 0 ? 'bg-warning/10 text-warning' : 'bg-dir-acc/10 text-dir-acc' },
          { href: '/dashboard/direttore/comunicazioni',  emoji: '📩', label: 'Comunicazioni',     sub: 'Avvisi al gruppo', color: 'bg-dir-acc/10 text-dir-acc' },
          { href: '/dashboard/direttore/pagamenti',      emoji: '💰', label: 'Pagamenti',         sub: `${pagRitardo ?? 0} in ritardo`, color: pagRitardo ? 'bg-warning/10 text-warning' : 'bg-dir-acc/10 text-dir-acc' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-surf2 border border-dir-acc/15 rounded-[18px] p-4
                       hover:border-dir-acc/30 transition-all active:scale-[0.98]">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-lg ${item.color}`}>
              {item.emoji}
            </div>
            <p className="text-[13px] font-medium text-cream">{item.label}</p>
            <p className={`text-[10px] mt-0.5 ${item.color.includes('warning') ? 'text-warning' : 'text-cream/40'}`}>
              {item.sub}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
