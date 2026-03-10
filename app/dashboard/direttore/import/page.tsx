'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, CheckCircle, FileText, Upload, XCircle } from 'lucide-react'

type RigaCSV = {
  nome: string
  cognome: string
  email: string
  tessera_ais?: string
  delegazione?: string
}

type RisultatoRiga = {
  riga: number
  email: string
  stato: 'ok' | 'errore' | 'esistente'
  messaggio: string
}

const CSV_TEMPLATE = `nome,cognome,email,tessera_ais,delegazione
Mario,Rossi,mario.rossi@email.it,AIS12345,Bari
Laura,Bianchi,laura.bianchi@email.it,,Bari
Giuseppe,Verdi,giuseppe.verdi@email.it,AIS67890,Taranto`

function parseCSV(testo: string): RigaCSV[] {
  const righe = testo.trim().split('\n').filter(Boolean)
  if (righe.length < 2) return []

  const header = righe[0].split(',').map((value) => value.trim().toLowerCase())

  return righe
    .slice(1)
    .map((riga) => {
      const valori = riga.split(',').map((value) => value.trim())
      const obj: Record<string, string> = {}
      header.forEach((key, index) => {
        obj[key] = valori[index] ?? ''
      })

      return {
        nome: obj.nome ?? '',
        cognome: obj.cognome ?? '',
        email: obj.email ?? '',
        tessera_ais: obj.tessera_ais || undefined,
        delegazione: obj.delegazione || 'Bari',
      }
    })
    .filter((row) => row.nome && row.cognome && row.email)
}

export default function DirettoreImport() {
  const router = useRouter()
  const [supabase] = useState(createClient)

  const [fase, setFase] = useState<'upload' | 'anteprima' | 'risultato'>('upload')
  const [csvTesto, setCsvTesto] = useState('')
  const [righePreview, setRighePreview] = useState<RigaCSV[]>([])
  const [risultati, setRisultati] = useState<RisultatoRiga[]>([])
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [corsoId, setCorsoId] = useState('')
  const [corsi, setCorsi] = useState<{ id: string; titolo: string }[]>([])
  const [loadingCorsi, setLoadingCorsi] = useState(false)

  useEffect(() => {
    setLoadingCorsi(true)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoadingCorsi(false)
        return
      }

      supabase
        .from('corsi')
        .select('id, titolo')
        .eq('direttore_id', user.id)
        .in('stato', ['attivo', 'aperto'])
        .then(({ data }) => {
          const list = (data ?? []) as { id: string; titolo: string }[]
          setCorsi(list)
          if (list.length > 0) setCorsoId(list[0].id)
          setLoadingCorsi(false)
        })
    })
  }, [supabase])

  function handleParsedText(testo: string) {
    setCsvTesto(testo)
    const righe = parseCSV(testo)
    setRighePreview(righe)
    if (righe.length > 0) setFase('anteprima')
  }

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (event) => {
      handleParsedText((event.target?.result as string) ?? '')
    }
    reader.readAsText(file)
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) handleFile(file)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleTextPaste() {
    handleParsedText(csvTesto)
  }

  async function eseguiImport() {
    if (!righePreview.length) return

    setImporting(true)

    try {
      const file = new File([csvTesto], 'studenti.csv', { type: 'text/csv' })
      const formData = new FormData()
      formData.append('file', file)
      if (corsoId) formData.append('corso_id', corsoId)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error ?? 'Import non riuscito')
      }

      setRisultati(payload.data?.dettagli ?? [])
      setFase('risultato')
    } catch (error) {
      setRisultati([
        {
          riga: 0,
          email: '-',
          stato: 'errore',
          messaggio: error instanceof Error ? error.message : 'Errore sconosciuto',
        },
      ])
      setFase('risultato')
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setFase('upload')
    setCsvTesto('')
    setRighePreview([])
    setRisultati([])
  }

  const okCount = risultati.filter((item) => item.stato === 'ok').length
  const errCount = risultati.filter((item) => item.stato === 'errore').length
  const esistCount = risultati.filter((item) => item.stato === 'esistente').length

  if (fase === 'risultato') {
    return (
      <div className="min-h-screen pb-10">
        <div className="flex items-center gap-3 px-5 pt-14 pb-4">
          <button
            onClick={reset}
            className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                       flex items-center justify-center text-cream/60"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-serif text-2xl text-cream">Risultato import</h1>
        </div>

        <div className="grid grid-cols-3 gap-2 px-4 mb-4">
          {[
            { n: okCount, l: 'Importati', c: 'text-success' },
            { n: esistCount, l: 'Esistenti', c: 'text-warning' },
            { n: errCount, l: 'Errori', c: 'text-danger' },
          ].map((item) => (
            <div key={item.l} className="bg-surf2 border border-white/[0.055] rounded-[14px] p-3 text-center">
              <p className={`font-serif text-2xl ${item.c}`}>{item.n}</p>
              <p className="text-[9px] text-cream/40 uppercase tracking-[0.5px] mt-1">{item.l}</p>
            </div>
          ))}
        </div>

        <div className="px-4 flex flex-col gap-2 mb-6">
          {risultati.map((item, index) => (
            <div
              key={`${item.email}-${index}`}
              className={`flex items-center gap-3 p-3 rounded-[12px] border ${
                item.stato === 'ok'
                  ? 'bg-success/5 border-success/15'
                  : item.stato === 'errore'
                    ? 'bg-danger/5 border-danger/15'
                    : 'bg-warning/5 border-warning/15'
              }`}
            >
              {item.stato === 'ok' ? (
                <CheckCircle size={16} className="text-success flex-shrink-0" />
              ) : item.stato === 'errore' ? (
                <XCircle size={16} className="text-danger flex-shrink-0" />
              ) : (
                <span className="text-warning text-sm flex-shrink-0">!</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-cream/80 truncate">{item.email}</p>
                <p className="text-[10px] text-cream/40">{item.messaggio}</p>
              </div>
              <span className="text-[10px] text-cream/30 flex-shrink-0">R.{item.riga}</span>
            </div>
          ))}
        </div>

        <div className="px-4">
          <button
            onClick={reset}
            className="w-full h-[52px] bg-surf2 border border-white/[0.055] rounded-[14px]
                       text-[13px] text-cream/70 transition-all active:scale-[0.98]"
          >
            Nuovo import
          </button>
        </div>
      </div>
    )
  }

  if (fase === 'anteprima') {
    return (
      <div className="min-h-screen pb-10">
        <div className="flex items-center gap-3 px-5 pt-14 pb-4">
          <button
            onClick={() => setFase('upload')}
            className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                       flex items-center justify-center text-cream/60"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-serif text-2xl text-cream">Anteprima</h1>
        </div>

        {loadingCorsi ? (
          <div className="px-4 mb-4 text-xs text-cream/40">Caricamento corsi...</div>
        ) : corsi.length > 0 ? (
          <div className="mx-4 mb-4 bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
            <p className="text-[10px] text-dir-acc/60 uppercase tracking-[0.5px] mb-2">
              Iscrivere al corso
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setCorsoId('')}
                className={`w-full text-left p-2.5 rounded-[10px] border text-[12px] transition-all ${
                  corsoId === '' ? 'border-dir-acc bg-dir-acc/10 text-dir-acc' : 'border-white/[0.07] text-cream/40'
                }`}
              >
                Solo importa utenti
              </button>
              {corsi.map((corso) => (
                <button
                  key={corso.id}
                  onClick={() => setCorsoId(corso.id)}
                  className={`w-full text-left p-2.5 rounded-[10px] border text-[12px] transition-all ${
                    corsoId === corso.id
                      ? 'border-dir-acc bg-dir-acc/10 text-dir-acc'
                      : 'border-white/[0.07] text-cream/50'
                  }`}
                >
                  {corso.titolo}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="section-label" style={{ color: 'rgba(90,196,132,0.5)' }}>
          {righePreview.length} studenti trovati
        </p>
        <div className="mx-4 bg-surf2 border border-white/[0.055] rounded-[18px] overflow-hidden mb-4">
          {righePreview.slice(0, 10).map((row, index) => (
            <div
              key={`${row.email}-${index}`}
              className={`flex items-center gap-3 px-4 py-3 ${
                index < Math.min(righePreview.length, 10) - 1 ? 'border-b border-white/[0.055]' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-dir/25 border border-dir-acc/15 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-medium text-dir-acc">
                  {row.nome[0]}
                  {row.cognome[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-cream truncate">
                  {row.nome} {row.cognome}
                </p>
                <p className="text-[10px] text-cream/40 truncate">{row.email}</p>
              </div>
              {row.tessera_ais && <span className="text-[9px] text-gold/60 flex-shrink-0">{row.tessera_ais}</span>}
            </div>
          ))}
        </div>

        <div className="px-4 flex flex-col gap-2">
          <button
            onClick={() => void eseguiImport()}
            disabled={importing}
            className="w-full h-[52px] bg-dir-gradient border border-dir-acc/30 rounded-[14px]
                       text-[13px] font-semibold text-cream flex items-center justify-center gap-2
                       disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {importing ? 'Importazione in corso...' : `Importa ${righePreview.length} studenti`}
          </button>
          <button
            onClick={() => setFase('upload')}
            className="w-full h-10 bg-white/[0.03] border border-white/[0.06] rounded-[12px]
                       text-[12px] text-cream/40 transition-all active:scale-[0.98]"
          >
            Modifica file
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-10">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                     flex items-center justify-center text-cream/60"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-serif text-2xl text-cream">Import Studenti</h1>
      </div>

      <div className="px-4 flex flex-col gap-4">
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative rounded-[18px] border-2 border-dashed p-8 flex flex-col items-center
            justify-center gap-3 transition-all cursor-pointer ${
              dragOver ? 'border-dir-acc bg-dir-acc/10' : 'border-white/[0.1] bg-surf2 hover:border-dir-acc/40'
            }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dragOver ? 'bg-dir-acc/20' : 'bg-white/[0.04]'}`}>
            <Upload size={24} className={dragOver ? 'text-dir-acc' : 'text-cream/30'} />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-medium text-cream mb-1">{dragOver ? 'Rilascia il file CSV' : 'Carica file CSV'}</p>
            <p className="text-[11px] text-cream/40">Trascina qui o seleziona un file</p>
          </div>
        </div>

        <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
          <p className="text-[10px] text-dir-acc/60 uppercase tracking-[0.5px] mb-3">Oppure incolla il CSV</p>
          <textarea
            value={csvTesto}
            onChange={(event) => setCsvTesto(event.target.value)}
            placeholder="nome,cognome,email,tessera_ais,delegazione"
            rows={5}
            className="w-full bg-surf3 border border-white/[0.07] rounded-[10px] px-3 py-2
                       text-xs text-cream/70 placeholder:text-cream/20 font-mono outline-none
                       focus:border-dir-acc/40 transition-colors resize-none mb-3"
          />
          <button
            onClick={handleTextPaste}
            disabled={!csvTesto.trim()}
            className="w-full h-10 bg-dir-acc/15 border border-dir-acc/25 rounded-[10px]
                       text-[12px] text-dir-acc font-medium disabled:opacity-40
                       transition-all active:scale-[0.97]"
          >
            Analizza testo
          </button>
        </div>

        <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-[13px] text-cream">Template CSV</p>
              <p className="text-[10px] text-cream/40">Scarica il formato corretto</p>
            </div>
          </div>

          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
            download="template_studenti_calicepro.csv"
            className="flex items-center justify-center gap-2 w-full h-9 bg-gold/10 border border-gold/20
                       rounded-[10px] text-[12px] text-gold hover:bg-gold/15 transition-colors"
          >
            Scarica template
          </a>
        </div>
      </div>
    </div>
  )
}
