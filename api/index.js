import app from '../server/app.ts'

export default function handler(req, res) {
  return app(req, res)
}
