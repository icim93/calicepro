'use client'
// app/auth/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

const schema = z.object({
  email:    z.string().email('Email non valida'),
  password: z.string().min(6, 'Minimo 6 caratteri'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error('Credenziali non valide')
      setLoading(false)
      return
    }
    // Fetch ruolo e redirect
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profilo } = await supabase
      .from('utenti').select('ruolo').eq('id', user!.id).maybeSingle()

    if (!profilo) {
      await supabase.auth.signOut()
      toast.error('Profilo utente non trovato. Effettua nuovamente l’accesso o contatta l’assistenza.')
      setLoading(false)
      return
    }

    router.push(`/dashboard/${profilo.ruolo}`)
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-screen bg-dark">

      {/* HERO */}
      <div className="flex-1 flex flex-col items-center justify-center px-8
                      bg-[radial-gradient(ellipse_80%_60%_at_50%_-5%,rgba(92,16,32,0.7)_0%,transparent_65%)]">
        <div className="w-[72px] h-[72px] border border-gold/20 rounded-[20px]
                        flex items-center justify-center mb-5
                        bg-bx/25 shadow-[0_0_40px_rgba(201,162,74,0.08),inset_0_1px_0_rgba(201,162,74,0.15)]
                        animate-scale-in">
          <WineGlassIcon />
        </div>
        <p className="text-[11px] tracking-[7px] text-gold/80 font-medium mb-1 animate-fade-up">A · I · S</p>
        <h1 className="font-serif text-[32px] font-light text-cream animate-fade-up" style={{ animationDelay: '0.05s' }}>
          Calice<em className="italic text-gold-l">Pro</em>
        </h1>
        <div className="w-10 h-px bg-gradient-to-r from-transparent via-gold to-transparent my-3" />
        <p className="text-[10px] tracking-[2.5px] text-cream/40 uppercase animate-fade-up" style={{ animationDelay: '0.1s' }}>
          Gestione Corsi Sommelier
        </p>
      </div>

      {/* FORM */}
      <div className="bg-gradient-to-b from-surf/98 to-dark border-t border-gold/14
                      rounded-[34px_34px_0_0] px-6 pt-7 pb-14
                      animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="font-serif text-2xl text-cream mb-1">Bentornato</h2>
        <p className="text-xs text-cream/40 mb-6">Accedi al tuo percorso di formazione</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label className="block text-[10px] font-semibold tracking-[1.8px] uppercase text-gold-d mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-d/60" />
              <input
                type="email"
                autoComplete="email"
                placeholder="nome@email.it"
                className="input-field"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-danger text-[11px] mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="block text-[10px] font-semibold tracking-[1.8px] uppercase text-gold-d mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-d/60" />
              <input
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-field pr-10"
                {...register('password')}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-danger text-[11px] mt-1">{errors.password.message}</p>}
          </div>

          <div className="text-right mb-5">
            <Link href="/auth/forgot-password" className="text-[11px] text-gold-d hover:text-gold transition-colors">
              Password dimenticata?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-bx mb-4 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] tracking-[1.5px] text-cream/20 uppercase">oppure</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* SSO AIS */}
        <button
          onClick={() => toast.info('SSO AIS — funzionalità in arrivo')}
          className="w-full h-[46px] bg-transparent border border-gold/14 rounded-xl
                     flex items-center justify-center gap-3
                     text-[12px] font-light text-cream/70
                     hover:border-gold/30 hover:bg-gold/[0.04] transition-all duration-200">
          <span className="font-serif text-[11px] font-semibold text-gold bg-gold/10
                           border border-gold/20 px-2 py-0.5 rounded-[5px] tracking-[1px]">AIS</span>
          Accedi con tessera AIS nazionale
        </button>

        <p className="text-center mt-5 text-xs font-light text-cream/40">
          Prima volta?{' '}
          <Link href="/auth/register" className="text-gold font-normal hover:text-gold-l transition-colors">
            Crea account
          </Link>
        </p>
      </div>
    </div>
  )
}

function WineGlassIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
      <path d="M10 7 Q10 21 19 23 Q28 21 28 7Z" stroke="#C9A24A" strokeWidth="1.3" fill="rgba(201,162,74,0.08)" />
      <line x1="19" y1="23" x2="19" y2="31" stroke="#C9A24A" strokeWidth="1.3" />
      <line x1="13" y1="31" x2="25" y2="31" stroke="#C9A24A" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 14 Q14.5 16 19 15 Q23.5 14 28 14" stroke="rgba(201,162,74,0.3)" strokeWidth=".8" />
    </svg>
  )
}
