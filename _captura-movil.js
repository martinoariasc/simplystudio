/*  Pantallas de celular (390x844) de _nueva.html y una hoja con todas.
 *    node _captura-movil.js        -> ../_vista/movil-<pantalla>.png + ../_vista/movil-hoja.png
 *  El Chrome sin pantalla no baja de ~500px de ancho, asi que la pagina
 *  se carga dentro de un iframe de 390px: ahi si rigen las medidas de celular.
 */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = 390, H = 844;
const base = fs.readFileSync('_nueva.html', 'utf8')
  .replace(/loading="lazy"/g, 'loading="eager"').replace(/decoding="async"/g, 'decoding="sync"');
const quieto = '<style>*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}.reveal,.v2-sube{opacity:1!important;transform:none!important}</style>';
const PANTALLAS = [
  ['inicio', null, 0], ['hero-texto', '.v2-hero-sub', -90], ['marcas', '.v2-marcas', -260],
  ['galeria', '.showcase', -40], ['galeria-2', '.showcase', 560], ['problema', '.pain', -20],
  ['caso', '.case', 300], ['caso-anuncios', '.case-grid', -60], ['pasos', '.v2-como', -40],
  ['sistema', '.inside', 80], ['nichos', '.audience', 380], ['opiniones', '.proof', 60],
  ['oferta', '.offer', -10], ['precio', '.price-card', -40], ['garantia', '.guarantee', 0], ['faq', '.faq', 0],
];
const run = (w, h, tmp, out) => {
  if (fs.existsSync(out)) fs.unlinkSync(out);
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
      '--user-data-dir=' + path.join(require('os').tmpdir(), 'chrome-cap'),
      '--allow-file-access-from-files', '--hide-scrollbars', '--force-device-scale-factor=1',
      '--virtual-time-budget=9000', '--window-size=' + w + ',' + h, '--screenshot=' + out,
      'file:///' + tmp.split(path.sep).join('/')], { stdio: 'pipe', timeout: 90000 });
  } catch (e) {}
  return fs.existsSync(out);
};
const hechas = [];
PANTALLAS.forEach(([nombre, sel, off]) => {
  const inyect = sel
    ? '<script>addEventListener("load",function(){var e=document.querySelector(' + JSON.stringify(sel) + ');if(e){var y=e.getBoundingClientRect().top+scrollY+(' + off + ');document.body.style.marginTop=(-y)+"px";document.body.style.overflow="hidden";var h=document.querySelector("header");if(h)h.style.display="none";var a=document.querySelector(".announcement");if(a)a.style.display="none";}});</script>'
    : '';
  const interno = path.resolve('_cap_m_' + nombre + '.html');
  fs.writeFileSync(interno, base.replace('</body>', quieto + inyect + '</body>'), 'utf8');
  const wrap = path.resolve('_wrap_' + nombre + '.html');
  fs.writeFileSync(wrap, '<!doctype html><html><head><style>html,body{margin:0;background:#111}iframe{display:block;width:' + W + 'px;height:' + H + 'px;border:0}</style></head><body><iframe src="' + path.basename(interno) + '"></iframe></body></html>', 'utf8');
  const out = path.resolve('../_vista/movil-' + nombre + '.png');
  const ok = run(500, H, wrap, out);
  fs.unlinkSync(interno); fs.unlinkSync(wrap);
  console.log('  ' + (ok ? 'OK  ' : 'FALLO  ') + nombre);
  if (ok) hechas.push([nombre, out]);
});

/* hoja: todas las pantallas a escala, con su nombre; la captura de 500px se recorta a 390 via object-position */
const COLS = 4, ESC = .5, cw = Math.round(W * ESC), ch = Math.round(H * ESC), pad = 16, cap = 22;
const celdas = hechas.map(([n, f]) =>
  '<figure><div class="tel"><img src="file:///' + f.split(path.sep).join('/') + '"></div><figcaption>' + n + '</figcaption></figure>').join('');
const filas = Math.ceil(hechas.length / COLS);
const hojaW = COLS * (cw + pad) + pad, hojaH = filas * (ch + cap + pad) + pad;
const hoja = '<!doctype html><html><head><style>html,body{margin:0;background:#F3EFE7;font-family:Arial}' +
  '.g{display:grid;grid-template-columns:repeat(' + COLS + ',' + cw + 'px);gap:' + pad + 'px;padding:' + pad + 'px;width:' + hojaW + 'px;box-sizing:border-box}' +
  'figure{margin:0}.tel{width:' + cw + 'px;height:' + ch + 'px;overflow:hidden;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.18);background:#111}' +
  '.tel img{width:' + Math.round(500 * ESC) + 'px;height:' + ch + 'px;display:block;object-fit:cover;object-position:left top}' +
  'figcaption{font:12px/1 Arial;color:#555;text-align:center;padding:6px 0 0;height:' + (cap - 6) + 'px}</style></head>' +
  '<body><div class="g">' + celdas + '</div></body></html>';
const tmpH = path.resolve('_hoja_movil.html');
fs.writeFileSync(tmpH, hoja, 'utf8');
const outH = path.resolve('../_vista/movil-hoja.png');
const okH = run(hojaW, hojaH, tmpH, outH);
fs.unlinkSync(tmpH);
console.log('  ' + (okH ? 'OK  ' : 'FALLO  ') + 'hoja ' + hojaW + 'x' + hojaH);
