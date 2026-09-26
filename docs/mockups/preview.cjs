// Preview only: serves the design mockup on loopback, with no dependencies.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const page = path.join(__dirname, 'atelier.html');
const server = http.createServer((req, res) => {
  if (req.url !== '/' && req.url !== '/atelier.html') {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  fs.createReadStream(page).pipe(res);
});
server.listen(0, '127.0.0.1', () => console.log(`Lullaby mockup: http://127.0.0.1:${server.address().port}`));
