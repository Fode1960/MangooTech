import type { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

export function getSocketIO(server: HttpServer) {
  const anyServer = server as any
  if (anyServer.__mangoo_socketio) return anyServer.__mangoo_socketio as SocketIOServer
  const io = new SocketIOServer(server, {
    cors: { origin: true, credentials: true },
  })
  anyServer.__mangoo_socketio = io
  return io
}

