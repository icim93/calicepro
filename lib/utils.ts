// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'
import { it } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatData(data: string | Date, fmt = 'dd MMM yyyy'): string {
  return format(new Date(data), fmt, { locale: it })
}

export function formatDataOra(data: string | Date): string {
  return format(new Date(data), "dd MMM yyyy 'ore' HH:mm", { locale: it })
}

export function dataRelativa(data: string | Date): string {
  const d = new Date(data)
  if (isToday(d)) return 'Oggi'
  if (isTomorrow(d)) return 'Domani'
  if (isPast(d)) return formatDistanceToNow(d, { locale: it, addSuffix: true })
  return format(d, 'dd MMM', { locale: it })
}

export function formatEuro(importo: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(importo)
}

export function formatEuroCompatto(importo: number): string {
  if (importo >= 1000) return `€${(importo / 1000).toFixed(1)}k`
  return `€${importo}`
}

export function iniziali(nome: string, cognome: string): string {
  return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase()
}

export function percentuale(valore: number, totale: number): number {
  if (totale === 0) return 0
  return Math.round((valore / totale) * 100)
}

export function labelLivello(livello: string): string {
  const map: Record<string, string> = {
    '1_livello': '1° Livello',
    '2_livello': '2° Livello',
    '3_livello': '3° Livello',
    'master': 'Master',
  }
  return map[livello] || livello
}

export function labelStato(stato: string): string {
  const map: Record<string, string> = {
    bozza: 'Bozza',
    aperto: 'Iscrizioni aperte',
    attivo: 'In corso',
    chiuso: 'Concluso',
    in_attesa: 'In attesa',
    approvata: 'Approvata',
    rifiutata: 'Rifiutata',
    sospesa: 'Sospesa',
    da_pagare: 'Da pagare',
    pagato: 'Pagato',
    in_ritardo: 'In ritardo',
    presente: 'Presente',
    assente: 'Assente',
    giustificato: 'Giustificato',
    idoneo: 'Idoneo',
    non_idoneo: 'Non idoneo',
    emesso: 'Emesso',
  }
  return map[stato] || stato
}

export function coloreBadge(stato: string): string {
  const verde = ['approvata', 'pagato', 'presente', 'attivo', 'emesso', 'idoneo', 'confermato']
  const arancio = ['in_attesa', 'da_pagare', 'aperto', 'in_attesa_pagamento']
  const rosso = ['rifiutata', 'in_ritardo', 'assente', 'non_idoneo', 'non_disponibile']
  if (verde.includes(stato)) return 'green'
  if (arancio.includes(stato)) return 'orange'
  if (rosso.includes(stato)) return 'red'
  return 'muted'
}

// Calcola percentuale presenze per uno studente
export function percentualePresenze(presenti: number, totale: number): { pct: number; ok: boolean; critico: boolean } {
  const pct = percentuale(presenti, totale)
  return { pct, ok: pct >= 75, critico: pct < 60 }
}

// Colori vino per UI
export const COLORI_VINO: Record<string, string> = {
  'Giallo paglierino': '#F8F0D0',
  'Giallo dorato': '#EAD070',
  'Giallo ambrato': '#C8A040',
  'Rosa tenue': '#E88060',
  'Rosa cerasuolo': '#C04060',
  'Rosso rubino': '#A03050',
  'Rosso granato': '#7A1A30',
  'Rosso violaceo': '#4A0818',
}
