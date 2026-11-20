const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./routes');
const storage = require('./storage');
const { setupSockets, setupCron } = require('./realtime');
const { q } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e6 });

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.get(['/health', '/api/health'], async (_req, res) => {
  try {
    await q('SELECT 1');
    res.json({ ok: true, service: 'teamup-api', database: 'connected' });
  } catch {
    res.status(503).json({ ok: false, service: 'teamup-api', database: 'unavailable' });
  }
});
app.use('/api', routes(io));
setupSockets(io);
setupCron(io);

storage.init();
server.listen(3000, '0.0.0.0', () => console.log('Teamup API listening on :3000'));

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
