/*  Servidor de vista previa de la landing — puerto 4700.
 *  Soporta peticiones por rango (Range), imprescindible para que el navegador
 *  pueda saltar a un fotograma del video del hero. Vercel ya lo hace nativo.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUERTO = 4700;
const RAIZ = __dirname;

const TIPOS = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.ico':'image/x-icon', '.mp4':'video/mp4', '.webm':'video/webm',
  '.woff2':'font/woff2', '.ttf':'font/ttf',
};

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  const archivo = path.join(RAIZ, url);

  if (!archivo.startsWith(RAIZ) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('No encontrado: ' + url);
  }

  const tipo = TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream';
  const total = fs.statSync(archivo).size;
  const rango = req.headers.range;

  // Sin esto el navegador reporta seekable [0..0] y no puede mover el video con el scroll
  if (rango) {
    const m = /bytes=(\d*)-(\d*)/.exec(rango);
    const inicio = m && m[1] ? parseInt(m[1], 10) : 0;
    const fin = m && m[2] ? parseInt(m[2], 10) : total - 1;
    if (inicio >= total || fin >= total || inicio > fin) {
      res.writeHead(416, { 'Content-Range': 'bytes */' + total });
      return res.end();
    }
    res.writeHead(206, {
      'Content-Type': tipo,
      'Content-Range': 'bytes ' + inicio + '-' + fin + '/' + total,
      'Accept-Ranges': 'bytes',
      'Content-Length': fin - inicio + 1,
      'Cache-Control': 'no-store',
    });
    return fs.createReadStream(archivo, { start: inicio, end: fin }).pipe(res);
  }

  res.writeHead(200, {
    'Content-Type': tipo,
    'Content-Length': total,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(archivo).pipe(res);
}).listen(PUERTO, () => {
  console.log('');
  console.log('   Vista previa de la landing');
  console.log('   ------------------------------------');
  console.log('   Abierta en:  http://localhost:' + PUERTO);
  console.log('   Rama:        ejecutá "git branch --show-current" para saber cuál');
  console.log('');
});
