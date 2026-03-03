// ─── Ruoli ───────────────────────────────────────────────
export type Ruolo = 'studente' | 'docente' | 'direttore' | 'admin'

// ─── Utente ──────────────────────────────────────────────
export interface Utente {
  id: string
  email: string
  nome: string
  cognome: string
  ruolo: Ruolo
  tessera_ais?: string
  delegazione?: string
  avatar_url?: string
  created_at: string
}

// ─── Corso ───────────────────────────────────────────────
export type StatoCorso = 'bozza' | 'aperto' | 'attivo' | 'chiuso'
export type LivelloCorso = '1_livello' | '2_livello' | '3_livello' | 'master'

export interface Corso {
  id: string
  titolo: string
  livello: LivelloCorso
  stato: StatoCorso
  docente_id: string
  direttore_id: string
  delegazione: string
  sede: string
  data_inizio: string
  data_fine?: string
  num_lezioni: number
  capienza_max: number
  quota_euro: number
  num_rate: 1 | 2 | 3
  created_at: string
  // joins
  docente?: Utente
  direttore?: Utente
  iscritti_count?: number
  lezioni_count?: number
}

// ─── Iscrizione ──────────────────────────────────────────
export type StatoIscrizione = 'in_attesa' | 'approvata' | 'rifiutata' | 'sospesa'

export interface Iscrizione {
  id: string
  corso_id: string
  studente_id: string
  stato: StatoIscrizione
  created_at: string
  approvata_at?: string
  // joins
  corso?: Corso
  studente?: Utente
}

// ─── Lezione ─────────────────────────────────────────────
export interface Lezione {
  id: string
  corso_id: string
  numero: number
  titolo: string
  data: string
  ora_inizio: string
  ora_fine: string
  sede?: string
  note?: string
  created_at: string
  // joins
  corso?: Corso
  presenze_count?: number
  materiali_count?: number
}

// ─── Presenza ────────────────────────────────────────────
export type StatoPresenza = 'presente' | 'assente' | 'giustificato'

export interface Presenza {
  id: string
  lezione_id: string
  studente_id: string
  stato: StatoPresenza
  check_in_at?: string
  metodo?: 'qr' | 'manuale'
  // joins
  lezione?: Lezione
  studente?: Utente
}

// ─── Materiale ───────────────────────────────────────────
export type TipoMateriale = 'pdf' | 'video' | 'presentazione' | 'altro'
export type VisibilitaMateriale = 'immediata' | 'dopo_lezione'

export interface Materiale {
  id: string
  lezione_id: string
  docente_id: string
  titolo: string
  tipo: TipoMateriale
  url: string
  dimensione_bytes?: number
  visibilita: VisibilitaMateriale
  created_at: string
  // joins
  lezione?: Lezione
}

// ─── Vino ────────────────────────────────────────────────
export type TipoVino = 'bianco' | 'rosso' | 'rosato' | 'bollicine' | 'dolce' | 'passito'
export type StatoVino = 'in_attesa' | 'confermato' | 'non_disponibile'

export interface Vino {
  id: string
  lezione_id: string
  nome: string
  produttore: string
  annata?: string
  tipo: TipoVino
  denominazione?: string
  num_bottiglie: number
  stato: StatoVino
  note?: string
  created_at: string
}

// ─── Degustazione ────────────────────────────────────────
export interface Degustazione {
  id: string
  studente_id: string
  lezione_id?: string
  nome_vino: string
  produttore?: string
  annata?: string
  denominazione?: string
  // visivo
  colore?: string
  limpidezza?: string
  consistenza?: string
  effervescenza?: string
  // olfattivo
  intensita_olf?: string
  qualita_olf?: string
  descrittori?: string[]
  note_olfatto?: string
  // gustativo
  acidita?: string
  tannini?: string
  corpo?: string
  pai?: string
  note_gusto?: string
  // finale
  valutazione?: 1 | 2 | 3 | 4
  abbinamenti?: string
  commento_finale?: string
  created_at: string
}

// ─── Pagamento ───────────────────────────────────────────
export type StatoPagamento = 'da_pagare' | 'pagato' | 'in_ritardo' | 'sospeso'

export interface Pagamento {
  id: string
  iscrizione_id: string
  studente_id: string
  corso_id: string
  numero_rata: number
  importo_euro: number
  scadenza: string
  stato: StatoPagamento
  pagato_at?: string
  ricevuta_url?: string
  created_at: string
  // joins
  studente?: Utente
  corso?: Corso
}

// ─── Diploma ─────────────────────────────────────────────
export type StatoDiploma = 'idoneo' | 'non_idoneo' | 'emesso' | 'in_attesa_pagamento'

export interface Diploma {
  id: string
  studente_id: string
  corso_id: string
  stato: StatoDiploma
  emesso_at?: string
  url?: string
  created_at: string
  // joins
  studente?: Utente
  corso?: Corso
}

// ─── Comunicazione ───────────────────────────────────────
export type TipoComunicazione = 'promemoria' | 'pagamento' | 'presenza' | 'diploma' | 'generico'

export interface Comunicazione {
  id: string
  corso_id?: string
  mittente_id: string
  destinatari: 'tutti' | 'sotto_soglia' | 'pagamento_ritardo' | 'singolo'
  destinatario_id?: string
  tipo: TipoComunicazione
  oggetto: string
  corpo: string
  inviata_at?: string
  aperture_count?: number
  created_at: string
}

// ─── Auth / Session ──────────────────────────────────────
export interface SessioneUtente {
  utente: Utente
  token: string
}

// ─── API Response ────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// ─── Stats per dashboard ─────────────────────────────────
export interface StatsDashboardAdmin {
  corsi_attivi: number
  totale_iscritti: number
  media_presenze_pct: number
  rate_in_scadenza: number
  incassato_euro: number
  atteso_euro: number
  totale_euro: number
  diplomandi_idonei: number
  iscrizioni_in_attesa: number
}

export interface StatsDashboardStudente {
  corso_corrente?: Corso
  avanzamento_pct: number
  presenze: number
  totale_lezioni: number
  media_quiz_pct: number
  degustazioni_count: number
  prossima_lezione?: Lezione
}

export interface StatsDashboardDocente {
  corsi_attivi: number
  totale_studenti: number
  prossima_lezione?: Lezione & { corso?: Corso }
  lezioni_erogate: number
}
