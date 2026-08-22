/*  Mide el cuadro real de cada logo con Chrome y reescribe su viewBox
 *  bien ajustado. Salida: assets/logos/norm/<marca>.svg, monocromos.
 *
 *    node _medir-logos.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DIR = path.resolve('assets/logos'), OUT = path.join(DIR, 'norm');
fs.mkdirSync(OUT, { recursive: true });

const archivos = fs.readdirSync(DIR).filter(f => f.endsWith('.svg'));
const limpiar = svg => svg
  .replace(/<\?xml[^>]*>/g, '').replace(/<!DOCTYPE[^>]*>/g, '')
  .replace(/<title>[\s\S]*?<\/title>/g, '').replace(/<desc>[\s\S]*?<\/desc>/g, '')
  .replace(/<metadata>[\s\S]*?<\/metadata>/g, '')
  .replace(/\s(width|height)="[^"]*"/g, (m, a, o, s) => '')  /* el tamaño lo pone el CSS */
  .trim();

/* pagina de medicion: cada svg inline con su id */
const cuerpo = archivos.map(f => '<div data-n="' + f.replace('.svg', '') + '">' + limpiar(fs.readFileSync(path.join(DIR, f), 'utf8')) + '</div>').join('\n');
const pagina = '<!doctype html><html><body style="margin:0">' + cuerpo +
  '<pre id="out"></pre><script>' +
  'var r={};document.querySelectorAll("div[data-n]").forEach(function(d){var s=d.querySelector("svg");if(!s){return;}' +
  'try{var b=s.getBBox();r[d.dataset.n]=[b.x,b.y,b.width,b.height];}catch(e){}});' +
  'document.getElementById("out").textContent=JSON.stringify(r);</script></body></html>';
const tmp = path.join(DIR, '_medir.html');
fs.writeFileSync(tmp, pagina, 'utf8');

let dom = '';
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--user-data-dir=' + path.join(require('os').tmpdir(), 'chrome-logos'),
    '--allow-file-access-from-files', '--virtual-time-budget=4000', '--dump-dom',
    'file:///' + tmp.split(path.sep).join('/')], { encoding: 'utf8', timeout: 90000, maxBuffer: 64 * 1024 * 1024 });
} catch (e) { dom = e.stdout ? e.stdout.toString() : ''; }
fs.unlinkSync(tmp);

const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!m) { console.log('  FALLO: Chrome no devolvio medidas'); process.exit(1); }
const medidas = JSON.parse(m[1].replace(/&quot;/g, '"'));

let ok = 0;
archivos.forEach(f => {
  const n = f.replace('.svg', '');
  const b = medidas[n];
  if (!b || b[2] <= 0 || b[3] <= 0) { console.log('  --   ' + n + ' sin medida'); return; }
  const pad = Math.max(b[2], b[3]) * 0.06;
  const vb = [b[0] - pad, b[1] - pad, b[2] + pad * 2, b[3] + pad * 2].map(x => +x.toFixed(2)).join(' ');
  let svg = limpiar(fs.readFileSync(path.join(DIR, f), 'utf8'));
  svg = svg.replace(/<svg([^>]*)>/, (all, attrs) => {
    attrs = attrs.replace(/\sviewBox="[^"]*"/, '').replace(/\s(x|y)="[^"]*"/g, '');
    return '<svg' + attrs + ' viewBox="' + vb + '" aria-hidden="true" focusable="false">';
  });
  fs.writeFileSync(path.join(OUT, f), svg, 'utf8');
  ok++;
});
console.log('  normalizados: ' + ok + ' de ' + archivos.length);
fs.writeFileSync(path.join(OUT, '_medidas.json'), JSON.stringify(medidas), 'utf8');
