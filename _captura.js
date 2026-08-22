/*  Capturas de _nueva.html con Chrome headless.
 *    node _captura.js            -> ../_vista/v7-*.png
 *  Cada captura es una copia temporal de la pagina que arranca ya
 *  desplazada a la seccion pedida (los #hash no son confiables en headless).
 */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = fs.readFileSync('_nueva.html', 'utf8');
const VISTAS = [
  ['hero', 1440, 1000, null],
  ['barra', 1440, 160, null],
  ['movil-barra', 500, 220, null],
  ['alto', 1440, 3200, null],
  ['hero-texto', 1440, 620, '.v2-hero-sub', -150],
  ['movil-hero-texto', 500, 760, '.v2-hero-sub', -120],
  ['marcas', 1440, 700, '.v2-marcas', -120],
  ['galeria', 1440, 1000, '.showcase', 0],
  ['galeria-pista', 1440, 700, '.v2-gal-nota', -560],
  ['problema', 1440, 1000, '.pain', 0],
  ['caso', 1440, 1400, '.case', 0],
  ['pasos', 1440, 1100, '.v2-como', -80],
  ['nichos', 1440, 1000, '.audience', 0],
  ['opiniones', 1440, 1000, '.proof', 0],
  ['oferta', 1440, 1100, '.offer', 0],
  ['precio', 1440, 1000, '.price-card', -60],
  ['cta-sistema', 1440, 500, '.inside .v2-cta', -200],
  ['faq', 1440, 800, '.faq', -140],
  ['movil-faq', 500, 900, '.faq', -120],
  ['movil-hero', 500, 1000, null],
  ['movil-caso', 500, 1400, '.case', 0],
  ['movil-nichos', 500, 1400, '.audience', 0],
  ['movil-sistema', 500, 1400, '.inside', 0],
  ['movil-opiniones', 500, 1200, '.proof', 0],
  ['sistema', 1440, 1100, '.inside', 0],
];
const solo = process.argv.slice(2);
VISTAS.filter(v => !solo.length || solo.includes(v[0])).forEach(([nombre, w, h, sel, off]) => {
  const inyect = sel
    ? '<script>addEventListener("load",function(){var e=document.querySelector(' + JSON.stringify(sel) + ');if(e){var y=e.getBoundingClientRect().top+scrollY+(' + (off || 0) + ');document.body.style.marginTop=(-y)+"px";document.body.style.overflow="hidden";var h=document.querySelector("header");if(h)h.style.display="none";var a=document.querySelector(".announcement");if(a)a.style.display="none";}});</script>'
    : '';
  const quieto = '<style>*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}.reveal,.v2-sube{opacity:1!important;transform:none!important}</style>';
  const html = base.replace(/loading="lazy"/g, 'loading="eager"').replace(/decoding="async"/g, 'decoding="sync"').replace('</body>', quieto + inyect + '</body>');
  const tmp = path.resolve('_cap_' + nombre + '.html');
  fs.writeFileSync(tmp, html, 'utf8');
  const out = path.resolve('../_vista/v7-' + nombre + '.png');
  if (fs.existsSync(out)) fs.unlinkSync(out);
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
      '--user-data-dir=' + path.join(require('os').tmpdir(), 'chrome-cap'),
      '--allow-file-access-from-files', '--hide-scrollbars', '--force-device-scale-factor=1',
      '--virtual-time-budget=8000', '--window-size=' + w + ',' + h, '--screenshot=' + out,
      'file:///' + tmp.split(path.sep).join('/')], { stdio: 'pipe', timeout: 90000 });
  } catch (e) {}
  fs.unlinkSync(tmp);
  console.log('  ' + (fs.existsSync(out) ? 'OK  ' : 'FALLO  ') + nombre);
});
