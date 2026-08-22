/*  Convierte a WebP usando el codificador de Chrome (canvas.toDataURL).
 *  No hace falta ffmpeg con libwebp ni Python.
 *
 *    node _webp.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CARPETAS = ['assets/colabs', 'assets/deco', 'assets/fondos', 'assets/caso-nike'];
const CALIDAD = { 'assets/colabs': 0.8, 'assets/deco': 0.72, 'assets/fondos': 0.82, 'assets/caso-nike': 0.8 };

const trabajos = [];
CARPETAS.forEach(c => {
  if (!fs.existsSync(c)) return;
  fs.readdirSync(c).filter(f => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('_')).forEach(f => {
    const src = path.resolve(c, f), dst = path.resolve(c, f.replace(/\.(jpe?g|png)$/i, '.webp'));
    if (!(fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(src).mtimeMs)) trabajos.push({ src, dst, q: CALIDAD[c] || 0.8 });
    if (c === 'assets/colabs') {
      const dstM = dst.replace(/.webp$/, '-m.webp');
      if (!fs.existsSync(dstM) || fs.statSync(dstM).mtimeMs < fs.statSync(src).mtimeMs) trabajos.push({ src, dst: dstM, q: 0.78, w: 600 });
    }
  });
});
console.log('  a convertir: ' + trabajos.length);
if (!trabajos.length) process.exit(0);

/* de a 12 por pagina para que el DOM no sea gigante */
for (let i = 0; i < trabajos.length; i += 12) {
  const lote = trabajos.slice(i, i + 12);
  const items = lote.map((t, k) => '{src:"file:///' + t.src.split(path.sep).join('/') + '",q:' + t.q + ',k:' + k + ',w:' + (t.w || 0) + '}').join(',');
  const html = '<!doctype html><html><body><script>' +
    'var L=[' + items + '],out=[];var pend=L.length;' +
    'L.forEach(function(t){var im=new Image();im.onload=function(){var c=document.createElement("canvas");var W=t.w&&t.w<im.naturalWidth?t.w:im.naturalWidth;c.width=W;c.height=Math.round(im.naturalHeight*W/im.naturalWidth);' +
    'var g=c.getContext("2d");g.imageSmoothingQuality="high";g.drawImage(im,0,0,c.width,c.height);out[t.k]=c.toDataURL("image/webp",t.q);if(--pend===0)listo();};im.onerror=function(){out[t.k]="";if(--pend===0)listo();};im.src=t.src;});' +
    'function listo(){var p=document.createElement("pre");p.id="out";p.textContent=JSON.stringify(out);document.body.appendChild(p);}' +
    '</script></body></html>';
  const tmp = path.resolve('_webp_tmp.html');
  fs.writeFileSync(tmp, html, 'utf8');
  let dom = '';
  try {
    dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
      '--user-data-dir=' + path.join(require('os').tmpdir(), 'chrome-webp'),
      '--allow-file-access-from-files', '--virtual-time-budget=30000', '--dump-dom',
      'file:///' + tmp.split(path.sep).join('/')], { encoding: 'utf8', timeout: 180000, maxBuffer: 256 * 1024 * 1024 });
  } catch (e) { dom = e.stdout ? e.stdout.toString() : ''; }
  fs.unlinkSync(tmp);
  const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!m) { console.log('  FALLO en el lote ' + (i / 12 + 1)); continue; }
  const datos = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  lote.forEach((t, k) => {
    const d = datos[k];
    if (!d || !d.startsWith('data:image/webp')) { console.log('  --   ' + path.basename(t.src)); return; }
    fs.writeFileSync(t.dst, Buffer.from(d.split(',')[1], 'base64'));
  });
  console.log('  lote ' + (i / 12 + 1) + ' listo');
}

/* balance */
let antes = 0, despues = 0, n = 0;
trabajos.forEach(t => { if (fs.existsSync(t.dst)) { antes += fs.statSync(t.src).size; despues += fs.statSync(t.dst).size; n++; } });
console.log('  ' + n + ' archivos: ' + Math.round(antes / 1024) + ' KB -> ' + Math.round(despues / 1024) + ' KB  (' + Math.round((1 - despues / antes) * 100) + '% menos)');
