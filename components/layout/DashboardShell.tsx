'use client'
// components/layout/DashboardShell.tsx
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { type Utente, type Ruolo } from '@/types'
import { cn, iniziali } from '@/lib/utils'
import {
  Home, BookOpen, ClipboardCheck, FileText,
  BarChart2, Users, Upload, CreditCard, Award,
  LayoutGrid, ChevronRight
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

function navPerRuolo(ruolo: Ruolo, base: string): NavItem[] {
  if (ruolo === 'studente') return [
    { href: `${base}/studente`,            label: 'Home',      icon: <Home size={20} /> },
    { href: `${base}/studente/corsi`,      label: 'Corsi',     icon: <BookOpen size={20} /> },
    { href: `${base}/studente/degustazione`, label: 'Degu',    icon: <WineIcon /> },
    { href: `${base}/studente/quiz`,       label: 'Quiz',      icon: <ClipboardCheck size={20} /> },
  ]
  if (ruolo === 'docente') return [
    { href: `${base}/docente`,             label: 'Home',      icon: <Home size={20} /> },
    { href: `${base}/docente/calendario`,  label: 'Calendario',icon: <CalIcon /> },
    { href: `${base}/docente/materiali`,   label: 'Materiali', icon: <FileText size={20} /> },
    { href: `${base}/docente/vini`,        label: 'Vini',      icon: <WineIcon /> },
  ]
  if (ruolo === 'direttore') return [
    { href: `${base}/direttore`,           label: 'Home',      icon: <Home size={20} /> },
    { href: `${base}/direttore/presenze`,  label: 'Presenze',  icon: <ClipboardCheck size={20} /> },
    { href: `${base}/direttore/import`,    label: 'Import',    icon: <Upload size={20} /> },
    { href: `${base}/direttore/report`,    label: 'Report',    icon: <BarChart2 size={20} /> },
  ]
  if (ruolo === 'admin') return [
    { href: `${base}/admin`,               label: 'Dashboard', icon: <LayoutGrid size={20} /> },
    { href: `${base}/admin/corsi`,         label: 'Corsi',     icon: <BookOpen size={20} /> },
    { href: `${base}/admin/iscrizioni`,    label: 'Iscrizioni',icon: <Users size={20} /> },
    { href: `${base}/admin/pagamenti`,     label: 'Pagamenti', icon: <CreditCard size={20} /> },
    { href: `${base}/admin/diplomi`,       label: 'Diplomi',   icon: <Award size={20} /> },
  ]
  return []
}

const accentPerRuolo: Record<Ruolo, string> = {
  studente:  'text-gold   data-[active=true]:bg-gold/10',
  docente:   'text-doc-acc data-[active=true]:bg-doc-acc/10',
  direttore: 'text-dir-acc data-[active=true]:bg-dir-acc/10',
  admin:     'text-adm-acc data-[active=true]:bg-adm-acc/10',
}

const glowPerRuolo: Record<Ruolo, string> = {
  studente:  'rgba(92,16,32,0.45)',
  docente:   'rgba(26,74,92,0.45)',
  direttore: 'rgba(30,74,46,0.45)',
  admin:     'rgba(30,26,74,0.45)',
}

export default function DashboardShell({
  utente, children
}: { utente: Utente; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const nav = navPerRuolo(utente.ruolo, '/dashboard')

  async function logout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col max-w-[430px] mx-auto relative"
      style={{ background: `radial-gradient(ellipse 80% 35% at 50% 0%, ${glowPerRuolo[utente.ruolo]} 0%, transparent 55%), #09040A` }}>

      {/* TOP STATUS BAR */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0">
        <div>
          <p className="text-[10px] text-cream/40 tracking-[0.4px] mb-0.5">
            {labelRuolo(utente.ruolo)}
          </p>
          <h1 className="font-serif text-xl text-cream leading-tight">
            {utente.nome} {utente.cognome}
          </h1>
          {utente.delegazione && (
            <p className="text-[10px] text-cream/40">{utente.delegazione}</p>
          )}
        </div>
        <button
          onClick={logout}
          className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                     flex items-center justify-center
                     font-serif text-sm font-medium
                     hover:border-white/10 transition-colors"
          style={{ color: accentColor(utente.ruolo) }}
          title="Logout"
        >
          {iniziali(utente.nome, utente.cognome)}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {children}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]
                      h-20 bg-dark/96 border-t border-gold/[0.14]
                      flex items-center justify-around px-1 pb-4
                      backdrop-blur-2xl z-50">
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              data-active={active}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-3 rounded-[14px]',
                'transition-all duration-200 min-w-[52px] relative',
                accentPerRuolo[utente.ruolo],
                active ? 'opacity-100' : 'opacity-40 hover:opacity-60'
              )}
            >
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full
                                 bg-danger border-[1.5px] border-dark
                                 flex items-center justify-center
                                 text-[8px] font-bold text-white px-1">
                  {item.badge}
                </span>
              ) : null}
              {item.icon}
              <span className="text-[10px] font-normal tracking-[0.2px]">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function accentColor(ruolo: Ruolo): string {
  const m: Record<Ruolo, string> = {
    studente: '#C9A24A', docente: '#5ABCD4',
    direttore: '#5AC484', admin: '#8A7FD4',
  }
  return m[ruolo]
}

function labelRuolo(ruolo: Ruolo): string {
  const m: Record<Ruolo, string> = {
    studente: 'Studente', docente: 'Docente',
    direttore: 'Direttore di Corso', admin: 'Amministratore',
  }
  return m[ruolo]
}

function WineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 3 Q8 13 12 14 Q16 13 16 3Z"/>
      <line x1="12" y1="14" x2="12" y2="20"/>
      <line x1="9" y1="20" x2="15" y2="20"/>
    </svg>
  )
}

function CalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
