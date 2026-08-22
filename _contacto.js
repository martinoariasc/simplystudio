/*  Hoja de contacto numerada de una carpeta de colaboraciones.
 *    node _contacto.js "rolex"   ->  ../_vista/contacto-rolex.png
 */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const B = 'C:/Users/USER/Desktop/Jobs/Productos digitales/simply studio/ig/Feed/colaboraciones';
const marca = process.argv[2];
const dir = path.join(B, marca);
const archivos = fs.readdirSync(dir).filter(f => /\.png$/i.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b));
const celdas = archivos.map(f =>
  '<figure><img src="file:///' + path.join(dir, f).split(path.sep).join('/') + '"><figcaption>' + f.replace('.png', '') + '</figcaption></figure>').join('');
const html = '<!doctype html><html><head><style>body{margin:0;background:#fff;font-family:Arial}' +
  '.g{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;padding:8px;width:1400px}' +
  'figure{margin:0}img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}' +
  'figcaption{font:bold 22px Arial;text-align:center;padding:4px;background:#111;color:#fff}</style></head>' +
  '<body><div class="g">' + celdas + '</div></body></html>';
const tmp = path.resolve('_contacto.html');
fs.writeFileSync(tmp, html, 'utf8');
const alto = Math.ceil(archivos.length / 6) * 330 + 20;
const out = path.resolve('../_vista/contacto-' + marca.replace(/\s+/g, '-') + '.png');
if (fs.existsSync(out)) fs.unlinkSync(out);
try {
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--user-data-dir=' + path.join(require('os').tmpdir(), 'chrome-contacto'),
    '--allow-file-access-from-files', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--virtual-time-budget=20000', '--window-size=1400,' + alto, '--screenshot=' + out,
    'file:///' + tmp.split(path.sep).join('/')], { stdio: 'pipe', timeout: 120000 });
} catch (e) {}
fs.unlinkSync(tmp);
console.log('  ' + (fs.existsSync(out) ? 'OK  ' : 'FALLO  ') + marca + ': ' + archivos.length + ' imagenes');
