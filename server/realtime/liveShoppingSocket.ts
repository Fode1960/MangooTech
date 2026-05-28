import type { Server as HttpServer } from 'http'
import { getSocketIO } from './socketio'
import {
  addRoomMessage,
  addRoomOrder,
  getCatalogProducts,
  getOrCreateRoom,
  setRoomFeaturedProduct,
  setRoomLive,
  setRoomProducts,
  setRoomProductsByIds,
} from '../services/localLiveShoppingStore'

type JoinPayload = {
  roomId: string
  role: 'vendor' | 'client'
  userId: string
  userName?: string
}

type SetLivePayload = {
  roomId: string
  live: boolean
}

type SetProductPayload = {
  roomId: string
  productId: string
}

type SetProductsPayload = {
  roomId: string
  productIds?: string[]
  products?: Array<{ id: string; title: string; priceCfa: number; imageUrl?: string; emoji?: string }>
}

type PurchasePayload = {
  roomId: string
  productId: string
  qty?: number
  buyerName?: string
  buyerId?: string
}

type ChatPayload = {
  roomId: string
  text: string
}

export function attachLiveShoppingSocket(server: HttpServer) {
  const io = getSocketIO(server)
  const anyIo = io as any
  if (anyIo.__mangoo_liveShoppingAttached) return
  anyIo.__mangoo_liveShoppingAttached = true

  io.on('connection', (socket) => {
    socket.on('live-shopping:join', (payload: JoinPayload) => {
      const roomId = String(payload?.roomId || '').trim()
      const role = payload?.role === 'vendor' ? 'vendor' : 'client'
      const userId = String(payload?.userId || '').trim() || `user_${Math.random().toString(16).slice(2)}`
      const userName = String(payload?.userName || '').trim() || (role === 'vendor' ? 'Vendeur' : 'Client')
      if (!roomId) return

      socket.data.liveRoomId = roomId
      socket.data.liveRole = role
      socket.data.liveUserId = userId
      socket.data.liveUserName = userName

      socket.join(roomId)

      const room = getOrCreateRoom(roomId)
      const catalogProducts = getCatalogProducts()
      socket.emit('live-shopping:state', {
        roomId,
        live: !!room.live,
        products: room.products,
        catalogProducts,
        featuredProductId: room.featuredProductId,
        ordersCount: Array.isArray(room.orders) ? room.orders.length : 0,
        messages: Array.isArray(room.messages) ? room.messages.slice(0, 30) : [],
      })

      io.to(roomId).emit('live-shopping:presence', {
        roomId,
        userId,
        userName,
        role,
        type: 'join',
      })
    })

    socket.on('live-shopping:set-live', (payload: SetLivePayload) => {
      const roomId = String(payload?.roomId || '').trim()
      if (!roomId) return
      if (socket.data.liveRole !== 'vendor') return
      const next = setRoomLive(roomId, !!payload?.live)
      if (!next) return
      io.to(roomId).emit('live-shopping:live', { roomId, live: !!next.live })
    })

    socket.on('live-shopping:set-product', (payload: SetProductPayload) => {
      const roomId = String(payload?.roomId || '').trim()
      const productId = String(payload?.productId || '').trim()
      if (!roomId || !productId) return
      if (socket.data.liveRole !== 'vendor') return
      const next = setRoomFeaturedProduct(roomId, productId)
      if (!next) return
      io.to(roomId).emit('live-shopping:product', { roomId, featuredProductId: next.featuredProductId })
    })

    socket.on('live-shopping:set-products', (payload: SetProductsPayload, cb?: (resp: any) => void) => {
      const roomId = String(payload?.roomId || '').trim()
      if (!roomId) return
      if (socket.data.liveRole !== 'vendor') return
      const next =
        Array.isArray(payload?.products) && payload.products.length
          ? setRoomProducts(roomId, payload.products as any)
          : setRoomProductsByIds(roomId, Array.isArray(payload?.productIds) ? payload.productIds : [])
      if (!next) {
        try {
          cb?.({ ok: false })
        } catch {
        }
        return
      }
      io.to(roomId).emit('live-shopping:state', {
        roomId,
        live: !!next.live,
        products: next.products,
        catalogProducts: getCatalogProducts(),
        featuredProductId: next.featuredProductId,
        ordersCount: Array.isArray(next.orders) ? next.orders.length : 0,
        messages: Array.isArray(next.messages) ? next.messages.slice(0, 30) : [],
      })
      try {
        cb?.({ ok: true })
      } catch {
      }
    })

    socket.on('live-shopping:purchase', (payload: PurchasePayload, cb?: (resp: any) => void) => {
      const roomId = String(payload?.roomId || '').trim()
      const productId = String(payload?.productId || '').trim()
      const qty = Number.isFinite(payload?.qty as any) ? Math.max(1, Math.floor(Number(payload?.qty))) : 1
      if (!roomId || !productId) return
      const buyerId = String(payload?.buyerId || socket.data.liveUserId || '').trim() || undefined
      const buyerName = String(payload?.buyerName || socket.data.liveUserName || '').trim() || undefined
      const res = addRoomOrder({ roomId, productId, qty, buyerId, buyerName })
      if (!res) {
        try {
          cb?.({ ok: false })
        } catch {
        }
        return
      }
      const { room, order } = res
      io.to(roomId).emit('live-shopping:purchase', {
        roomId,
        order,
        ordersCount: Array.isArray(room.orders) ? room.orders.length : 0,
      })
      try {
        cb?.({ ok: true, orderId: order.id })
      } catch {
      }
    })

    socket.on('live-shopping:chat', (payload: ChatPayload, cb?: (resp: any) => void) => {
      const roomId = String(payload?.roomId || '').trim()
      const text = String(payload?.text || '').trim()
      if (!roomId || !text) {
        try {
          cb?.({ ok: false })
        } catch {
        }
        return
      }
      const fromUserId = String(socket.data.liveUserId || '').trim()
      const fromName = String(socket.data.liveUserName || '').trim()
      const fromRole = socket.data.liveRole === 'vendor' ? 'vendor' : 'client'
      if (!fromUserId || !fromName) {
        try {
          cb?.({ ok: false })
        } catch {
        }
        return
      }
      const res = addRoomMessage({ roomId, fromRole, fromUserId, fromName, text })
      if (!res) {
        try {
          cb?.({ ok: false })
        } catch {
        }
        return
      }
      io.to(roomId).emit('live-shopping:chat', { roomId, message: res.message })
      try {
        cb?.({ ok: true, messageId: res.message.id })
      } catch {
      }
    })

    socket.on('disconnect', () => {
      const roomId = String(socket.data.liveRoomId || '').trim()
      if (!roomId) return
      io.to(roomId).emit('live-shopping:presence', {
        roomId,
        userId: String(socket.data.liveUserId || '').trim(),
        userName: String(socket.data.liveUserName || '').trim(),
        role: socket.data.liveRole === 'vendor' ? 'vendor' : 'client',
        type: 'leave',
      })
    })
  })

  return io
}
