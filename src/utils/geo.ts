export type LatLng = { lat: number; lng: number }

export type RegionKey = 'cm' | 'ci' | 'sn'

export function detectRegionKey(p: LatLng): RegionKey | null {
  const { lat, lng } = p
  if (lat >= 1.6 && lat <= 13.1 && lng >= 8.4 && lng <= 16.2) return 'cm'
  if (lat >= 4.3 && lat <= 10.8 && lng >= -8.6 && lng <= -2.5) return 'ci'
  if (lat >= 12.3 && lat <= 16.7 && lng >= -17.6 && lng <= -11.3) return 'sn'
  return null
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const s1 = Math.sin(dLat / 2)
  const s2 = Math.sin(dLng / 2)
  const h = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

function toXYMeters(p: LatLng, origin: LatLng): { x: number; y: number } {
  const R = 6371000
  const lat0 = toRadians(origin.lat)
  const x = toRadians(p.lng - origin.lng) * R * Math.cos(lat0)
  const y = toRadians(p.lat - origin.lat) * R
  return { x, y }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function distancePointToSegmentMeters(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const apx = p.x - a.x
  const apy = p.y - a.y
  const denom = abx * abx + aby * aby
  if (denom <= 0) return Math.hypot(apx, apy)
  const t = clamp((apx * abx + apy * aby) / denom, 0, 1)
  const projx = a.x + t * abx
  const projy = a.y + t * aby
  return Math.hypot(p.x - projx, p.y - projy)
}

export function distanceToLineStringMeters(point: LatLng, line: LatLng[]): number {
  if (!line || line.length < 2) return Number.POSITIVE_INFINITY
  const origin = line[0]
  const pxy = toXYMeters(point, origin)

  let min = Number.POSITIVE_INFINITY
  for (let i = 0; i < line.length - 1; i += 1) {
    const a = toXYMeters(line[i], origin)
    const b = toXYMeters(line[i + 1], origin)
    const d = distancePointToSegmentMeters(pxy, a, b)
    if (d < min) min = d
  }
  return min
}
