// Keep existing bookmarks working after the move. Preserve paths and queries.
const http = require('node:http');
const destination = 'https://forkcast-fpl.onrender.com';
http.createServer((req, res) => {
  if (req.url === '/__ping') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    return res.end('ok');
  }
  res.writeHead(308, {
    location: destination + req.url,
    'cache-control': 'public, max-age=300',
  });
  res.end();
}).listen(Number(process.env.PORT || 10000));
