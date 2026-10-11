// Forkcast's fixed public address: a forwarder on Render (free web service) in front of the Forkcast server, which
// runs on a laptop behind a Cloudflare quick tunnel whose name changes after a reboot or a long network drop. Every
// request is passed to the tunnel's current address and the answer streamed back, so the address bar keeps this
// service's own name. The current address is target.txt in this repo (written by the laptop's
// forkcast/ui/tools/publish_link.sh), re-read every TARGET_TTL_MS and at once when the tunnel stops answering.
//
// The Forkcast server refuses a change (POST, PUT, DELETE) whose Origin is not the Host it is served under (its CSRF
// guard). Behind this forwarder the browser's Origin is this service and the Host the tunnel, so this service's own
// Origin, and only that one, is rewritten to the tunnel's: another site's Origin passes through unchanged and is
// refused as before. GET /__ping answers here without touching the laptop: Render's health check and the laptop's
// keep-alive (a free service sleeps after 15 minutes without traffic).
//
// No dependencies: node forwarder.js (Node 18 or later for fetch).

const http = require('node:http');
const https = require('node:https');

const PORT = Number(process.env.PORT || 10000);
const TARGET_SOURCE = process.env.TARGET_SOURCE || 'https://raw.githubusercontent.com/klimmm/forkcast/main/target.txt';
const TARGET_TTL_MS = 60_000;
const RETRY_GAP_MS = 5_000;  // the least time between two forced re-reads after a failure
// hop-by-hop headers (RFC 9110 7.6.1) are this connection's, never forwarded
const HOP = new Set(['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'te', 'trailer', 'upgrade']);

let target = null;  // URL of the tunnel's origin
let readAt = 0;
let forcedAt = 0;

async function readTarget(force = false) {
  const now = Date.now();
  if (!force && target && now - readAt < TARGET_TTL_MS) return target;
  if (force && now - forcedAt < RETRY_GAP_MS) return target;
  if (force) forcedAt = now;
  try {
    // a forced read busts the CDN's copy (raw.githubusercontent.com caches up to 5 minutes)
    const res = await fetch(force ? `${TARGET_SOURCE}?t=${now}` : TARGET_SOURCE, { cache: 'no-store' });
    if (res.ok) {
      const url = new URL((await res.text()).trim());
      if (url.protocol === 'https:') target = url;
    }
  } catch (e) {
    console.error(`target not read: ${e.message}`);
  }
  readAt = now;
  return target;
}

function forward(req, res, body, to, retried) {
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) if (!HOP.has(k)) headers[k] = v;
  const own = `https://${req.headers.host}`;
  headers.host = to.host;
  if (req.headers.origin && req.headers.origin.toLowerCase() === own.toLowerCase()) headers.origin = to.origin;
  headers['x-forwarded-host'] = req.headers.host;
  headers['x-forwarded-proto'] = 'https';
  const up = https.request({ host: to.hostname, port: 443, method: req.method, path: req.url, headers, servername: to.hostname }, (r) => {
    // Cloudflare's 530 (error 1033, the tunnel is gone) and 502/504: the address may have moved
    if ([502, 504, 530].includes(r.statusCode) && !retried) {
      r.resume();
      return readTarget(true).then((t) => (t && t.host !== to.host ? forward(req, res, body, t, true) : relay(r, res, own, to)));
    }
    relay(r, res, own, to);
  });
  up.on('error', async (e) => {
    if (!retried) {
      const t = await readTarget(true);
      if (t && t.host !== to.host) return forward(req, res, body, t, true);
    }
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`Forkcast is not reachable right now (${e.code || e.message}). Try again in a minute.`);
  });
  up.end(body);
}

function relay(r, res, own, to) {
  const headers = {};
  for (const [k, v] of Object.entries(r.headers)) if (!HOP.has(k)) headers[k] = v;
  // a redirect to the tunnel's own name comes back under this service's
  if (headers.location && headers.location.startsWith(to.origin)) headers.location = own + headers.location.slice(to.origin.length);
  res.writeHead(r.statusCode, headers);
  r.pipe(res);
}

http.createServer((req, res) => {
  if (req.url === '/__ping') {
    res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
    return res.end(target ? `ok ${target.host}` : 'ok');
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', async () => {
    const to = await readTarget();
    if (!to) {
      res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('Forkcast is starting: no address yet. Try again in a minute.');
    }
    forward(req, res, Buffer.concat(chunks), to, false);
  });
}).listen(PORT, () => {
  console.log(`forwarder on :${PORT}, target from ${TARGET_SOURCE}`);
  readTarget(true);
});
