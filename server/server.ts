/**
 * local server entry file, for local development
 */
import 'dotenv/config'
import { createServer } from 'http'
import app from './app'
import { attachLiveShoppingSocket } from './realtime/liveShoppingSocket'
import { attachInternalMeetSocket } from './realtime/internalMeetSocket'

/**
 * start server with port
 */
const PORT = process.env.PORT || 3045;

let server: any = null
let listenAttempts = 0

const startServer = () => {
  listenAttempts += 1
  const httpServer = createServer(app)
  attachLiveShoppingSocket(httpServer)
  attachInternalMeetSocket(httpServer)
  server = httpServer.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`);
  })
  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE' && listenAttempts <= 10) {
      setTimeout(startServer, 800)
      return
    }
    throw err
  })
}

startServer()

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  if (!server) return process.exit(0)
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  if (!server) return process.exit(0)
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
