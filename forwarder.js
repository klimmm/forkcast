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
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const zlib = require('node:zlib');

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

// the last upstream failures, at GET /__errors: whether a retry on a fresh connection answered (2026-10-11 18:01: 502s
// for a minute after the tunnel reconnected under the same name, with the server up, cause unseen)
const ERRORS = [];
function noteError(req, to, what, retried) {
  ERRORS.push(`${new Date().toISOString()} ${req.method} ${req.url} -> ${to.host}: ${what}${retried ? ' (retry, fresh connection)' : ''}`);
  if (ERRORS.length > 50) ERRORS.shift();
}

// A transfer through the tunnel that stops moving is cut, never waited on for ever (2026-10-23: localhost.run's free
// tunnel carries ~35-60 KB/s, and with a page's ten parallel downloads one of them, ahead.js, stopped for good: the
// page sat at "Planning … almost done", and every reload's same-address request queued behind the stuck one):
// STALL_MS without a byte, or HEAD_MS without an answer. An answer of a known length up to BUFFER_MAX to a GET or HEAD
// (every file and data reply the Forkcast server sends: it always sends Content-Length) is read whole before any of it
// reaches the visitor, so a stalled one is asked again on a fresh connection, up to TRIES times in all; any other is
// streamed as before and cut where it stalls (the visitor sees a broken response, which a reload retries). A change
// (POST, PUT, DELETE) is asked again once at most, and never after a timeout: it may have reached the server.
const STALL_MS = Number(process.env.STALL_MS || 10_000);
const HEAD_MS = Number(process.env.HEAD_MS || 90_000);
const BUFFER_MAX = 8 * 1024 * 1024;
const TRIES = 3;

// The laptop's front end served from here (2026-10-23: through the tunnel's ~50 KB/s a first load took a minute, the
// page blank until its ~800 KB of scripts had crawled through): static/ is a copy of the release the laptop serves
// (forkcast/ui/tools/publish_static.sh, run at public.sh's start), its name in static/RELEASE. A file is served from it
// only while the laptop says it serves that same release (`laptop`: the X-Forkcast-Release of every answer passed
// through, and of its /api/meta every META_MS), so a page never mixes two releases' files with an API; every other
// request, and every request while they differ or are not known, goes to the laptop as before. Only the app's own
// paths (the laptop's access.APP_STATIC, its test files refused), GET only (a HEAD, the app's release and module checks,
// still asks the laptop), with the headers the laptop sends: no-cache with an ETag, gzip where it would.
const STATIC_DIR = path.join(__dirname, 'static');
const APP_STATIC = /^\/(?:m\/.*|js\/m\/.+|js\/plan\/.+|js\/ui\.js|js\/api\.js|js\/vendor\/qr\.js|css\/app\.css|css\/m\.css|css\/m-[a-z0-9-]+\.css|css\/views\/plan-pitch\.css)$/i;
const TYPES = {
  '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};
const GZIP_TYPES = /^(?:text\/|application\/json|application\/javascript|image\/svg\+xml)/;  // the laptop's server.GZIP_TYPES
const META_MS = 15_000;
let laptop = null;

// static/ read once at start: url path -> {body, gz, type, etag}; a directory's index.html also under its own path
function loadStatic() {
  const files = new Map();
  let release = null;
  try {
    release = fs.readFileSync(path.join(STATIC_DIR, 'RELEASE'), 'utf8').trim() || null;
  } catch {
    return { release: null, files };
  }
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      const url = '/' + path.relative(STATIC_DIR, p).split(path.sep).join('/');
      const type = TYPES[path.extname(p).toLowerCase()];
      if (!type || !APP_STATIC.test(url) || /\.test\.mjs$/i.test(url)) continue;
      const body = fs.readFileSync(p);
      const f = {
        body, type,
        gz: GZIP_TYPES.test(type) && body.length >= 1024 ? zlib.gzipSync(body, { level: 6 }) : null,
        etag: `W/"${crypto.createHash('sha1').update(body).digest('hex').slice(0, 16)}"`,
      };
      files.set(url, f);
      if (url.endsWith('/index.html')) files.set(url.slice(0, -'index.html'.length), f);
    }
  };
  walk(STATIC_DIR);
  return { release, files };
}
const STATIC = loadStatic();

// gzip accepted unless its q is 0 (the laptop's server.gzipped)
const gzipOk = (accept) => (accept || '').split(',').some((e) => e.split(';')[0].trim().toLowerCase() === 'gzip' && !/;\s*q=0(\.0*)?\s*$/.test(e.trim()));

// req answered from static/ (true), or left to the laptop (false)
function local(req, res) {
  if (req.method !== 'GET' || !STATIC.release || laptop !== STATIC.release) return false;
  const f = STATIC.files.get(new URL(req.url, 'http://x').pathname);
  if (!f) return false;
  const headers = {
    'cache-control': 'no-cache', etag: f.etag, 'x-forkcast-release': STATIC.release,
    'x-frame-options': 'SAMEORIGIN', 'content-security-policy': "frame-ancestors 'self'",
  };
  if ((req.headers['if-none-match'] || '').split(',').some((t) => t.trim() === f.etag)) {
    res.writeHead(304, headers);
    res.end();
    return true;
  }
  const gz = f.gz && gzipOk(req.headers['accept-encoding']);
  const body = gz ? f.gz : f.body;
  if (gz) Object.assign(headers, { 'content-encoding': 'gzip', vary: 'Accept-Encoding' });
  res.writeHead(200, { ...headers, 'content-type': f.type, 'content-length': body.length });
  res.end(body);
  return true;
}

// the laptop's release, from an answer it gave
function noteRelease(r) {
  const v = r.headers['x-forkcast-release'];
  if (v) laptop = String(v);
}

// its /api/meta every META_MS while static/ holds a release: a release change on the laptop is seen within META_MS
function watchLaptop() {
  if (!STATIC.release) return;
  const tick = async () => {
    const to = await readTarget();
    if (to) {
      const q = https.request({ host: to.hostname, port: Number(to.port) || 443, path: '/api/meta', method: 'GET', servername: to.hostname, headers: { host: to.host } }, (r) => {
        noteRelease(r);
        r.resume();
      });
      q.setTimeout(10_000, () => q.destroy());
      q.on('error', () => {});
      q.end();
    }
    setTimeout(tick, META_MS);
  };
  tick();
}

// A 502/504/530, a connection error or a stall is retried on a fresh connection (no keep-alive socket from before the
// tunnel reconnected) and at the address as re-read, which may have moved; only while nothing has reached the
// visitor: an error after the answer began (a reset mid-body) retried it and wrote the headers twice, which threw
// ERR_HTTP_HEADERS_SENT and took the forwarder down (2026-10-11 15:30:07 UTC, Render's server_failed). `attempt`: the
// tries made before this one.
function forward(req, res, body, to, attempt = 0) {
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) if (!HOP.has(k)) headers[k] = v;
  const own = `https://${req.headers.host}`;
  headers.host = to.host;
  if (req.headers.origin && req.headers.origin.toLowerCase() === own.toLowerCase()) headers.origin = to.origin;
  headers['x-forwarded-host'] = req.headers.host;
  headers['x-forwarded-proto'] = 'https';
  const opts = { host: to.hostname, port: Number(to.port) || 443, method: req.method, path: req.url, headers, servername: to.hostname };
  if (attempt) opts.agent = false;
  const read = req.method === 'GET' || req.method === 'HEAD';
  const tries = read ? TRIES : 2;
  // this try's end, once: a later error, timeout or stall of a try already given up on changes nothing
  let over = false;
  const fail = async (what, up, r, again = true) => {
    if (over) return;
    over = true;
    noteError(req, to, what, attempt > 0);
    r?.destroy();
    up.destroy();
    if (res.headersSent) return res.destroy();  // the answer had begun: cut it, the browser sees a broken response
    if (again && attempt + 1 < tries) return forward(req, res, body, (await readTarget(true)) || to, attempt + 1);
    res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    res.end(`Forkcast is not reachable right now (${what}). Try again in a minute.`);
  };
  const up = https.request(opts, (r) => {
    if (over) return r.destroy();
    // Cloudflare's 530 (error 1033, the tunnel is gone), 502/504 (localhost.run's "no tunnel"): asked again
    if ([502, 504, 530].includes(r.statusCode) && attempt + 1 < tries) return fail(`HTTP ${r.statusCode}`, up, r);
    const len = Number(r.headers['content-length']);
    if (read && Number.isInteger(len) && len <= BUFFER_MAX) {
      return whole(r, req.method === 'HEAD' ? 0 : len, (what) => fail(what, up, r), (buf) => {
        over = true;
        relay(r, res, own, to, buf);
      });
    }
    over = true;
    relay(r, res, own, to);
  });
  up.setTimeout(HEAD_MS, () => fail(`no answer in ${HEAD_MS / 1000} s`, up, null, read));
  up.on('error', (e) => fail(e.code || e.message, up));
  up.end(body);
}

// The answer `r` read whole (`len` bytes): done(its body), or fail(why) where it stops for STALL_MS, ends short or breaks.
function whole(r, len, fail, done) {
  const chunks = [];
  let got = 0;
  let ended = false;
  let timer = setTimeout(() => fail(`stalled at ${got}/${len} B`), STALL_MS);
  const moved = () => {
    clearTimeout(timer);
    timer = setTimeout(() => fail(`stalled at ${got}/${len} B`), STALL_MS);
  };
  r.on('data', (c) => {
    chunks.push(c);
    got += c.length;
    moved();
  });
  r.on('end', () => {
    ended = true;
    clearTimeout(timer);
    if (got !== len) return fail(`ended at ${got}/${len} B`);
    done(Buffer.concat(chunks));
  });
  r.on('error', (e) => fail(e.code || e.message));
  // closed before its end (the tunnel cut it): never left waiting
  r.on('close', () => {
    clearTimeout(timer);
    if (!ended) fail(`closed at ${got}/${len} B`);
  });
}

// The answer to the visitor: `buf` its body read whole, else `r` streamed, cut where it stalls for STALL_MS.
function relay(r, res, own, to, buf = null) {
  noteRelease(r);
  const headers = {};
  for (const [k, v] of Object.entries(r.headers)) if (!HOP.has(k)) headers[k] = v;
  // a redirect to the tunnel's own name comes back under this service's
  if (headers.location && headers.location.startsWith(to.origin)) headers.location = own + headers.location.slice(to.origin.length);
  res.writeHead(r.statusCode, headers);
  if (buf) return res.end(buf);
  r.setTimeout(STALL_MS, () => {
    r.destroy();
    res.destroy();
  });
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
  if (req.url === '/__errors') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(ERRORS.join('\n') + '\n');
  }
  // which forwarder runs (a deploy checked from outside, no laptop involved)
  if (req.url === '/__version') {
    res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
    return res.end(`stall-retry 2026-10-23; static ${STATIC.release || '-'} (${STATIC.files.size} files); laptop ${laptop || '-'}\n`);
  }
  if (req.url === '/__ping') {
    res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
    return res.end(target ? `ok ${target.host}` : 'ok');
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', async () => {
    if (req.url === '/__target' && req.method === 'POST') return pushTarget(req, res, Buffer.concat(chunks));
    if (local(req, res)) return;
    const to = await readTarget();
    if (!to) {
      res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('Forkcast is starting: no address yet. Try again in a minute.');
    }
    forward(req, res, Buffer.concat(chunks), to, false);
  });
}).listen(PORT, () => {
  console.log(`forwarder on :${PORT}, target ${PINNED ? target.origin + ' (TARGET_URL)' : 'from ' + TARGET_SOURCE}, static ${STATIC.release || 'none'} (${STATIC.files.size} files)`);
  readTarget(true);
  watchLaptop();
});
