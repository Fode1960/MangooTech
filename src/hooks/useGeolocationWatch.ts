import { useEffect, useMemo, useRef, useState } from 'react'

export type GeoPosition = {
  lat: number
  lng: number
  accuracy?: number
  heading?: number | null
  speed?: number | null
  timestamp: string
}

export function useGeolocationWatch(enabled: boolean) {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      setError(null)
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current)
        } catch {
        }
      }
      watchIdRef.current = null
      return
    }

    if (!('geolocation' in navigator)) {
      setError('Géolocalisation non supportée par ce navigateur')
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null)
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: typeof pos.coords.heading === 'number' ? pos.coords.heading : null,
          speed: typeof pos.coords.speed === 'number' ? pos.coords.speed : null,
          timestamp: new Date().toISOString(),
        })
      },
      (err) => {
        setError(err?.message || 'Erreur GPS')
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 3000 },
    )

    return () => {
      if (watchIdRef.current !== null) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current)
        } catch {
        }
      }
      watchIdRef.current = null
    }
  }, [enabled])

  return useMemo(() => ({ position, error }), [position, error])
}

