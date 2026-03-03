-- CalicePro — Schema completo
-- Esegui questo file in Supabase → SQL Editor

-- ─── Extensions ───────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Utenti (estende auth.users di Supabase) ─────────────
create table public.utenti (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  nome        text not null,
  cognome     text not null,
  ruolo       text not null check (ruolo in ('studente','docente','direttore','admin')),
  tessera_ais text,
  delegazione text default 'Bari',
  avatar_url  text,
  created_at  timestamptz default now()
);

-- ─── Corsi ───────────────────────────────────────────────
create table public.corsi (
  id           uuid primary key default uuid_generate_v4(),
  titolo       text not null,
  livello      text not null check (livello in ('1_livello','2_livello','3_livello','master')),
  stato        text not null default 'bozza' check (stato in ('bozza','aperto','attivo','chiuso')),
  docente_id   uuid references public.utenti(id),
  direttore_id uuid references public.utenti(id),
  delegazione  text not null default 'Bari',
  sede         text not null,
  data_inizio  date not null,
  data_fine    date,
  num_lezioni  int not null default 10,
  capienza_max int not null default 20,
  quota_euro   numeric(8,2) not null,
  num_rate     int not null default 2 check (num_rate in (1,2,3)),
  created_at   timestamptz default now()
);

-- ─── Iscrizioni ──────────────────────────────────────────
create table public.iscrizioni (
  id           uuid primary key default uuid_generate_v4(),
  corso_id     uuid not null references public.corsi(id) on delete cascade,
  studente_id  uuid not null references public.utenti(id) on delete cascade,
  stato        text not null default 'in_attesa' check (stato in ('in_attesa','approvata','rifiutata','sospesa')),
  approvata_at timestamptz,
  created_at   timestamptz default now(),
  unique(corso_id, studente_id)
);

-- ─── Lezioni ─────────────────────────────────────────────
create table public.lezioni (
  id         uuid primary key default uuid_generate_v4(),
  corso_id   uuid not null references public.corsi(id) on delete cascade,
  numero     int not null,
  titolo     text not null,
  data       date not null,
  ora_inizio time not null default '19:00',
  ora_fine   time not null default '22:00',
  sede       text,
  note       text,
  created_at timestamptz default now(),
  unique(corso_id, numero)
);

-- ─── Presenze ────────────────────────────────────────────
create table public.presenze (
  id          uuid primary key default uuid_generate_v4(),
  lezione_id  uuid not null references public.lezioni(id) on delete cascade,
  studente_id uuid not null references public.utenti(id) on delete cascade,
  stato       text not null default 'assente' check (stato in ('presente','assente','giustificato')),
  check_in_at timestamptz,
  metodo      text check (metodo in ('qr','manuale')),
  created_at  timestamptz default now(),
  unique(lezione_id, studente_id)
);

-- ─── Materiali ───────────────────────────────────────────
create table public.materiali (
  id                uuid primary key default uuid_generate_v4(),
  lezione_id        uuid not null references public.lezioni(id) on delete cascade,
  docente_id        uuid not null references public.utenti(id),
  titolo            text not null,
  tipo              text not null check (tipo in ('pdf','video','presentazione','altro')),
  url               text not null,
  dimensione_bytes  bigint,
  visibilita        text not null default 'dopo_lezione' check (visibilita in ('immediata','dopo_lezione')),
  created_at        timestamptz default now()
);

-- ─── Vini ────────────────────────────────────────────────
create table public.vini (
  id             uuid primary key default uuid_generate_v4(),
  lezione_id     uuid not null references public.lezioni(id) on delete cascade,
  nome           text not null,
  produttore     text not null,
  annata         text,
  tipo           text not null check (tipo in ('bianco','rosso','rosato','bollicine','dolce','passito')),
  denominazione  text,
  num_bottiglie  int not null default 2,
  stato          text not null default 'in_attesa' check (stato in ('in_attesa','confermato','non_disponibile')),
  note           text,
  created_at     timestamptz default now()
);

-- ─── Degustazioni ────────────────────────────────────────
create table public.degustazioni (
  id               uuid primary key default uuid_generate_v4(),
  studente_id      uuid not null references public.utenti(id) on delete cascade,
  lezione_id       uuid references public.lezioni(id),
  nome_vino        text not null,
  produttore       text,
  annata           text,
  denominazione    text,
  colore           text,
  limpidezza       text,
  consistenza      text,
  effervescenza    text,
  intensita_olf    text,
  qualita_olf      text,
  descrittori      text[],
  note_olfatto     text,
  acidita          text,
  tannini          text,
  corpo            text,
  pai              text,
  note_gusto       text,
  valutazione      int check (valutazione between 1 and 4),
  abbinamenti      text,
  commento_finale  text,
  created_at       timestamptz default now()
);

-- ─── Pagamenti ───────────────────────────────────────────
create table public.pagamenti (
  id            uuid primary key default uuid_generate_v4(),
  iscrizione_id uuid not null references public.iscrizioni(id) on delete cascade,
  studente_id   uuid not null references public.utenti(id),
  corso_id      uuid not null references public.corsi(id),
  numero_rata   int not null,
  importo_euro  numeric(8,2) not null,
  scadenza      date not null,
  stato         text not null default 'da_pagare' check (stato in ('da_pagare','pagato','in_ritardo','sospeso')),
  pagato_at     timestamptz,
  ricevuta_url  text,
  created_at    timestamptz default now()
);

-- ─── Diplomi ─────────────────────────────────────────────
create table public.diplomi (
  id          uuid primary key default uuid_generate_v4(),
  studente_id uuid not null references public.utenti(id),
  corso_id    uuid not null references public.corsi(id),
  stato       text not null default 'in_attesa' check (stato in ('idoneo','non_idoneo','emesso','in_attesa_pagamento')),
  emesso_at   timestamptz,
  url         text,
  created_at  timestamptz default now(),
  unique(studente_id, corso_id)
);

-- ─── Comunicazioni ───────────────────────────────────────
create table public.comunicazioni (
  id              uuid primary key default uuid_generate_v4(),
  corso_id        uuid references public.corsi(id),
  mittente_id     uuid not null references public.utenti(id),
  destinatari     text not null check (destinatari in ('tutti','sotto_soglia','pagamento_ritardo','singolo')),
  destinatario_id uuid references public.utenti(id),
  tipo            text not null check (tipo in ('promemoria','pagamento','presenza','diploma','generico')),
  oggetto         text not null,
  corpo           text not null,
  inviata_at      timestamptz,
  aperture_count  int default 0,
  created_at      timestamptz default now()
);

-- ─── Row Level Security ──────────────────────────────────

alter table public.utenti enable row level security;
alter table public.corsi enable row level security;
alter table public.iscrizioni enable row level security;
alter table public.lezioni enable row level security;
alter table public.presenze enable row level security;
alter table public.materiali enable row level security;
alter table public.vini enable row level security;
alter table public.degustazioni enable row level security;
alter table public.pagamenti enable row level security;
alter table public.diplomi enable row level security;
alter table public.comunicazioni enable row level security;

-- Helper: ruolo utente corrente
create or replace function public.ruolo_corrente()
returns text language sql stable as $$
  select ruolo from public.utenti where id = auth.uid()
$$;

-- UTENTI: ognuno vede il proprio profilo; admin vede tutti
create policy "utenti_select" on public.utenti for select
  using (id = auth.uid() or ruolo_corrente() in ('admin','direttore'));

create policy "utenti_update_own" on public.utenti for update
  using (id = auth.uid());

-- CORSI: tutti gli autenticati possono vedere i corsi attivi
create policy "corsi_select" on public.corsi for select
  using (auth.uid() is not null);

create policy "corsi_insert_admin" on public.corsi for insert
  with check (ruolo_corrente() = 'admin');

create policy "corsi_update_admin" on public.corsi for update
  using (ruolo_corrente() = 'admin');

-- ISCRIZIONI
create policy "iscrizioni_select" on public.iscrizioni for select
  using (
    studente_id = auth.uid()
    or ruolo_corrente() in ('admin','direttore')
    or exists (select 1 from public.corsi where id = corso_id and docente_id = auth.uid())
  );

create policy "iscrizioni_insert_studente" on public.iscrizioni for insert
  with check (studente_id = auth.uid());

create policy "iscrizioni_update_admin_dir" on public.iscrizioni for update
  using (ruolo_corrente() in ('admin','direttore'));

-- LEZIONI
create policy "lezioni_select" on public.lezioni for select
  using (auth.uid() is not null);

create policy "lezioni_manage" on public.lezioni for all
  using (
    ruolo_corrente() in ('admin','direttore')
    or exists (select 1 from public.corsi where id = corso_id and docente_id = auth.uid())
  );

-- PRESENZE
create policy "presenze_select" on public.presenze for select
  using (
    studente_id = auth.uid()
    or ruolo_corrente() in ('admin','direttore')
    or exists (
      select 1 from public.lezioni l
      join public.corsi c on c.id = l.corso_id
      where l.id = lezione_id and c.docente_id = auth.uid()
    )
  );

create policy "presenze_manage_dir" on public.presenze for all
  using (ruolo_corrente() in ('direttore','admin'));

-- MATERIALI
create policy "materiali_select" on public.materiali for select
  using (
    auth.uid() is not null
    and (
      visibilita = 'immediata'
      or ruolo_corrente() in ('admin','docente','direttore')
      or exists (
        select 1 from public.lezioni l
        where l.id = lezione_id and l.data <= current_date
      )
    )
  );

create policy "materiali_manage_docente" on public.materiali for all
  using (docente_id = auth.uid() or ruolo_corrente() = 'admin');

-- DEGUSTAZIONI: solo il proprietario e admin
create policy "degu_select" on public.degustazioni for select
  using (studente_id = auth.uid() or ruolo_corrente() = 'admin');

create policy "degu_insert" on public.degustazioni for insert
  with check (studente_id = auth.uid());

create policy "degu_update" on public.degustazioni for update
  using (studente_id = auth.uid());

-- PAGAMENTI
create policy "pagamenti_select" on public.pagamenti for select
  using (
    studente_id = auth.uid()
    or ruolo_corrente() in ('admin','direttore')
  );

create policy "pagamenti_manage" on public.pagamenti for all
  using (ruolo_corrente() in ('admin','direttore'));

-- DIPLOMI
create policy "diplomi_select" on public.diplomi for select
  using (studente_id = auth.uid() or ruolo_corrente() in ('admin','direttore'));

create policy "diplomi_manage" on public.diplomi for all
  using (ruolo_corrente() = 'admin');

-- VINI
create policy "vini_select" on public.vini for select using (auth.uid() is not null);
create policy "vini_manage" on public.vini for all
  using (
    ruolo_corrente() in ('admin','direttore')
    or exists (
      select 1 from public.lezioni l
      join public.corsi c on c.id = l.corso_id
      where l.id = lezione_id and c.docente_id = auth.uid()
    )
  );

-- COMUNICAZIONI
create policy "comunicazioni_select" on public.comunicazioni for select
  using (ruolo_corrente() in ('admin','direttore'));

create policy "comunicazioni_insert" on public.comunicazioni for insert
  with check (ruolo_corrente() in ('admin','direttore') and mittente_id = auth.uid());

-- ─── Trigger: crea profilo utente al signup ──────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.utenti (id, email, nome, cognome, ruolo, tessera_ais, delegazione)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'cognome', ''),
    coalesce(new.raw_user_meta_data->>'ruolo', 'studente'),
    new.raw_user_meta_data->>'tessera_ais',
    coalesce(new.raw_user_meta_data->>'delegazione', 'Bari')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Funzione: genera rate pagamento all'approvazione ────
create or replace function public.genera_rate_pagamento(p_iscrizione_id uuid)
returns void language plpgsql security definer as $$
declare
  v_iscrizione record;
  v_corso record;
  v_importo_rata numeric;
  v_i int;
begin
  select * into v_iscrizione from public.iscrizioni where id = p_iscrizione_id;
  select * into v_corso from public.corsi where id = v_iscrizione.corso_id;

  v_importo_rata := v_corso.quota_euro / v_corso.num_rate;

  for v_i in 1..v_corso.num_rate loop
    insert into public.pagamenti (
      iscrizione_id, studente_id, corso_id,
      numero_rata, importo_euro, scadenza, stato
    ) values (
      p_iscrizione_id,
      v_iscrizione.studente_id,
      v_corso.id,
      v_i,
      v_importo_rata,
      v_corso.data_inizio + ((v_i - 1) * interval '30 days'),
      'da_pagare'
    );
  end loop;
end;
$$;
