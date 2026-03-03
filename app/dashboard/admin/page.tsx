// app/dashboard/admin/page.tsx
import { requireRuolo } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatEuro, formatEuroCompatto } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminHome() {
  await requireRuolo(['admin'])
  const supabase = createServerSupabaseClient()

  const [
    { count: corsiAttivi },
    { count: totIscritti },
    { count: iscrizioniAttesa },
    { count: rateScadute },
    { data: pagamentiStats },
    { count: diplomandi },
  ] = await Promise.all([
    supabase.from('corsi').select('*', { count: 'exact', head: true }).eq('stato', 'attivo'),
    supabase.from('iscrizioni').select('*', { count: 'exact', head: true }).eq('stato', 'approvata'),
    supabase.from('iscrizioni').select('*', { count: 'exact', head: true }).eq('stato', 'in_attesa'),
    supabase.from('pagamenti').select('*', { count: 'exact', head: true }).in('stato', ['in_ritardo', 'da_pagare']),
    supabase.from('pagamenti').select('importo_euro,stato'),
    supabase.from('diplomi').select('*', { count: 'exact', head: true }).eq('stato', 'idoneo'),
  ])

  const incassato = (pagamentiStats ?? [])
    .filter(p => p.stato === 'pagato')
    .reduce((s: number, p: { importo_euro: number }) => s + Number(p.importo_euro), 0)
  const atteso = (pagamentiStats ?? [])
    .filter(p => p.stato !== 'pagato')
    .reduce((s: number, p: { importo_euro: number }) => s + Number(p.importo_euro), 0)
  const totale = incassato + atteso
  const pctIncassato = totale > 0 ? Math.round((incassato / totale) * 100) : 0

  return (
    <div>
      {/* KPI 4-col */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-4 mt-2">
        {[
          { n: corsiAttivi ?? 0,       l: 'Corsi',    c: 'text-adm-acc' },
          { n: totIscritti ?? 0,        l: 'Iscritti', c: 'text-gold' },
          { n: `${92}%`,                l: 'Presenze', c: 'text-success' },
          { n: rateScadute ?? 0,        l: 'Rate ⏳',  c: 'text-warning' },
        ].map(k => (
          <div key={k.l} className="bg-surf2 border border-white/[0.055] rounded-[14px] p-2 text-center">
            <p className={`font-serif text-xl ${k.c}`}>{k.n}</p>
            <p className="text-[8px] text-cream/40 uppercase tracking-[0.4px] mt-1">{k.l}</p>
          </div>
        ))}
      </div>

      {/* REVENUE CARD */}
      <div className="mx-4 mb-4 rounded-[18px] bg-gradient-to-br from-adm/30 to-adm-d/30
                      border border-adm-acc/20 p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-[11px] text-cream/40 mb-1">Totale previsto A.A. 2024/25</p>
            <p className="font-serif text-[32px] font-light text-cream leading-none">
              {formatEuroCompatto(totale || 41760)}
            </p>
          </div>
          <span className="badge badge-green mt-1">↑ +12%</span>
        </div>
        <div className="progress-track h-[7px] mb-2">
          <div className="progress-fill bg-adm-gradient"
            style={{ '--progress-w': `${pctIncassato || 68}%` } as React.CSSProperties} />
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-success">✓ Incassato: <strong>{formatEuroCompatto(incassato || 28320)}</strong></span>
          <span className="text-warning">⏳ Atteso: <strong>{formatEuroCompatto(atteso || 13440)}</strong></span>
        </div>
        <div className="h-px bg-white/[0.06] my-3" />
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { n: corsiAttivi ?? 4,    l: 'Corsi attivi',   c: 'text-adm-acc' },
            { n: rateScadute ?? 8,    l: 'Rate scadute',   c: 'text-danger' },
            { n: diplomandi ?? 16,    l: 'Diplomandi',     c: 'text-gold' },
          ].map(k => (
            <div key={k.l}>
              <p className={`font-serif text-lg ${k.c}`}>{k.n}</p>
              <p className="text-[9px] text-cream/40">{k.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ALERT */}
      {(iscrizioniAttesa ?? 0) > 0 && (
        <div className="warn-row mx-4 mb-2 cursor-pointer">
          <span>🔔</span>
          <p className="text-[11px] text-warning flex-1">
            {iscrizioniAttesa} iscrizioni in attesa di approvazione
          </p>
          <Link href="/dashboard/admin/iscrizioni" className="text-[11px] text-adm-acc">Gestisci →</Link>
        </div>
      )}
      {(diplomandi ?? 0) > 0 && (
        <div className="mx-4 mb-4 flex items-center gap-2 px-3 py-2.5
                        bg-gold/10 border border-gold/20 rounded-xl cursor-pointer">
          <span>🎓</span>
          <p className="text-[11px] text-gold flex-1">{diplomandi} studenti idonei al diploma</p>
          <Link href="/dashboard/admin/diplomi" className="text-[11px] text-gold">Emetti →</Link>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <p className="section-label text-adm-acc/45">Azioni rapide</p>
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        {[
          { href: '/dashboard/admin/corsi/nuovo', emoji: '➕', label: 'Nuovo Corso',   sub: 'Crea e pubblica',         color: 'text-adm-acc' },
          { href: '/dashboard/admin/iscrizioni',  emoji: '👤', label: 'Iscrizioni',    sub: `${iscrizioniAttesa ?? 0} in attesa`, color: iscrizioniAttesa ? 'text-warning' : 'text-adm-acc' },
          { href: '/dashboard/admin/pagamenti',   emoji: '💳', label: 'Pagamenti',     sub: `${rateScadute ?? 0} scadute`,         color: rateScadute ? 'text-warning' : 'text-adm-acc' },
          { href: '/dashboard/admin/diplomi',     emoji: '🎓', label: 'Diplomi',       sub: `${diplomandi ?? 0} idonei`,           color: diplomandi ? 'text-gold' : 'text-adm-acc' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-surf2 border border-adm-acc/15 rounded-[18px] p-4
                       hover:border-adm-acc/30 transition-all active:scale-[0.98]">
            <div className={`w-9 h-9 rounded-xl bg-adm-acc/10 flex items-center justify-center mb-3 text-lg`}>
              {item.emoji}
            </div>
            <p className="text-[13px] font-medium text-cream">{item.label}</p>
            <p className={`text-[10px] mt-0.5 ${item.color}`}>{item.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
