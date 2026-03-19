import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mic2, Square, Volume2 } from 'lucide-react'
import type { LatLng } from '../../utils/geo'
import { haversineMeters } from '../../utils/geo'

type OsrmStep = {
  distance?: number
  name?: string
  maneuver?: {
    type?: string
    modifier?: string
    exit?: number
    location?: [number, number]
  }
}

type Props = {
  enabled: boolean
  onToggle: (next: boolean) => void
  courier: LatLng | null
  steps: OsrmStep[]
}

function fmtMeters(m: number | undefined): string {
  const n = typeof m === 'number' ? m : NaN
  if (!Number.isFinite(n)) return ''
  if (n < 900) return `${Math.round(n)} m`
  return `${(n / 1000).toFixed(1)} km`
}

function stepToFrench(step: OsrmStep): string {
  const dist = fmtMeters(step.distance)
  const man = step.maneuver || {}
  const type = String(man.type || '').toLowerCase()
  const mod = String(man.modifier || '').toLowerCase()
  const road = String(step.name || '').trim()

  const modMap: Record<string, string> = {
    left: 'à gauche',
    right: 'à droite',
    'slight left': 'légèrement à gauche',
    'slight right': 'légèrement à droite',
    'sharp left': 'fortement à gauche',
    'sharp right': 'fortement à droite',
    straight: 'tout droit',
    uturn: 'demi-tour',
  }
  const dir = modMap[mod] || ''
  const on = road ? ` sur ${road}` : ''

  if (type === 'depart') return `Départ${on}.`
  if (type === 'arrive') return `Arrivée.`
  if (type === 'roundabout' || type === 'rotary') {
    const exit = Number(man.exit)
    const exitText = Number.isFinite(exit) ? ` prenez la ${exit}e sortie` : ' prenez une sortie'
    return `${dist ? 'Dans ' + dist + ',' : 'Maintenant,'} au rond-point,${exitText}${on}.`
  }

  if (dir) return `${dist ? 'Dans ' + dist + ',' : 'Maintenant,'} tournez ${dir}${on}.`
  if (road) return `${dist ? 'Dans ' + dist + ',' : ''} continuez${on}.`
  return `${dist ? 'Dans ' + dist + ',' : ''} continuez.`
}

function stopSpeech() {
  try {
    window.speechSynthesis.cancel()
  } catch {
  }
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(String(text || ''))
  u.lang = 'fr-FR'
  u.rate = 1
  u.pitch = 1
  window.speechSynthesis.speak(u)
}

export default function VoiceGuidance({ enabled, onToggle, courier, steps }: Props) {
  const [lastSpoken, setLastSpoken] = useState<string>('')
  const spokenRef = useRef<Set<number>>(new Set())
  const nextIdxRef = useRef<number>(0)

  const stepTexts = useMemo(() => steps.map(stepToFrench).filter(Boolean), [steps])

  const reset = useCallback(() => {
    spokenRef.current = new Set()
    nextIdxRef.current = 0
    setLastSpoken('')
    stopSpeech()
  }, [])

  useEffect(() => {
    reset()
  }, [reset, steps])

  useEffect(() => {
    if (!enabled) {
      stopSpeech()
      return
    }
    if (!courier) return
    if (!steps.length) return

    const idx = nextIdxRef.current
    const step = steps[idx]
    const loc = step?.maneuver?.location
    if (!loc) return
    const target = { lat: loc[1], lng: loc[0] }
    const d = haversineMeters(courier, target)

    if (d < 110 && !spokenRef.current.has(idx)) {
      const t = stepToFrench(step)
      spokenRef.current.add(idx)
      nextIdxRef.current = Math.min(idx + 1, steps.length - 1)
      setLastSpoken(t)
      speak(t)
    }
  }, [enabled, courier, steps])

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/40 overflow-hidden">
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Guidage vocal
          </div>
          <div className="text-xs text-zinc-300">Démo: annonce à ~110m des manœuvres</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !enabled
              onToggle(next)
              if (!next) stopSpeech()
            }}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs border ${
              enabled
                ? 'bg-emerald-500 text-emerald-950 border-emerald-400/30 hover:bg-emerald-400'
                : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
            }`}
          >
            <Mic2 className="w-4 h-4" />
            {enabled ? 'Actif' : 'Inactif'}
          </button>
          <button
            type="button"
            onClick={() => {
              reset()
              stopSpeech()
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black"
            title="Stop"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs text-zinc-300">Dernière instruction</div>
        <div className="mt-1 text-sm font-black">{lastSpoken || '—'}</div>
        <div className="mt-3 max-h-48 overflow-auto rounded-xl border border-white/10 bg-white/5">
          {stepTexts.length === 0 ? (
            <div className="p-3 text-sm text-zinc-300">Aucune instruction disponible.</div>
          ) : (
            stepTexts.map((t, i) => (
              <div key={i} className="px-3 py-2 text-xs text-zinc-200 border-b border-white/10">{t}</div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

