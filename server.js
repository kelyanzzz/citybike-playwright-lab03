'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 4173);
const publicDir = path.join(__dirname, 'public');
const stations = [
  { id: 'central', name: 'Central Square', bikes: 8, docks: 4 },
  { id: 'riverside', name: 'Riverside Park', bikes: 0, docks: 12 },
  { id: 'market', name: 'Market Street', bikes: 3, docks: 6 },
  { id: 'campus', name: 'Campus North', bikes: 1, docks: 7 }
];

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'application/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']]
]);

http.createServer((req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  if (req.method === 'GET' && pathname === '/health') return send(res, 200, { ok: true });
  if (req.method === 'GET' && pathname === '/api/stations') return send(res, 200, { stations });
  if (req.method === 'POST' && pathname === '/api/reservations') {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 10000) req.destroy(); });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); } catch { return send(res, 400, { error: 'Invalid JSON' }); }
      const station = stations.find(s => s.id === payload?.stationId);
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload?.email || '');
      if (!station || station.bikes < 1 || !validEmail) {
        return send(res, 422, { error: 'Reservation cannot be completed' });
      }
      return send(res, 201, { reservationId: 'CB-' + station.id.toUpperCase(), stationId: station.id });
    });
    return;
  }
  if (req.method === 'GET' && assets.has(pathname)) {
    const [file, mime] = assets.get(pathname);
    try {
      res.writeHead(200, { 'Content-Type': mime });
      res.end(fs.readFileSync(path.join(publicDir, file)));
    } catch {
      res.writeHead(500); res.end('Server error');
    }
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}).listen(PORT, '127.0.0.1', () => console.log(`CityBike QA lab on http://127.0.0.1:${PORT}`));
