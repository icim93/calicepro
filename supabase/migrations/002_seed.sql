-- CalicePro — Dati di test
-- Esegui DOPO la migration 001_schema.sql
-- ATTENZIONE: questi dati usano UUID fissi per facilità di test
-- Gli utenti vanno creati prima via Supabase Auth, poi questo seed li arricchisce

-- ─── Utenti di test ──────────────────────────────────────
-- Crea questi utenti manualmente da Supabase Auth → Users → "Invite user"
-- oppure usa la pagina di registrazione con i dati sotto

-- Admin: admin@calicepro.test / CalicePro2025!
-- Docente: coluccia@calicepro.test / CalicePro2025!
-- Direttore: amendola@calicepro.test / CalicePro2025!
-- Studente: losito@calicepro.test / CalicePro2025!

-- Dopo la creazione, aggiorna i ruoli (il trigger imposta 'studente' di default):
-- UPDATE public.utenti SET ruolo = 'admin' WHERE email = 'admin@calicepro.test';
-- UPDATE public.utenti SET ruolo = 'docente', nome = 'Vito', cognome = 'Coluccia' WHERE email = 'coluccia@calicepro.test';
-- UPDATE public.utenti SET ruolo = 'direttore', nome = 'Laura', cognome = 'Amendola' WHERE email = 'amendola@calicepro.test';
-- UPDATE public.utenti SET nome = 'Marco', cognome = 'Losito', tessera_ais = 'BA-2892' WHERE email = 'losito@calicepro.test';

-- ─── Corso di esempio (usa gli UUID reali dei tuoi utenti) ─
-- INSERT INTO public.corsi (titolo, livello, stato, docente_id, direttore_id, sede, data_inizio, num_lezioni, capienza_max, quota_euro, num_rate)
-- VALUES (
--   'Sommelier 2° Livello',
--   '2_livello',
--   'attivo',
--   '<uuid-coluccia>',
--   '<uuid-amendola>',
--   'Ristorante Il Sommelier, Via Roma 14, Bari',
--   '2025-02-15',
--   12,
--   20,
--   480.00,
--   3
-- );

-- Script completo disponibile in /supabase/seed_completo.sql
-- da generare dopo aver creato gli utenti reali in Supabase Auth
