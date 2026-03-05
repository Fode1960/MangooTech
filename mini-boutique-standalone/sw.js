const CACHE_NAME = 'mini-boutique-v1'
const ASSETS = [
  '/',
  '/index.html',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : null)))
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  // Ne pas intercepter les requêtes non-GET (POST/PUT/PATCH/DELETE)
  if (req.method !== 'GET') return
  event.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((res) => {
        const resClone = res.clone()
        // Éviter de mettre en cache les endpoints dynamiques/API et ne cache que les réponses OK du même origin
        const isSameOrigin = req.url.startsWith(self.location.origin)
        const isApi = /\/api\//.test(req.url)
        if (res.ok && isSameOrigin && !isApi) {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {})
        }
        return res
      }).catch(() => cached)
    )
  )
})
