// lib/auth.ts
import { createServerSupabaseClient } from './supabase/server'
import { type Ruolo, type Utente } from '@/types'
import { redirect } from 'next/navigation'

// Ottieni l'utente corrente (server-side)
export async function getUtenteCorrente(): Promise<Utente | null> {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profilo } = await supabase
    .from('utenti')
    .select('*')
    .eq('id', user.id)
    .single()

  return profilo as Utente | null
}

// Redirect se non autenticato
export async function requireAuth(): Promise<Utente> {
  const utente = await getUtenteCorrente()
  if (!utente) redirect('/auth/login')
  return utente
}

// Redirect se non ha il ruolo richiesto
export async function requireRuolo(ruoli: Ruolo[]): Promise<Utente> {
  const utente = await requireAuth()
  if (!ruoli.includes(utente.ruolo)) {
    redirect('/dashboard/' + utente.ruolo)
  }
  return utente
}

// Rotta dashboard in base al ruolo
export function dashboardPerRuolo(ruolo: Ruolo): string {
  return `/dashboard/${ruolo}`
}

// Label ruolo in italiano
export function labelRuolo(ruolo: Ruolo): string {
  const map: Record<Ruolo, string> = {
    studente: 'Studente',
    docente: 'Docente',
    direttore: 'Direttore di Corso',
    admin: 'Amministratore',
  }
  return map[ruolo]
}

// Colore accent per ruolo
export function coloreRuolo(ruolo: Ruolo): string {
  const map: Record<Ruolo, string> = {
    studente: '#C9A24A',   // gold
    docente:  '#5ABCD4',   // teal
    direttore:'#5AC484',   // green
    admin:    '#8A7FD4',   // indigo
  }
  return map[ruolo]
}
