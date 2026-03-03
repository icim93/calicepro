'use client'
// app/auth/register/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, User, Mail, CreditCard, MapPin, Lock } from 'lucide-react'

const schema = z.object({
  nome:       z.string().min(2, 'Nome troppo corto'),
  cognome:    z.string().min(2, 'Cognome troppo corto'),
  email:      z.string().email('Email non valida'),
  tessera:    z.string().optional(),
  delegazione:z.string().min(1, 'Seleziona la delegazione'),
  password:   z.string().min(8, 'Minimo 8 caratteri'),
  conferma:   z.string(),
}).refine(d => d.password === d.conferma, {
  message: 'Le password non coincidono',
  path: ['conferma'],
})
type FormData = z.infer<typeof schema>

const DELEGAZIONI = ['Bari','Milano','Roma','Napoli','Torino','Firenze','Bologna','Palermo','Genova','Venezia']

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { delegazione: 'Bari' },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nome: data.nome,
          cognome: data.cognome,
          ruolo: 'studente',
          tessera_ais: data.tessera || null,
          delegazione: data.delegazione,
        },
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Account creato! Controlla la tua email per confermare.')
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col
                    bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(92,16,32,0.4)_0%,transparent_55%)]">
      <div className="flex items-center gap-2 px-5 pt-14 pb-4">
        <Link href="/auth/login" className="flex items-center gap-1 text-gold text-sm">
          <ChevronLeft className="w-5 h-5" /> Indietro
        </Link>
      </div>

      <div className="px-5 pb-3">
        <h1 className="font-serif text-[28px] text-cream">Crea Account</h1>
        <p className="text-xs text-cream/40 mt-1">Inizia il tuo percorso AIS</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 px-5 pb-10 space-y-4">

        <Field label="Nome e Cognome" error={errors.nome?.message || errors.cognome?.message}>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="abs-icon" />
              <input type="text" placeholder="Nome" className="input-field" {...register('nome')} />
            </div>
            <input type="text" placeholder="Cognome"
              className="input-field pl-4" {...register('cognome')} />
          </div>
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <div className="relative">
            <Mail className="abs-icon" />
            <input type="email" placeholder="nome@email.it" className="input-field" {...register('email')} />
          </div>
        </Field>

        <Field label="Numero Tessera AIS (opzionale)" error={undefined}>
          <div className="relative">
            <CreditCard className="abs-icon" />
            <input type="text" placeholder="es. BA-2892" className="input-field" {...register('tessera')} />
          </div>
        </Field>

        <Field label="Delegazione" error={errors.delegazione?.message}>
          <div className="relative">
            <MapPin className="abs-icon" />
            <select className="input-field pl-10 appearance-none" {...register('delegazione')}>
              {DELEGAZIONI.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <Lock className="abs-icon" />
            <input type="password" placeholder="Min. 8 caratteri" className="input-field" {...register('password')} />
          </div>
        </Field>

        <Field label="Conferma Password" error={errors.conferma?.message}>
          <div className="relative">
            <Lock className="abs-icon" />
            <input type="password" placeholder="Ripeti password" className="input-field" {...register('conferma')} />
          </div>
        </Field>

        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-bx disabled:opacity-60">
            {loading ? 'Registrazione…' : 'Registrati'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold tracking-[1.8px] uppercase text-gold-d mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-danger text-[11px] mt-1">{error}</p>}
    </div>
  )
}
