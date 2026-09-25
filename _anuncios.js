/*  Fábrica de creativos para Meta, en código. 1080x1350 (4:5, el formato que
 *  más rinde en feed y reels estático).
 *
 *    node _anuncios.js            -> ../../Productos/Prompt Ads/anuncios/imágenes/para claude/24-09-codigo/
 *
 *  No usa APIs ni gasta créditos: arma cada pieza en HTML con las fuentes y
 *  las fotos reales de la web, y la fotografía con Chrome sin pantalla.
 *  Todo el copy habla de la IMAGEN del producto, nunca promete vender más
 *  caro ni que sale solo (ver memoria del posicionamiento).
 */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const os = require('os');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAIZ = __dirname;
const SALIDA = path.resolve(RAIZ, '..', '..', 'Productos', 'Prompt Ads', 'anuncios', 'imágenes', 'para claude', '24-09-codigo');
const W = 1080, H = 1350;

const url = p => 'file:///' + path.join(RAIZ, p).split(path.sep).join('/');

const BASE = `<style>
@font-face{font-family:'DM Serif Display';src:url('${url('assets/fonts/dm-serif-display-normal-400-latin.woff2')}') format('woff2');font-weight:400;font-style:normal}
@font-face{font-family:'DM Serif Display';src:url('${url('assets/fonts/dm-serif-display-italic-400-latin.woff2')}') format('woff2');font-weight:400;font-style:italic}
@font-face{font-family:'DM Mono';src:url('${url('assets/fonts/dm-mono-normal-500-latin.woff2')}') format('woff2');font-weight:500}
@font-face{font-family:'Inter';src:url('${url('assets/fonts/inter-normal-latin.woff2')}') format('woff2');font-weight:100 900}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{--tinta:#171713;--papel:#FDFCF8;--verde:#0F3D23;--verde2:#147A3C;--rojo:#C0504A;--oro:#C8A96A;
  font-family:Inter,system-ui,sans-serif;color:var(--tinta);background:var(--papel);
  -webkit-font-smoothing:antialiased}
.serif{font-family:'DM Serif Display',Georgia,serif;font-weight:400}
.mono{font-family:'DM Mono',ui-monospace,monospace;font-weight:500;letter-spacing:.16em;text-transform:uppercase}
.pieza{position:relative;width:${W}px;height:${H}px;overflow:hidden}
.marca{position:absolute;left:64px;bottom:56px;display:flex;align-items:baseline;gap:9px;
  font-family:'DM Serif Display',serif;font-size:31px;letter-spacing:-.01em}
.marca i{font-style:italic}
.marca.claro{color:rgba(253,252,248,.92)}
.cta{position:absolute;right:64px;bottom:52px;display:inline-flex;align-items:center;gap:12px;
  padding:17px 30px;border-radius:99px;background:var(--verde);color:#F3F7F2;
  font-size:22px;font-weight:600;letter-spacing:.005em}
.cta.papel{background:var(--papel);color:var(--verde)}
.sello{position:absolute;left:64px;top:58px;display:inline-flex;align-items:center;gap:11px;
  padding:11px 20px;border-radius:99px;background:rgba(192,80,74,.1);
  box-shadow:inset 0 0 0 1px rgba(192,80,74,.3);color:var(--rojo);font-size:17px}
.sello b{width:9px;height:9px;border-radius:50%;background:var(--rojo)}
.sello.claro{background:rgba(192,80,74,.22);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22);color:#FFD9D6}
.sello.claro b{background:#E8827B}
img{display:block;object-fit:cover}
</style>`;

/* ---------- piezas ---------- */

/* A . nota: la frase manda, y abajo una tira de pruebas reales */
const nota = (o) => `${BASE}<div class="pieza" style="display:flex;flex-direction:column;background:
  radial-gradient(120% 80% at 18% 0%,#FFFDF7 0%,#F2ECDF 100%)">
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:96px 80px 0">
    ${o.sello ? `<div class="sello" style="position:static;align-self:flex-start;margin-bottom:40px"><b></b>${o.sello}</div>` : ''}
    <p class="serif" style="font-size:${o.tam || 92}px;line-height:1.02;letter-spacing:-.025em;max-width:19ch">
      ${o.titulo}</p>
    ${o.bajada ? `<p style="margin-top:34px;font-size:32px;line-height:1.42;max-width:27ch;color:rgba(23,23,19,.64)">${o.bajada}</p>` : ''}
    ${o.remate ? `<p class="serif" style="margin-top:30px;font-size:40px;font-style:italic;color:var(--verde2)">${o.remate}</p>` : ''}
  </div>
  <div style="height:326px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:0 0 152px">
    ${(o.tira || []).map(f => `<div style="overflow:hidden"><img src="${url(f)}" style="width:100%;height:100%"></div>`).join('')}
  </div>
  <div class="marca">simply <i>studio.</i></div>
  <div class="cta">${o.cta || 'Ver el método'}</div>
</div>`;

/* B . dupla: las dos piezas enteras, sin recortar, sobre fondo oscuro */
const dupla = (o) => `${BASE}<div class="pieza" style="display:flex;flex-direction:column;background:#0E1511">
  <div style="padding:70px 72px 34px">
    ${o.sello ? `<div class="sello claro" style="position:static;display:inline-flex;margin-bottom:26px"><b></b>${o.sello}</div>` : ''}
    <p class="serif" style="font-size:${o.tam || 72}px;line-height:1.04;letter-spacing:-.025em;color:#F7F4EC;max-width:18ch">${o.titulo}</p>
  </div>
  <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 72px;min-height:0">
    ${[[o.izq, o.izqTxt, 'rgba(247,244,236,.45)'], [o.der, o.derTxt, '#F7F4EC']].map(([f, t, col]) => `
      <div style="display:flex;flex-direction:column;gap:14px;min-height:0">
        <div style="flex:1;min-height:0;border-radius:10px;overflow:hidden;background:#151D18;
          display:flex;align-items:center;justify-content:center">
          <img src="${url(f)}" style="max-width:100%;max-height:100%;object-fit:contain"></div>
        <span class="mono" style="font-size:16px;color:${col};text-align:center">${t}</span>
      </div>`).join('')}
  </div>
  <div style="height:150px"></div>
  <div class="marca claro">simply <i>studio.</i></div>
  <div class="cta papel">${o.cta || 'Ver el método'}</div>
</div>`;

/* C . tanda: la grilla de resultados */
const tanda = (o) => `${BASE}<div class="pieza" style="background:#0E1511">
  <div style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:5px">
    ${o.fotos.map(f => `<div style="overflow:hidden"><img src="${url(f)}" style="width:100%;height:100%"></div>`).join('')}
  </div>
  <div style="position:absolute;left:0;right:0;top:0;padding:80px 72px 128px;
    background:linear-gradient(180deg,rgba(10,18,13,.97) 0%,rgba(10,18,13,.94) 62%,rgba(10,18,13,0) 100%)">
    ${o.sello ? `<div class="sello claro" style="position:static;display:inline-flex;margin-bottom:30px"><b></b>${o.sello}</div>` : ''}
    <p class="serif" style="font-size:${o.tam || 76}px;line-height:1.03;letter-spacing:-.025em;color:#F7F4EC;max-width:16ch">${o.titulo}</p>
    ${o.bajada ? `<p style="margin-top:24px;font-size:28px;line-height:1.4;max-width:28ch;color:rgba(247,244,236,.78)">${o.bajada}</p>` : ''}
  </div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:300px;
    background:linear-gradient(0deg,rgba(10,18,13,.97) 45%,rgba(10,18,13,0))"></div>
  <div class="marca claro">simply <i>studio.</i></div>
  <div class="cta papel">${o.cta || 'Ver el método'}</div>
</div>`;

/* D . una foto a sangre con una frase corta encima */
const foto = (o) => `${BASE}<div class="pieza">
  <img src="${url(o.img)}" style="position:absolute;inset:0;width:100%;height:100%">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,14,10,.93) 0%,rgba(8,14,10,.7) 38%,rgba(8,14,10,.18) 55%,rgba(8,14,10,.92) 100%)"></div>
  ${o.sello ? `<div class="sello claro"><b></b>${o.sello}</div>` : ''}
  <p class="serif" style="position:absolute;left:72px;right:72px;top:${o.top || 170}px;font-size:${o.tam || 82}px;
    line-height:1.03;letter-spacing:-.025em;color:#F8F5ED;max-width:17ch;text-shadow:0 2px 24px rgba(0,0,0,.35)">${o.titulo}</p>
  ${o.bajada ? `<p style="position:absolute;left:72px;right:120px;bottom:210px;font-size:30px;line-height:1.42;color:rgba(248,245,237,.85)">${o.bajada}</p>` : ''}
  <div class="marca claro">simply <i>studio.</i></div>
  <div class="cta papel">${o.cta || 'Ver el método'}</div>
</div>`;

/* ---------- el lote ---------- */
const G = 'assets/galeria2/';
const PIEZAS = [
  ['24A-01-foto-barata', nota({
    sello: 'Método Prompt Ads',
    titulo: 'Tu producto es bueno.<br>Tu <i style="color:var(--rojo)">foto</i> lo hace ver barato.',
    bajada: 'Nadie lee antes de juzgar. Deciden en dos segundos, con los ojos.',
    remate: 'Aprende a cambiar eso hoy.',
    tira: [G + 'g2-01-byredo.webp', G + 'g2-04-stanley.webp', G + 'g2-07-muuto.webp'],
    cta: 'Quiero verlo' })],

  ['24A-02-dos-segundos', nota({
    titulo: 'Tienes <i style="color:var(--rojo)">dos segundos</i> antes de que pasen de largo.',
    tam: 88,
    bajada: 'Y lo que ven es una foto, no tu descripción.',
    remate: 'Que esa foto trabaje para ti.',
    tira: [G + 'g2-03-burguer.webp', G + 'g2-05-ordinary.webp', G + 'g2-11-byredo.webp'],
    cta: 'Ver el método' })],

  ['24A-03-agencia', nota({
    sello: 'Edición Septiembre',
    titulo: 'Una agencia cobra <i style="color:var(--rojo)">USD 1.000</i> por una tanda de fotos.',
    tam: 86,
    bajada: 'Aprende a crear las tuyas con una foto de tu producto y ChatGPT.',
    remate: 'En minutos, no en semanas.',
    tira: [G + 'g2-13-burguer.webp', G + 'g2-14-stanley.webp', G + 'g2-17-muuto.webp'],
    cta: 'Ver la edición' })],

  ['24B-01-misma-zapatilla', dupla({
    izq: 'assets/versus-nb/generico.webp', der: 'assets/versus-nb/premium.webp',
    izqTxt: 'Lo que subes hoy', derTxt: 'Lo que puedes subir mañana',
    titulo: 'La misma zapatilla.<br>Otro <i>precio</i> a los ojos.',
    sello: 'Mismo producto, misma foto' })],

  ['24B-02-mismo-bolso', dupla({
    izq: 'assets/caso-cos/real.webp', der: 'assets/caso-cos/c1.webp',
    izqTxt: 'La foto que ya tienes', derTxt: 'El anuncio, minutos después',
    titulo: 'Esta foto.<br>Este <i>anuncio</i>.<br>Sin sesión.',
    tam: 78 })],

  ['24C-01-todos-de-una-foto', tanda({
    fotos: [G + 'g2-01-byredo.webp', G + 'g2-04-stanley.webp', G + 'g2-03-burguer.webp',
            G + 'g2-07-muuto.webp', G + 'g2-05-ordinary.webp', G + 'g2-11-byredo.webp',
            G + 'g2-13-burguer.webp', G + 'g2-14-stanley.webp', G + 'g2-17-muuto.webp'],
    titulo: 'Todos estos salieron de <i>una foto</i> de producto.',
    bajada: 'Rubros distintos. El mismo método. Cada anuncio listo para publicar.',
    sello: 'Método Prompt Ads' })],

  ['24C-02-tanda-por-tarde', tanda({
    fotos: [G + 'g2-20-ordinary.webp', G + 'g2-18-burguer.webp', G + 'g2-16-byredo.webp',
            G + 'g2-24-stanley.webp', G + 'g2-27-muuto.webp', G + 'g2-23-burguer.webp',
            G + 'g2-26-byredo.webp', G + 'g2-29-stanley.webp', G + 'g2-30-ordinary.webp'],
    titulo: 'Deja de probar <i>un</i> anuncio.<br>Prueba veinte.',
    bajada: 'Gana el que más intentos hace, no el que más talento tiene.',
    sello: 'Edición Septiembre · cierra el 30',
    cta: 'Ver la edición' })],

  ['24D-01-premium', foto({
    img: 'assets/versus-nb/premium-990.webp',
    titulo: 'Esto no lo hizo una agencia.<br>Lo hizo <i>una foto</i> y un método.',
    tam: 76,
    bajada: 'Aprende la dirección visual que usan las marcas que cobran el triple.',
    sello: 'Método Prompt Ads' })],

  ['24D-02-cierre', foto({
    img: 'assets/caso-cos/c5.webp',
    titulo: 'La Edición Septiembre cierra el <i>30</i>.',
    tam: 84, top: 160,
    bajada: 'Después no vuelve el material exclusivo de esta edición. Quedan pocas copias.',
    sello: 'Cierra en días',
    cta: 'Entrar ahora' })],
];

/* ---------- render ---------- */
if (!fs.existsSync(SALIDA)) fs.mkdirSync(SALIDA, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ads-'));
let ok = 0;
PIEZAS.forEach(([nombre, html]) => {
  const tmp = path.join(tmpDir, nombre + '.html');
  fs.writeFileSync(tmp, html, 'utf8');
  const out = path.join(SALIDA, nombre + '.png');
  if (fs.existsSync(out)) fs.unlinkSync(out);
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
      '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-ads'),
      '--allow-file-access-from-files', '--hide-scrollbars', '--force-device-scale-factor=1',
      '--virtual-time-budget=6000', '--window-size=' + W + ',' + H,
      '--screenshot=' + out, 'file:///' + tmp.split(path.sep).join('/')],
      { stdio: 'pipe', timeout: 90000 });
  } catch (e) {}
  const hay = fs.existsSync(out);
  if (hay) ok++;
  console.log('  ' + (hay ? 'OK ' : '-- ') + nombre);
});
console.log('\n  ' + ok + '/' + PIEZAS.length + ' piezas en ' + SALIDA);
