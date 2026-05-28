import fs from 'fs'
import path from 'path'

export type VoicemailKind = 'voice' | 'callback'
export type VoicemailStatus = 'new' | 'read'
export type CallbackPreferred = 'pstn' | 'connectplus'

export type VoicemailMessage = {
  id: string
  roomId: string
  kind: VoicemailKind
  status: VoicemailStatus
  createdAt: string
  fromRole?: string
  fromUserId?: string
  fromLabel?: string
  callbackPreferred?: CallbackPreferred
  connectPlusId?: string
  phone?: string
  name?: string
  dataUrl?: string
}

type StoreShape = {
  messages: VoicemailMessage[]
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data')
const STORE_PATH = path.join(DATA_DIR, 'local-voicemail.json')

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readStore(): StoreShape {
  ensureDir()
  try {
    if (!fs.existsSync(STORE_PATH)) return { messages: [] }
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw || '{}') as Partial<StoreShape>
    const messages = Array.isArray(parsed.messages) ? (parsed.messages as VoicemailMessage[]) : []
    return { messages }
  } catch {
    return { messages: [] }
  }
}

function writeStore(next: StoreShape) {
  ensureDir()
  const tmp = `${STORE_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8')
  fs.renameSync(tmp, STORE_PATH)
}

function newId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function listVoicemailMessages(params: { roomId?: string; status?: VoicemailStatus }) {
  const { roomId, status } = params
  const store = readStore()
  let list = store.messages.slice()
  if (roomId) list = list.filter((m) => m.roomId === roomId)
  if (status) list = list.filter((m) => m.status === status)
  list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return list
}

export function addVoicemailMessage(input: Omit<VoicemailMessage, 'id' | 'createdAt' | 'status'>) {
  const store = readStore()
  const message: VoicemailMessage = {
    id: newId(),
    createdAt: new Date().toISOString(),
    status: 'new',
    ...input,
  }
  store.messages.unshift(message)
  writeStore(store)
  return message
}

export function markVoicemailMessageRead(id: string) {
  const store = readStore()
  const idx = store.messages.findIndex((m) => m.id === id)
  if (idx < 0) return null
  store.messages[idx] = { ...store.messages[idx], status: 'read' }
  writeStore(store)
  return store.messages[idx]
}
