import React, { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type LatLng = { lat: number; lng: number }

type Props = {
  center: LatLng
  courier?: LatLng | null
  destination?: LatLng | null
  route?: LatLng[] | null
}

function makeDot(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 6px 16px rgba(0,0,0,0.35)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export default function CourierMap({ center, courier, destination, route }: Props) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<{ courier?: L.Marker; dest?: L.Marker; line?: L.Polyline } | null>(null)

  const icons = useMemo(
    () => ({
      courier: makeDot('#f59e0b'),
      dest: makeDot('#22c55e'),
    }),
    [],
  )

  useEffect(() => {
    if (!elRef.current || mapRef.current) return

    const map = L.map(elRef.current, {
      zoomControl: true,
      preferCanvas: true,
    }).setView([center.lat, center.lng], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2,
    }).addTo(map)

    mapRef.current = map
    layersRef.current = {}

    return () => {
      map.remove()
      mapRef.current = null
      layersRef.current = null
    }
  }, [center.lat, center.lng])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const layers = layersRef.current || {}

    if (courier) {
      if (!layers.courier) {
        layers.courier = L.marker([courier.lat, courier.lng], { icon: icons.courier }).addTo(map)
      } else {
        layers.courier.setLatLng([courier.lat, courier.lng])
      }
    }

    if (destination) {
      if (!layers.dest) {
        layers.dest = L.marker([destination.lat, destination.lng], { icon: icons.dest }).addTo(map)
      } else {
        layers.dest.setLatLng([destination.lat, destination.lng])
      }
    }

    if (route && route.length >= 2) {
      const latlngs = route.map((p) => [p.lat, p.lng] as [number, number])
      if (!layers.line) {
        layers.line = L.polyline(latlngs, { color: '#60a5fa', weight: 5, opacity: 0.9 }).addTo(map)
      } else {
        layers.line.setLatLngs(latlngs)
      }
    } else if (layers.line) {
      map.removeLayer(layers.line)
      layers.line = undefined
    }

    layersRef.current = layers
  }, [courier, destination, route, icons])

  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers) return

    if (layers.line) {
      try {
        map.fitBounds(layers.line.getBounds().pad(0.2))
        return
      } catch {
      }
    }
  }, [route])

  return <div ref={elRef} className="h-full w-full rounded-2xl overflow-hidden border border-white/10" />
}

