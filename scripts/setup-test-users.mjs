import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const TEST_PASSWORD = process.env.TEST_USERS_PASSWORD || 'CalicePro2025!'

const TEST_USERS = [
  {
    email: 'admin@calicepro.test',
    password: TEST_PASSWORD,
    nome: 'Paolo',
    cognome: 'Admin',
    ruolo: 'admin',
    delegazione: 'Bari',
    tessera_ais: null,
  },
  {
    email: 'coluccia@calicepro.test',
    password: TEST_PASSWORD,
    nome: 'Vito',
    cognome: 'Coluccia',
    ruolo: 'docente',
    delegazione: 'Bari',
    tessera_ais: null,
  },
  {
    email: 'amendola@calicepro.test',
    password: TEST_PASSWORD,
    nome: 'Laura',
    cognome: 'Amendola',
    ruolo: 'direttore',
    delegazione: 'Bari',
    tessera_ais: null,
  },
  {
    email: 'losito@calicepro.test',
    password: TEST_PASSWORD,
    nome: 'Marco',
    cognome: 'Losito',
    ruolo: 'studente',
    delegazione: 'Bari',
    tessera_ais: 'BA-2892',
  },
]

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const raw = fs.readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function getEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

async function findUserByEmail(supabase, email) {
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) throw error

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase())
    if (user) return user

    if (data.users.length < 200) return null
    page += 1
  }
}

async function ensureTestUser(supabase, userConfig) {
  const existingUser = await findUserByEmail(supabase, userConfig.email)

  let authUserId = existingUser?.id

  if (!existingUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: userConfig.email,
      password: userConfig.password,
      email_confirm: true,
      user_metadata: {
        nome: userConfig.nome,
        cognome: userConfig.cognome,
        ruolo: userConfig.ruolo,
        tessera_ais: userConfig.tessera_ais,
        delegazione: userConfig.delegazione,
      },
    })

    if (error || !data.user) {
      throw error ?? new Error(`Unable to create user ${userConfig.email}`)
    }

    authUserId = data.user.id
    console.log(`created auth user ${userConfig.email}`)
  } else {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: userConfig.password,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        nome: userConfig.nome,
        cognome: userConfig.cognome,
        ruolo: userConfig.ruolo,
        tessera_ais: userConfig.tessera_ais,
        delegazione: userConfig.delegazione,
      },
    })

    if (error) throw error
    console.log(`updated auth user ${userConfig.email}`)
  }

  const { error: profileError } = await supabase.from('utenti').upsert(
    {
      id: authUserId,
      email: userConfig.email,
      nome: userConfig.nome,
      cognome: userConfig.cognome,
      ruolo: userConfig.ruolo,
      tessera_ais: userConfig.tessera_ais,
      delegazione: userConfig.delegazione,
    },
    { onConflict: 'id' }
  )

  if (profileError) throw profileError

  console.log(`synced profile ${userConfig.email} -> ${userConfig.ruolo}`)
}

async function main() {
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env.local'))
  loadEnvFile(path.join(root, '.env'))

  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  for (const userConfig of TEST_USERS) {
    await ensureTestUser(supabase, userConfig)
  }

  console.log('')
  console.log('Test users ready:')
  for (const userConfig of TEST_USERS) {
    console.log(`- ${userConfig.email} / ${userConfig.password} (${userConfig.ruolo})`)
  }
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
