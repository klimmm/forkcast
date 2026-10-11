// Forkcast's fixed public address: a forwarder on Render (free web service) in front of the Forkcast server, which
// runs on a laptop behind a Cloudflare quick tunnel whose name changes after a reboot or a long network drop. Every
// request is passed to the tunnel's current address and the answer streamed back, so the address bar keeps this
// service's own name. The current address is the service's TARGET_URL environment variable, which the laptop's
// forkcast/ui/tools/publish_link.sh sets and redeploys with on every new tunnel; without it, target.txt in this
// repo, re-read every TARGET_TTL_MS and at once when the tunnel stops answering (raw.githubusercontent.com serves
// it up to 5 minutes stale, whatever the query string, which is why the variable comes first). A redeploy takes the
// old address with it for ~30-60 s, and localhost.run's free tier renames the tunnel every ~20 minutes, so the laptop
// first POSTs the new address to /__target (Authorization: Bearer PUSH_TOKEN, a variable it sets here): the running
// instance switches at once, and the redeploy only makes the next start begin there.
//
// The Forkcast server refuses a change (POST, PUT, DELETE) whose Origin is not the Host it is served under (its CSRF
// guard). Behind this forwarder the browser's Origin is this service and the Host the tunnel, so this service's own
// Origin, and only that one, is rewritten to the tunnel's: another site's Origin passes through unchanged and is
// refused as before. GET /__ping answers here without touching the laptop: Render's health check. Like the workspace's
// other free services it sleeps after 15 minutes without traffic (they share 750 free instance hours a month).
//
// No dependencies: node forwarder.js (Node 18 or later for fetch).

const crypto = require('node:crypto');
const http = require('node:http');
const https = require('node:https');

const PORT = Number(process.env.PORT || 10000);
const TARGET_SOURCE = process.env.TARGET_SOURCE || 'https://raw.githubusercontent.com/klimmm/forkcast/main/target.txt';
const TARGET_TTL_MS = 60_000;
const RETRY_GAP_MS = 5_000;  // the least time between two forced re-reads after a failure
// hop-by-hop headers (RFC 9110 7.6.1) are this connection's, never forwarded
const HOP = new Set(['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'te', 'trailer', 'upgrade']);

// TARGET_URL is the address this deploy starts at, replaced only by a push to /__target; target.txt is only the
// fallback without it
const PINNED = Boolean(process.env.TARGET_URL);
const PUSH_TOKEN = process.env.PUSH_TOKEN || '';
let target = PINNED ? new URL(process.env.TARGET_URL) : null;  // URL of the tunnel's origin
let readAt = 0;
let forcedAt = 0;

async function readTarget(force = false) {
  if (PINNED) return target;
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

// POST /__target <https origin> with the PUSH_TOKEN: the tunnel's new address, used from the next request on
function pushTarget(req, res, body) {
  const got = Buffer.from(req.headers.authorization || '');
  const want = Buffer.from(`Bearer ${PUSH_TOKEN}`);
  let to = null;
  try {
    to = new URL(body.toString().trim());
  } catch {}
  if (!PUSH_TOKEN || got.length !== want.length || !crypto.timingSafeEqual(got, want)) res.writeHead(403);
  else if (!to || to.protocol !== 'https:') res.writeHead(400);
  else {
    target = new URL(to.origin);
    console.log(`target pushed: ${target.origin}`);
    res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
    return res.end(`ok ${target.host}`);
  }
  res.end();
}

http.createServer((req, res) => {
  if (req.url === '/__ping') {
    res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
    return res.end(target ? `ok ${target.host}` : 'ok');
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', async () => {
    if (req.url === '/__target' && req.method === 'POST') return pushTarget(req, res, Buffer.concat(chunks));
    const to = await readTarget();
    if (!to) {
      res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('Forkcast is starting: no address yet. Try again in a minute.');
    }
    forward(req, res, Buffer.concat(chunks), to, false);
  });
}).listen(PORT, () => {
  console.log(`forwarder on :${PORT}, target ${PINNED ? target.origin + ' (TARGET_URL)' : 'from ' + TARGET_SOURCE}`);
  readTarget(true);
});
