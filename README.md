# CalicePro 🍷
**Piattaforma di gestione corsi sommelier AIS**

Stack: **Next.js 14** · **Supabase** · **Tailwind CSS** · **TypeScript**

---

## Setup locale (5 minuti)

### 1. Installa dipendenze
```bash
npm install
```

### 2. Configura Supabase

1. Vai su [supabase.com](https://supabase.com) → **New project**
2. Copia `URL` e `anon key` da **Settings → API**
3. Copia il file env e inserisci i valori:
```bash
cp .env.local.example .env.local
# poi modifica .env.local con i tuoi valori
```

### 3. Crea il database

Nel pannello Supabase → **SQL Editor**, esegui in ordine:
```
supabase/migrations/001_schema.sql
supabase/migrations/002_seed.sql
```

### 4. Crea gli utenti di test

In Supabase → **Authentication → Users → Add user**:

| Email | Password | Ruolo |
|-------|----------|-------|
| `admin@calicepro.test` | `CalicePro2025!` | admin |
| `coluccia@calicepro.test` | `CalicePro2025!` | docente |
| `amendola@calicepro.test` | `CalicePro2025!` | direttore |
| `losito@calicepro.test` | `CalicePro2025!` | studente |

Poi aggiorna i ruoli in **SQL Editor**:
```sql
UPDATE public.utenti SET ruolo = 'admin',     nome = 'Paolo',  cognome = 'Admin'    WHERE email = 'admin@calicepro.test';
UPDATE public.utenti SET ruolo = 'docente',   nome = 'Vito',   cognome = 'Coluccia' WHERE email = 'coluccia@calicepro.test';
UPDATE public.utenti SET ruolo = 'direttore', nome = 'Laura',  cognome = 'Amendola' WHERE email = 'amendola@calicepro.test';
UPDATE public.utenti SET nome = 'Marco', cognome = 'Losito', tessera_ais = 'BA-2892' WHERE email = 'losito@calicepro.test';
```

### 5. Avvia
```bash
npm run dev
# → http://localhost:3000
```

---

## Deploy su Render

### 1. Push su GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TUO-UTENTE/calicepro.git
git push -u origin main
```

### 2. Crea il servizio su Render

1. [render.com](https://render.com) → **New Web Service**
2. Collega il tuo repo GitHub
3. Render legge automaticamente `render.yaml`
4. Aggiungi le variabili d'ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` → `https://calicepro.onrender.com`
5. Click **Deploy**

Il deploy richiede ~3 minuti. Ogni push su `main` fa un deploy automatico.

---

## Struttura progetto

```
calicepro/
├── app/
│   ├── auth/
│   │   ├── login/          # Pagina login
│   │   └── register/       # Registrazione studente
│   ├── dashboard/
│   │   ├── layout.tsx       # Shell con bottom nav
│   │   ├── studente/        # Area studente
│   │   ├── docente/         # Area docente
│   │   ├── direttore/       # Area direttore
│   │   └── admin/           # Area admin
│   └── api/
│       ├── iscrizioni/      # Approva/rifiuta iscrizioni
│       ├── presenze/qr/     # QR check-in
│       └── import/          # Import Excel corsisti
├── components/
│   └── layout/
│       └── DashboardShell.tsx  # Bottom nav per ruolo
├── lib/
│   ├── auth.ts              # Helper autenticazione
│   ├── utils.ts             # Utilities
│   └── supabase/            # Client browser + server
├── types/
│   └── index.ts             # TypeScript types completi
└── supabase/
    └── migrations/          # Schema SQL + seed
```

## Ruoli

| Ruolo | Accent | Accesso |
|-------|--------|---------|
| 🎓 Studente | Gold | Corsi, lezioni, degustazioni, quiz, pagamenti |
| 🍷 Docente | Teal | Calendario, materiali, lista vini |
| 📋 Direttore | Green | Presenze, import corsisti, report, comunicazioni, pagamenti |
| ⚙️ Admin | Indigo | Dashboard completa, corsi, iscrizioni, pagamenti, diplomi |
