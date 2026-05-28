import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`)
  if (idx >= 0 && idx + 1 < args.length) return String(args[idx + 1] || '').trim()
  return ''
}

const livekitUrl = getArg('url')
const apiKey = getArg('key')
const apiSecret = getArg('secret')
const emails = getArg('emails')

if (!livekitUrl || !apiKey || !apiSecret) {
  process.stderr.write(
    'Usage:\n' +
      '  node scripts/configure-livekit-env.mjs --url <LIVEKIT_URL> --key <LIVEKIT_API_KEY> --secret <LIVEKIT_API_SECRET> [--emails <INTERNAL_TEAM_EMAILS>]\n',
  )
  process.exit(1)
}

const filePath = path.join(process.cwd(), '.env')
const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
const lines = existing.split(/\r?\n/)

const upsert = (key, value) => {
  const prefix = `${key}=`
  const idx = lines.findIndex((l) => String(l || '').startsWith(prefix))
  const nextLine = `${key}=${value}`
  if (idx >= 0) lines[idx] = nextLine
  else lines.push(nextLine)
}

upsert('LIVEKIT_URL', livekitUrl)
upsert('LIVEKIT_API_KEY', apiKey)
upsert('LIVEKIT_API_SECRET', apiSecret)
if (emails) upsert('INTERNAL_TEAM_EMAILS', emails)

const out = lines
  .join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .replace(/\s+$/g, '')
  .trimEnd()
  .concat('\n')

fs.writeFileSync(filePath, out)
process.stdout.write('OK: .env mis à jour (LIVEKIT_*' + (emails ? ' + INTERNAL_TEAM_EMAILS' : '') + ')\n')

