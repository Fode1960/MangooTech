const STORAGE_TOKEN_KEY = 'mangoo_local_sync_token'

const isDev = () => {
  try {
    return Boolean(import.meta.env.DEV)
  } catch {
    return false
  }
}

export const isLocalSyncEnabled = () => {
  try {
    if (!isDev()) return false
    const flag = String(import.meta.env.VITE_LOCAL_SYNC || '').trim()
    if (flag === '0') return false
    if (flag === '1') return true
    return true
  } catch {
    return false
  }
}

export const getLocalSyncToken = () => {
  try {
    return String(localStorage.getItem(STORAGE_TOKEN_KEY) || '').trim()
  } catch {
    return ''
  }
}

export const setLocalSyncToken = (token) => {
  try {
    if (!token) {
      localStorage.removeItem(STORAGE_TOKEN_KEY)
      return
    }
    localStorage.setItem(STORAGE_TOKEN_KEY, String(token))
  } catch {
  }
}

const apiFetch = async (path, init) => {
  const token = getLocalSyncToken()
  const timeoutMs = (() => {
    try {
      const t = Number(init?.timeoutMs)
      if (Number.isFinite(t) && t > 0) return t
      const method = String(init?.method || 'GET').toUpperCase()
      return method === 'GET' ? 4500 : 9000
    } catch {
      return 4500
    }
  })()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    try { controller.abort() } catch {}
  }, timeoutMs)
  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const { timeoutMs: _ignored, ...rest } = init || {}
  const res = await fetch(`/api/local-sync${path}`, {
    ...rest,
    headers,
    signal: controller.signal,
  })
  clearTimeout(timeoutId)

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.success === false) {
    const msg = String(data?.error || res.statusText || 'Erreur API')
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  return data
}

export const localSync = {
  register: async ({ email, password, name }) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    if (data?.token) setLocalSyncToken(data.token)
    return data
  },
  login: async ({ email, password }) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (data?.token) setLocalSyncToken(data.token)
    return data
  },
  me: async () => {
    return apiFetch('/me', { method: 'GET' })
  },
  createShop: async ({ name, category, slug }) => {
    return apiFetch('/shops', {
      method: 'POST',
      body: JSON.stringify({ name, category, slug }),
    })
  },
  myShops: async () => {
    return apiFetch('/shops/mine', { method: 'GET' })
  },
  listShops: async () => {
    return apiFetch('/shops', { method: 'GET' })
  },
  listLocalPlusVendors: async () => {
    return apiFetch('/localplus/vendors', { method: 'GET' })
  },
  getShopBySlug: async (slug) => {
    const s = String(slug || '').trim()
    return apiFetch(`/shops/${encodeURIComponent(s)}`, { method: 'GET' })
  },
  updateShop: async (slug, patch) => {
    const s = String(slug || '').trim()
    return apiFetch(`/shops/${encodeURIComponent(s)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch || {}),
    })
  },
  adminUpdateShopStatus: async (id, status) => {
    const shopId = String(id || '').trim()
    return apiFetch(`/admin/shops/${encodeURIComponent(shopId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}
