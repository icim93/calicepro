'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, RotateCcw } from 'lucide-react'

type Domanda = {
  id: number
  testo: string
  opzioni: string[]
  corretta: number
  spiegazione: string
}

const DOMANDE: Domanda[] = [
  {
    id: 1,
    testo: "Qual è la temperatura ideale di servizio per un Barolo?",
    opzioni: ["10-12°C", "14-16°C", "18-20°C", "8-10°C"],
    corretta: 2,
    spiegazione: "Il Barolo, vino rosso strutturato, si serve tra i 18-20°C per esaltare i suoi profumi complessi."
  },
  {
    id: 2,
    testo: "Quale vitigno è alla base del Brunello di Montalcino?",
    opzioni: ["Nebbiolo", "Sangiovese Grosso", "Montepulciano", "Aglianico"],
    corretta: 1,
    spiegazione: "Il Brunello di Montalcino è prodotto al 100% con Sangiovese Grosso, localmente chiamato Brunello."
  },
  {
    id: 3,
    testo: "Cosa indica il termine 'PAI' nella degustazione?",
    opzioni: ["Profumo Aromatico Iniziale", "Persistenza Aromatica Intensa", "Percentuale Alcol Indicativa", "Produzione Annuale Imbottigliata"],
    corretta: 1,
    spiegazione: "PAI sta per Persistenza Aromatica Intensa: indica quanto a lungo i sapori rimangono in bocca dopo la deglutizione."
  },
  {
    id: 4,
    testo: "Quale regione produce il Vermentino di Gallura DOCG?",
    opzioni: ["Sicilia", "Toscana", "Sardegna", "Liguria"],
    corretta: 2,
    spiegazione: "Il Vermentino di Gallura DOCG è prodotto nella zona nord-orientale della Sardegna."
  },
  {
    id: 5,
    testo: "In quale fase si valuta la 'consistenza' del vino?",
    opzioni: ["Esame olfattivo", "Esame gustativo", "Esame visivo", "Esame finale"],
    corretta: 2,
    spiegazione: "La consistenza (o fluidità) si valuta nell'esame visivo, osservando le lacrime/archetti sul bicchiere."
  },
  {
    id: 6,
    testo: "Cosa si intende per metodo Charmat?",
    opzioni: [
      "Rifermentazione in bottiglia",
      "Rifermentazione in autoclave",
      "Aggiunta di CO2 esogena",
      "Macerazione carbonica"
    ],
    corretta: 1,
    spiegazione: "Il metodo Charmat prevede la rifermentazione in grandi recipienti a pressione (autoclavi), usato per Prosecco e Lambrusco."
  },
  {
    id: 7,
    testo: "Quale bicchiere è più adatto per degustare uno Champagne?",
    opzioni: ["Coppa", "Flute", "Tulipano", "Ballon"],
    corretta: 2,
    spiegazione: "Il bicchiere a tulipano è preferito dagli esperti perché concentra i profumi, a differenza del flute che li disperde."
  },
  {
    id: 8,
    testo: "Cosa indica 'millesimato' su un vino spumante?",
    opzioni: [
      "È prodotto con uve di un singolo anno",
      "Ha almeno 1000 bottiglie prodotte",
      "È stato affinato per mille giorni",
      "Contiene mille bollicine per cm²"
    ],
    corretta: 0,
    spiegazione: "Millesimato indica che lo spumante è prodotto con uve di una singola annata di particolare qualità."
  },
  {
    id: 9,
    testo: "Quale delle seguenti è una denominazione di origine controllata e garantita (DOCG)?",
    opzioni: ["Chianti", "Verdicchio", "Soave", "Primitivo di Manduria"],
    corretta: 0,
    spiegazione: "Il Chianti Classico è DOCG. Il Primitivo di Manduria è DOC, mentre Verdicchio e Soave sono DOC."
  },
  {
    id: 10,
    testo: "Il Gewürztraminer è un vitigno tipico di quale zona italiana?",
    opzioni: ["Friuli", "Alto Adige", "Veneto", "Piemonte"],
    corretta: 1,
    spiegazione: "Il Gewürztraminer (o Traminer Aromatico) è tipico dell'Alto Adige, dove il paese di Tramin gli ha dato il nome."
  },
]

type Fase = 'intro' | 'quiz' | 'risultato'

export default function StudenteQuiz() {
  const router = useRouter()
  const [fase, setFase] = useState<Fase>('intro')
  const [corrente, setCorrente] = useState(0)
  const [risposte, setRisposte] = useState<(number | null)[]>(Array(DOMANDE.length).fill(null))
  const [selezionata, setSelezionata] = useState<number | null>(null)
  const [confermata, setConfermata] = useState(false)

  function inizia() {
    setFase('quiz')
    setCorrente(0)
    setRisposte(Array(DOMANDE.length).fill(null))
    setSelezionata(null)
    setConfermata(false)
  }

  function conferma() {
    if (selezionata === null) return
    const nuove = [...risposte]
    nuove[corrente] = selezionata
    setRisposte(nuove)
    setConfermata(true)
  }

  function avanti() {
    if (corrente < DOMANDE.length - 1) {
      setCorrente(c => c + 1)
      setSelezionata(null)
      setConfermata(false)
    } else {
      setFase('risultato')
    }
  }

  const domanda = DOMANDE[corrente]
  const punteggio = risposte.filter((r, i) => r === DOMANDE[i].corretta).length
  const pct = Math.round((punteggio / DOMANDE.length) * 100)

  // ── INTRO ──
  if (fase === 'intro') {
    return (
      <div className="min-h-screen pb-10">
        <div className="flex items-center gap-3 px-5 pt-14 pb-4">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                       flex items-center justify-center text-cream/60">
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-serif text-2xl text-cream">Simulatore Quiz</h1>
        </div>

        <div className="px-4">
          <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-6 mb-4 text-center">
            <p className="text-5xl mb-4">🍷</p>
            <p className="font-serif text-2xl text-cream mb-2">Preparati all'esame</p>
            <p className="text-sm text-cream/50 mb-6 leading-relaxed">
              {DOMANDE.length} domande sulla tecnica di degustazione,
              vitigni e denominazioni italiane.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { val: `${DOMANDE.length}`, label: 'Domande' },
                { val: '~10', label: 'Minuti' },
                { val: '70%', label: 'Soglia' },
              ].map(k => (
                <div key={k.label}
                  className="bg-surf3 border border-white/[0.05] rounded-[12px] p-3">
                  <p className="font-serif text-2xl text-gold">{k.val}</p>
                  <p className="text-[10px] text-cream/40 mt-1">{k.label}</p>
                </div>
              ))}
            </div>
            <button onClick={inizia}
              className="w-full h-[52px] bg-gradient-to-br from-bx-l via-bx to-bx-d
                         border border-gold/20 rounded-[14px]
                         text-[13px] font-semibold text-cream
                         transition-all active:scale-[0.98]">
              Inizia il quiz →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── RISULTATO ──
  if (fase === 'risultato') {
    const superato = pct >= 70
    return (
      <div className="min-h-screen pb-10">
        <div className="flex items-center gap-3 px-5 pt-14 pb-4">
          <button onClick={() => setFase('intro')}
            className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                       flex items-center justify-center text-cream/60">
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-serif text-2xl text-cream">Risultato</h1>
        </div>

        <div className="px-4">
          {/* SCORE CARD */}
          <div className={`rounded-[18px] p-6 mb-4 text-center border
            ${superato
              ? 'bg-success/10 border-success/25'
              : 'bg-danger/10 border-danger/25'}`}>
            <p className="text-5xl mb-3">{superato ? '🎉' : '📚'}</p>
            <p className="font-serif text-5xl mb-2"
              style={{ color: superato ? '#5DBF7A' : '#E06060' }}>
              {pct}%
            </p>
            <p className="font-serif text-xl text-cream mb-1">
              {superato ? 'Ottimo risultato!' : 'Continua a studiare'}
            </p>
            <p className="text-sm text-cream/50">
              {punteggio} risposte corrette su {DOMANDE.length}
            </p>
          </div>

          {/* RIEPILOGO DOMANDE */}
          <p className="section-label text-gold-d">Riepilogo risposte</p>
          <div className="flex flex-col gap-2 mb-4">
            {DOMANDE.map((d, i) => {
              const corretta = risposte[i] === d.corretta
              return (
                <div key={d.id}
                  className={`rounded-[14px] p-3 border
                    ${corretta
                      ? 'bg-success/5 border-success/15'
                      : 'bg-danger/5 border-danger/15'}`}>
                  <div className="flex items-start gap-2">
                    <span className={`text-sm flex-shrink-0 mt-0.5
                      ${corretta ? 'text-success' : 'text-danger'}`}>
                      {corretta ? '✓' : '✕'}
                    </span>
                    <div>
                      <p className="text-[12px] text-cream/80 mb-1">{d.testo}</p>
                      {!corretta && (
                        <p className="text-[11px] text-cream/40">
                          Risposta: <span className="text-success">{d.opzioni[d.corretta]}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={inizia}
            className="w-full h-[52px] bg-surf2 border border-white/[0.055]
                       rounded-[14px] text-[13px] text-cream/70
                       flex items-center justify-center gap-2
                       transition-all active:scale-[0.98]">
            <RotateCcw size={16} /> Ripeti il quiz
          </button>
        </div>
      </div>
    )
  }

  // ── QUIZ ──
  const progressoPct = ((corrente + 1) / DOMANDE.length) * 100

  return (
    <div className="min-h-screen pb-10">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-3">
        <button onClick={() => setFase('intro')}
          className="w-9 h-9 rounded-xl bg-surf2 border border-white/[0.055]
                     flex items-center justify-center text-cream/60">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-[11px] text-cream/40 mb-1.5">
            <span>Domanda {corrente + 1} di {DOMANDE.length}</span>
            <span>{Math.round(progressoPct)}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gold/70 rounded-full transition-all duration-300"
              style={{ width: `${progressoPct}%` }} />
          </div>
        </div>
      </div>

      <div className="px-4 pt-2">
        {/* DOMANDA */}
        <div className="bg-surf2 border border-white/[0.055] rounded-[18px] p-5 mb-4">
          <p className="font-serif text-[18px] text-cream leading-snug">
            {domanda.testo}
          </p>
        </div>

        {/* OPZIONI */}
        <div className="flex flex-col gap-2 mb-4">
          {domanda.opzioni.map((opzione, idx) => {
            let stile = 'border-white/[0.07] text-cream/70'
            if (confermata) {
              if (idx === domanda.corretta) stile = 'border-success/50 bg-success/10 text-success'
              else if (idx === selezionata) stile = 'border-danger/50 bg-danger/10 text-danger'
              else stile = 'border-white/[0.04] text-cream/30'
            } else if (selezionata === idx) {
              stile = 'border-gold bg-gold/10 text-gold'
            }

            return (
              <button key={idx}
                onClick={() => !confermata && setSelezionata(idx)}
                disabled={confermata}
                className={`w-full p-4 rounded-[14px] border text-left text-[13px]
                            transition-all active:scale-[0.98] ${stile}`}>
                <span className="text-cream/30 mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opzione}
              </button>
            )
          })}
        </div>

        {/* SPIEGAZIONE */}
        {confermata && (
          <div className="bg-surf2 border border-white/[0.055] rounded-[14px] p-4 mb-4">
            <p className="text-[10px] text-gold/60 uppercase tracking-[0.5px] mb-1.5">
              💡 Spiegazione
            </p>
            <p className="text-[12px] text-cream/70 leading-relaxed">
              {domanda.spiegazione}
            </p>
          </div>
        )}

        {/* CTA */}
        {!confermata ? (
          <button onClick={conferma} disabled={selezionata === null}
            className="w-full h-[52px] bg-gradient-to-br from-bx-l via-bx to-bx-d
                       border border-gold/20 rounded-[14px]
                       text-[13px] font-semibold text-cream
                       disabled:opacity-40 transition-all active:scale-[0.98]">
            Conferma risposta
          </button>
        ) : (
          <button onClick={avanti}
            className="w-full h-[52px] bg-gold/15 border border-gold/30
                       rounded-[14px] text-[13px] font-semibold text-gold
                       transition-all active:scale-[0.98]">
            {corrente < DOMANDE.length - 1 ? 'Prossima domanda →' : 'Vedi risultato →'}
          </button>
        )}
      </div>
    </div>
  )
}