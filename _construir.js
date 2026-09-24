/*  Construye _nueva.html: markup nuevo, copy y tracking del original.
 *
 *    node _construir.js
 *
 *  Fuente: _base.html (el index.html viejo, congelado). Salida: _nueva.html; publicar = copiarla a index.html.
 *  Regla: nada de tocar _base.html. Todo lo sensible (pixel, ssTrack,
 *  cuenta atras del precio, lightbox, giro del ebook, testimonios, oferta,
 *  FAQ, footer) se trasplanta VERBATIM. Solo el hero y la galeria se
 *  rearman, y el CSS es nuevo por completo.
 */
const fs = require('fs');
const path = require('path');

/* fuente: el index.html ORIGINAL (congelado el 21/08/2026 al migrar). No leer index.html: desde la migracion es la salida, no la entrada. */
const src = fs.readFileSync('_base.html', 'utf8');
const css = fs.readFileSync('_nueva.css', 'utf8')
  /* .who es el rotulo de cada costo en la oferta, no una fila de audiencia */
  .replace(/,\.who(?::hover| \.n| h3| p)?(?=[\s{,])/g, '') +
  '\n' + fs.readFileSync('_nueva-v3.css', 'utf8') +
  '\n' + fs.readFileSync('_nueva-v4.css', 'utf8') +
  '\n' + fs.readFileSync('_nueva-v5.css', 'utf8');
const avisos = [];
const corta = (s, a, b, desde) => {
  const i = s.indexOf(a, desde || 0);
  if (i === -1) return null;
  const j = s.indexOf(b, i + a.length);
  if (j === -1) return null;
  return { texto: s.slice(i, j + b.length), ini: i, fin: j + b.length };
};

/* ---------- 1 · cabeza: mismo head, CSS nuevo + contrato del giro ---------- */
const finHead = src.indexOf('</head>');
let head = src.slice(0, finHead);

const estilo = corta(head, '<style>', '</style>');
const viejoCSS = estilo.texto.slice(7, -8);
const giroCSS = viejoCSS.split('\n')
  .filter(l => /prod-float|prodFlotar|\.giro|#prodImg\{|hero-prod\{/.test(l))
  .join('\n');
if (!/prodFlotar/.test(giroCSS)) avisos.push('OJO: no encontre los keyframes del giro');

head = head.slice(0, estilo.ini) +
  '<style>\n' + css + '\n/* ---- contrato del giro (verbatim del original) ---- */\n' + giroCSS + '\n</style>' +
  head.slice(estilo.fin);

/* ---------- 2 · cuerpo: bloques del original ---------- */
const iBody = src.indexOf('<body', finHead);
const cuerpo = src.slice(src.indexOf('>', iBody) + 1, src.lastIndexOf('</body>'));
const abreBody = src.slice(iBody, src.indexOf('>', iBody) + 1);

const iAnn = cuerpo.indexOf('<div class="announcement"');
const iHead2 = cuerpo.indexOf('<header');
const antes = cuerpo.slice(0, iAnn);
const announcement = cuerpo.slice(iAnn, iHead2);
const headerFin = cuerpo.indexOf('</header>') + 9;
const headerHTML = cuerpo.slice(iHead2, headerFin);

const secciones = [];
let p = headerFin;
while (true) {
  const i = cuerpo.indexOf('<section', p);
  if (i === -1) break;
  const j = cuerpo.indexOf('</section>', i) + 10;
  secciones.push(cuerpo.slice(i, j));
  p = j;
}
const cola = cuerpo.slice(p);
console.log('  secciones: ' + secciones.length);

/* ---------- 3 · transformaciones ---------- */
const ESCENAS = [
  [/class="hero/, 'Inicio'], [/class="showcase/, 'Resultados'],
  [/class="pain/, 'El problema'], [/class="difference/, 'La diferencia'],
  [/class="case/, 'El caso'], [/class="inside/, 'El sistema'],
  [/class="audience/, 'Para quién'], [/class="proof proof-2/, 'Opiniones'],
  [/class="proof/, 'Opiniones'], [/class="offer/, 'La oferta'],
  [/class="guarantee/, 'Garantía'], [/class="faq/, 'Preguntas'],
];
const nombreEscena = s => (ESCENAS.find(([re]) => re.test(s.slice(0, 90))) || [null, ''])[1];

/* HERO: dos columnas, entrada por lineas, giro intacto */
function rearmarHero(sec) {
  const pill = corta(sec, '<span class="pill', '</span>');
  const h1 = corta(sec, '<h1', '</h1>');
  const acciones = corta(sec, '<div class="hero-actions"', '</div>');
  const prueba = corta(sec, '<div class="hero-proof"', '</div>') || corta(sec, '<p class="hero-proof"', '</p>');
  const figura = corta(sec, '<figure class="prod-float"', '</figure>');
  if (!h1 || !figura) { avisos.push('OJO: hero incompleto, va verbatim'); return sec; }

  const sub = 'Sabemos lo que es perder una tarde entera creando unos pocos anuncios y que al final, después de mucho esfuerzo, no traigan los resultados esperados o ningún resultado. Por eso existe Prompt Ads: <b>el método que hace que tu marca se vea como las que facturan millones</b>. Subes una foto de lo que vendes y en minutos tienes una tanda de anuncios premium, de los que una agencia te cobraría <b>+USD 1.000</b>. Sin sesión de fotos, sin saber diseño y de la manera más fácil y rápida posible.';
  /* titular pedido para la nueva: arranca con la accion y el numero */
  h1.texto = '<h2 class="v2-hero-h">Aprende a crear <em>+50 anuncios de la más alta calidad</em> en minutos y <em>aumenta tus ventas.</em></h2>';
  if (pill) pill.texto = pill.texto.replace(/Prompts \+ gu[ií]as \+ sistema de correcci[oó]n/, 'El método para crear +50 anuncios premium en minutos');

  /* orden que manda: titulo, animacion, texto chico, boton */
  return '<section class="hero v2-hero v2-metodo" data-esc="El método">\n<div class="shell">\n' +
    '<div class="v2-hero-grid">\n' +
    (pill ? '<div class="v2-sube d1">' + pill.texto + '</div>\n' : '') +
    '<div class="v2-sube d2">' + h1.texto + '</div>\n' +
    '<div class="v2-prod v2-sube d3"><div class="hero-prod">' + figura.texto + '</div></div>\n' +
    '<p class="v2-hero-sub v2-sube d4">' + sub + '</p>\n' +
    (acciones ? '<div class="v2-sube d5">' + acciones.texto + '</div>\n' : '') +
    (prueba ? '<div class="v2-sube d5">' + prueba.texto + '</div>\n' : '') +
    '</div>\n</div>\n</section>';
}

/* el boton principal del hero, reutilizado al cierre de cada escena */
function botonPrincipal() {
  const hero = secciones.find(s => /^<section class="hero/.test(s.trim())) || '';
  const a = corta(hero, '<a class="btn" href="#precio"', '</a>');
  return a ? a.texto : '<a class="btn" href="#precio">Quiero crear mis anuncios</a>';
}
function cierreCTA(oscura) {
  return '\n<div class="shell v2-cta reveal">' + botonPrincipal() +
    '<span class="v2-cta-nota">Pago único · acceso inmediato · 7 días de garantía</span></div>\n';
}

/* LA LECCION: vende ensenando, sin mostrar el metodo */
const LECCION = '<section class="v2-lec" data-esc="Lo que juzgan">\n<div class="shell">\n' +
  '<div class="section-intro reveal">\n' +
  '<span class="eyebrow">Lo que tu cliente juzga sin darse cuenta</span>\n' +
  '<h2>Nadie lee tu anuncio.<br><em>Lo siente.</em></h2>\n' +
  '<p>Antes de entender una sola palabra, ya decidieron cuánto vale lo que vendes. Lo deciden con tres cosas que casi nadie mira.</p>\n' +
  '</div>\n' +
  '<div class="v2-lec-grid reveal">\n' +
  '<div class="v2-lec-item"><h3>La tipografía.</h3><p>Una letra mal elegida hace que un producto caro parezca barato. Hasta el texto que pones encima de la foto cambia lo que piensan de tu marca.</p></div>\n' +
  '<div class="v2-lec-item"><h3>La cantidad de texto.</h3><p>Cuanto más explica un anuncio, menos confianza transmite. Las marcas grandes dicen una sola cosa, y la dicen enorme.</p></div>\n' +
  '<div class="v2-lec-item"><h3>La luz.</h3><p>Una foto con luz real vende más que un render perfecto. Si parece hecho por computadora, parece falso, y lo falso no se compra.</p></div>\n' +
  '</div>\n' +
  '<p class="v2-lec-cierre reveal">Prompt Ads decide estas tres cosas por ti, <em>en cada pieza.</em></p>\n' +
  '</div>\n' + cierreCTA() + '</section>';

/* GALERIA: piezas reales, marquesina automatica como los testimonios */
/* la lista la arma _preparar-colabs.js: 3 por marca, sin vitrinas, las elegidas a mano primero */
const PIEZAS = JSON.parse(fs.readFileSync('_galeria.json', 'utf8')).map(p => [p.archivo, p.marca]);
function figuras(clon) {
  return PIEZAS.map(([f, marca], i) =>
    '<figure class="v2-piece"><button class="zoomable" type="button" data-full="assets/colabs/' + f + '.jpg"' +
    (clon ? ' tabindex="-1"' : '') + ' aria-label="Ampliar anuncio de ' + marca + '">' +
    '<img src="assets/colabs/' + f + '.jpg" srcset="assets/colabs/' + f + '-m.webp 600w, assets/colabs/' + f + '.webp 900w" sizes="(max-width:720px) 200px, 440px" loading="lazy" decoding="async" width="1100" height="1375" alt="Anuncio de ' + marca + ' hecho con Prompt Ads">' +
    '</button></figure>'
  ).join('\n');
}
function rearmarShowcase(sec) {
  const iStage = sec.indexOf('<div class="campaign-stage');
  if (iStage === -1) { avisos.push('OJO: no encontre campaign-stage, showcase verbatim'); return sec; }
  let cabeza = sec.slice(0, iStage);
  /* el titulo ahora vende el sistema, no solo el resultado */
  cabeza = cabeza
    .replace(/<h2>[\s\S]*?<\/h2>/, '<h2>Todos estos anuncios salieron con el Método <em>Prompt Ads.</em></h2>')
    .replace(/<p>[\s\S]*?<\/p>/, '<p>El mismo sistema de seis PDFs que te llevas hoy. Sin agencia, sin sesión de fotos y sin diseñador: cada pieza salió de una foto común y del sistema, en minutos. <b>Es exactamente lo que puedes hacer con lo que tú vendes.</b></p>');
  return cabeza +
    '<div class="v2-gal reveal"><div class="v2-gal-track">' +
    '<div class="v2-gal-set">\n' + figuras(false) + '\n</div>' +
    '<div class="v2-gal-set" aria-hidden="true">\n' + figuras(true) + '\n</div>' +
    '</div></div>' +
    '<div class="v2-gal-nota"><span>Rubros distintos · el mismo sistema · cada anuncio listo para publicar</span><span class="v2-gal-desliza"><svg class="ar" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>desliza<svg class="ar" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></span></div>' +
    '\n</div>\n</section>';
}

/* en el inicio las primeras piezas se ven sin scrollear: no esperan al lazy */
function primerasSinEspera(html) {
  let n = 0;
  return html.replace(/loading="lazy"/g, m => { n++; return n === 1 ? 'loading="eager" fetchpriority="high"' : n <= 5 ? 'loading="eager"' : m; });
}

/* INICIO: la galeria es lo primero que se ve. El anuncio es la prueba. */
function heroGaleria() {
  return '<section class="showcase v2-hero-gal" id="resultado" data-esc="Inicio">\n<div class="shell">\n' +
    '<div class="showcase-head v2-hero-gal-head">' +
    '<span class="eyebrow muted v2-sube d1">Método Prompt Ads para ChatGPT</span>' +
    '<h1 class="v2-sube d2">Imagina poder crear <em class="v2-nw">publicidad así.</em></h1>' +
    '</div>\n' +
    '<div class="v2-gal v2-sube d3"><div class="v2-gal-track">' +
    '<div class="v2-gal-set">\n' + primerasSinEspera(figuras(false)) + '\n</div>' +
    '<div class="v2-gal-set" aria-hidden="true">\n' + figuras(true) + '\n</div>' +
    '</div></div>' +
    '<div class="v2-gal-nota v2-sube d3"><span>Rubros distintos · el mismo método · cada anuncio listo para publicar</span><span class="v2-gal-desliza"><svg class="ar" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>desliza<svg class="ar" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></span></div>' +
    '<div class="v2-hero-gal-pie v2-sube d4">' +
    '<p class="v2-hero-gal-tit">Todos estos anuncios salieron con el <em>Método Prompt Ads.</em></p>' +
    '<p class="v2-hero-gal-txt">Un <b>video explicativo</b> que te muestra cómo crear los anuncios, y seis archivos que cargas en ChatGPT para que genere publicidad con la calidad de las grandes marcas del mundo, a partir de una foto común de tu producto. Sin agencia, sin sesión de fotos y en minutos. <b>Es exactamente lo que puedes hacer hoy con lo que tú vendes.</b></p>' +
    '</div>\n</div>\n' + cierreCTA() + '</section>';
}

/* escenas que cierran con boton: titulo, visual, texto, boton */
const CON_CTA = /class="(showcase|difference|case|inside|audience|proof proof-2)/;
const conCierre = sec => CON_CTA.test(sec.slice(0, 90))
  ? sec.replace(/<\/section>\s*$/, cierreCTA() + '</section>')
  : sec;

/* MARCAS: marquesina de logos reales, normalizados y en monocromo */
const LOGOS = ['nike', 'rolex', 'cocacola', 'redbull', 'newbalance', 'aesop', 'apple', 'leica',
  'adidas', 'dior', 'puma', 'sony', 'starbucks', 'dyson', 'bmw', 'samsung', 'jordan',
  'porsche', 'zara', 'uniqlo', 'sprite', 'audi', 'thenorthface', 'ikea', 'tesla', 'ferrari'];
const NOMBRE = { cocacola: 'Coca-Cola', redbull: 'Red Bull', newbalance: 'New Balance', ralphlauren: 'Ralph Lauren',
  thenorthface: 'The North Face', bmw: 'BMW', ikea: 'IKEA', zara: 'Zara' };
const MEDIDAS = JSON.parse(fs.readFileSync('assets/logos/norm/_medidas.json', 'utf8'));
const SIMBOLOS = [];
function marca(f) {
  const ruta = 'assets/logos/norm/' + f + '.svg';
  if (!fs.existsSync(ruta)) { avisos.push('sin logo: ' + f); return ''; }
  const b = MEDIDAS[f]; const aspecto = b ? b[2] / b[3] : 1;
  /* misma presencia visual: los anchos mas bajos, los cuadrados mas altos */
  /* mismo peso visual: area constante, con piso y techo para que nada quede ilegible ni gigante */
  const alto = Math.max(22, Math.min(46, Math.round(Math.sqrt(2600 / aspecto))));
  const nombre = NOMBRE[f] || f.charAt(0).toUpperCase() + f.slice(1);
  let svg = fs.readFileSync(ruta, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 24 24';
  if (!SIMBOLOS.some(x => x.id === f)) {
    /* dentro de un sprite el CSS de la pagina no llega: el color se limpia aca */
    const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
      .replace(/<metadata[\s\S]*?<\/metadata>/g, '').replace(/<sodipodi:namedview[\s\S]*?(\/>|<\/sodipodi:namedview>)/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '').replace(/<defs[^>]*>\s*<\/defs>/g, '')
      .replace(/\s(fill|stroke|style|class)="[^"]*"/g, '');
    SIMBOLOS.push({ id: f, vb, inner });
  }
  const [, , vbW, vbH] = vb.trim().split(' ');
  return '<span class="v2-marca" title="' + nombre + '" style="--h:' + alto + 'px"><svg viewBox="0 0 ' + vbW + ' ' + vbH + '" aria-hidden="true" focusable="false"><use href="#l-' + f + '"/></svg></span>';
}
function setMarcas(clon) {
  return '<div class="v2-marcas-set"' + (clon ? ' aria-hidden="true"' : '') + '>' + LOGOS.map(marca).join('') + '</div>';
}
const PISTA = setMarcas(false) + setMarcas(true);
const SPRITE = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
  SIMBOLOS.map(x => '<symbol id="l-' + x.id + '" viewBox="' + x.vb + '">' + x.inner + '</symbol>').join('') + '</svg>';
const MARCAS = SPRITE + '\n<div class="v2-marcas" aria-label="Marcas de referencia">\n' +
  '<div class="v2-marcas-track">' + PISTA + '</div>\n</div>';

/* LA LECCION, plegada dentro de "el problema": tres lineas que venden */
const JUICIO = '<div class="v2-juicio"><b>Tres cosas que juzgan sin darse cuenta.</b>' +
  '<p>La tipografía, cuánto texto hay y si la luz parece real. Hasta la letra que pones encima de la foto cambia cuánto creen que vale tu producto. <strong>Prompt Ads resuelve las tres en cada pieza.</strong></p></div>';
function plegarLeccion(sec) {
  const i = sec.indexOf('<div class="truth">');
  if (i === -1) { avisos.push('OJO: no encontre .truth, la leccion no se plego'); return sec; }
  const j = sec.indexOf('</div>', i) + 6;
  return sec.slice(0, j) + '\n' + JUICIO + sec.slice(j);
}

/* DECORACION: anuncios tenues detras del contenido en las escenas crema (solo escritorio) */
const DECO = {
  difference: ['rolex', 'fenty'], case: ['coca-nieve'], audience: ['redbull-gafas', 'leica'],
  guarantee: ['glossier'], faq: ['rolex'],
};
function decorar(sec) {
  const cls = (sec.match(/^<section[^>]*class="([a-z-]+)/) || [])[1];
  const piezas = DECO[cls];
  if (!piezas) return sec;
  const capa = '<div class="v2-deco" aria-hidden="true">' +
    piezas.map((p, i) => '<img class="d' + (i + 1) + '" src="assets/deco/' + p + '.jpg" alt="" loading="lazy" decoding="async" width="520" height="650">').join('') +
    '</div>\n';
  const fin = sec.indexOf('>') + 1;
  return sec.slice(0, fin) + '\n' + capa + sec.slice(fin);
}

/* EL CASO: la foto de partida, real, antes de los pasos. Vende que con la suya pasa lo mismo. */
const ORIGEN = '<div class="v2-origen reveal">\n' +
  '<figure class="v2-origen-foto"><button class="zoomable" type="button" data-full="assets/caso-nike/real.jpg" aria-label="Ampliar la foto original del producto">' +
  '<picture><source media="(max-width:760px)" srcset="assets/caso-nike/real-600.webp"><source srcset="assets/caso-nike/real-600.webp 600w, assets/caso-nike/real.webp 900w" sizes="330px"><img src="assets/caso-nike/real.jpg" loading="lazy" decoding="async" width="900" height="1200" alt="Foto original de las zapatillas, sacada con un celular sobre una cama"></picture></button>' +
  '<figcaption>La foto de partida · sacada con un celular</figcaption></figure>\n' +
  '<div class="v2-origen-texto"><span class="eyebrow">Esto es todo lo que hizo falta</span>' +
  '<b>De esta foto salieron todos los anuncios que vas a ver a continuación.</b>' +
  '<p>Sin estudio, sin modelo, sin retoque. Una foto común sobre la cama, como la que puedes sacarle hoy a lo que vendes. ' +
  'El sistema la convirtió en una campaña entera en minutos. <strong>Con la tuya pasa exactamente lo mismo.</strong></p></div>\n' +
  '</div>\n';
/* orden nuevo: la foto de partida, los anuncios, y recien ahi "como se hace" */
/* CASO (18/09): selector Zapatillas | Bolso y una tira horizontal por producto,
 * dentro de un panel de vidrio como las demas tarjetas. Primero la foto de
 * partida, despues todo lo que salio de ella. Cada pieza con su proporcion real
 * (nada se recorta) y srcset para que se vea nitida en cualquier pantalla.
 * Reemplaza la foto grande + la grilla; si algo no aparece, queda lo anterior. */
const CASOS = [
  { id: 'bolso', nombre: 'Bolso', mini: 'assets/caso-cos/real-640.webp',
    origen: { full: 'assets/caso-cos/real.webp', w: 1128, h: 1692, sizes: '(max-width:720px) 213px, 287px',
      set: [['assets/caso-cos/real-640.webp', 640], ['assets/caso-cos/real.webp', 1128]],
      alt: 'Foto original del bolso, sobre fondo blanco' },
    piezas: [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ full: 'assets/caso-cos/c' + n + '.webp', w: 1122, h: 1402, sizes: '(max-width:720px) 213px, 344px',
      set: [['assets/caso-cos/c' + n + '-640.webp', 640], ['assets/caso-cos/c' + n + '.webp', 1122]],
      alt: 'Anuncio del bolso creado con el Método Prompt Ads' })) },
  { id: 'zapatillas', nombre: 'Zapatillas', mini: 'assets/caso-nike/real-600.webp',
    origen: { full: 'assets/caso-nike/real.webp', w: 900, h: 1200, sizes: '(max-width:720px) 200px, 323px',
      set: [['assets/caso-nike/real-600.webp', 600], ['assets/caso-nike/real.webp', 900]],
      alt: 'Foto original de las zapatillas, sacada con un celular sobre una cama' },
    piezas: [1, 2, 3, 4, 5].map(n => ({ full: 'assets/caso-nike/n' + n + '.webp', w: 1000, h: 1000, sizes: '(max-width:720px) 213px, 430px',
      set: [['assets/caso-nike/n' + n + '-640.webp', 640], ['assets/caso-nike/n' + n + '.webp', 1000]],
      alt: 'Anuncio de las zapatillas creado con el Método Prompt Ads' })) },
];
const CASO_DER = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';
const CASO_IZQ = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>';
function piezaCaso(p, esOrigen) {
  return '<figure class="v2-caso-fig' + (esOrigen ? ' v2-caso-origen' : '') + '" style="aspect-ratio:' + p.w + '/' + p.h + '">' +
    '<button class="zoomable" type="button" data-full="' + p.full + '" aria-label="Ampliar: ' + p.alt + '">' +
    '<img src="' + p.set[0][0] + '" srcset="' + p.set.map(([u, w]) => u + ' ' + w + 'w').join(', ') + '" sizes="' + p.sizes + '"' +
    ' loading="lazy" decoding="async" width="' + p.w + '" height="' + p.h + '" alt="' + p.alt + '">' +
    (esOrigen ? '<span class="v2-caso-chip">Foto original</span>' : '') +
    '</button></figure>';
}
const TIRAS = '<div class="v2-caso reveal">' +
  '<div class="v2-caso-tabs" role="tablist" aria-label="Elige un producto">' +
  CASOS.map((c, i) => '<button type="button" class="v2-caso-tab' + (i ? '' : ' on') + '" role="tab" id="caso-tab-' + c.id + '" aria-controls="caso-' + c.id + '"' +
    ' aria-selected="' + (i ? 'false' : 'true') + '"' + (i ? ' tabindex="-1"' : '') + '>' +
    '<img src="' + c.mini + '" alt="" width="32" height="32" loading="lazy" decoding="async">' + c.nombre + '</button>').join('') +
  '</div>' +
  '<div class="v2-caso-vitrina">' +
  CASOS.map(c => '<div class="v2-caso-tira" id="caso-' + c.id + '" role="tabpanel" aria-labelledby="caso-tab-' + c.id + '" tabindex="0">' +
    piezaCaso(c.origen, true) +
    '<span class="v2-caso-puente" aria-hidden="true">' + CASO_DER + '</span>' +
    c.piezas.map(p => piezaCaso(p, false)).join('') +
    '</div>').join('') +
  '</div>' +
  '<div class="v2-caso-nota">' +
  '<button type="button" class="v2-caso-mover" data-mover="-1" aria-label="Ver los anteriores">' + CASO_IZQ + '</button>' +
  '<span>Desliza para ver todo lo que salió de esta simple imagen</span>' +
  '<button type="button" class="v2-caso-mover" data-mover="1" aria-label="Ver los siguientes">' + CASO_DER + '</button>' +
  '</div>' +
  '</div>\n';
function casoTiras(sec) {
  const conOrigen = origen(sec);                 /* los pasos "Como se hace" se arman ahi; se reusan tal cual */
  const i = sec.indexOf('<div class="case-steps">');
  const g0 = sec.indexOf('<div class="case-grid">');
  const g1 = sec.indexOf('<div class="marquee-hint"', g0);
  const p0 = conOrigen.indexOf('<div class="v2-como reveal">');
  const p1 = conOrigen.indexOf('</div>', conOrigen.indexOf('</article>', conOrigen.lastIndexOf('<article class="case-step'))) + 6;
  if (i === -1 || g0 === -1 || g1 === -1 || p0 === -1 || p1 < p0) { avisos.push('OJO caso: no encontre sus partes, queda la version anterior'); return conOrigen; }
  const pasos = conOrigen.slice(p0, p1);
  const finPasos = sec.indexOf('</div>', sec.indexOf('</article>', sec.lastIndexOf('<article class="case-step'))) + 6;
  const cola = sec.slice(finPasos).replace(sec.slice(g0, g1), '').replace(/<div class="marquee-hint">[\s\S]*?<\/div>\s*/, '');
  return sec.slice(0, i) + TIRAS + pasos + cola;
}

function origen(sec) {
  const i = sec.indexOf('<div class="case-steps">');
  const g0 = sec.indexOf('<div class="case-grid">');
  const g1 = sec.indexOf('<div class="marquee-hint"', g0);
  if (i === -1 || g0 === -1 || g1 === -1) { avisos.push('OJO: no encontre case-steps o case-grid'); return sec; }
  const grid = sec.slice(g0, g1);
  const pasos = '<div class="v2-como reveal"><span class="eyebrow">Cómo se hace</span><h3>Aprendes el método una vez. Después, cada tanda es esto.</h3></div>\n' +
    '<div class="case-steps">\n' +
    '<article class="case-step reveal"><span>Paso 01</span><b>Arrastras los archivos</b><p>Los seis PDFs del sistema, al chat.</p></article>\n' +
    '<article class="case-step reveal"><span>Paso 02</span><b>Sumas tu producto</b><p>Una foto, tu logo y un detalle que la guía te enseña en dos minutos.</p></article>\n' +
    '<article class="case-step reveal"><span>Paso 03</span><b>Envías el mensaje y esperas a que los anuncios estén listos</b><p>Puedes tener +50 anuncios en pocos minutos. Ahorras tiempo y dinero sin contratar a nadie.</p></article>\n' +
    '</div>';
  const finPasos = sec.indexOf('</div>', sec.indexOf('</article>', sec.lastIndexOf('<article class="case-step'))) + 6;
  const cola = sec.slice(finPasos).replace(grid, '');
  return sec.slice(0, i) + ORIGEN + grid + pasos + cola;
}

/* PARA QUIEN: los nichos como tarjetas, cada una con un gancho corto */
/* Sin ganchos: los nombres solos venden mejor que una frase corta que
     tiene que resumir un rubro entero en cinco palabras. */
  const GANCHO = {};
function nichos(sec) {
  let n = 0;
  return sec.replace(/<div class="audience-chips reveal">([\s\S]*?)<\/div>/, (todo, interior) => {
    const tarjetas = interior.replace(/<span>([^<]+)<\/span>/g, (m, nombre) => {
      n++;
      return '<div class="v2-nicho"><span class="n">' + String(n).padStart(2, '0') + '</span><b>' + nombre + '</b>' +
        (GANCHO[nombre] ? '<p>' + GANCHO[nombre] + '</p>' : '') + '</div>';
    });
    return '<div class="audience-chips v2-nichos reveal">' + tarjetas + '</div>';
  });
}

const nuevas = [];
secciones.forEach(sec => {
  const esc = nombreEscena(sec);
  /* la marquesina de marcas va justo debajo del boton del hero */
  if (/^<section class="hero/.test(sec.trim())) { nuevas.push(heroGaleria()); nuevas.push(rearmarHero(sec)); nuevas.push(MARCAS); return; }
  if (/class="showcase/.test(sec.slice(0, 90))) return;   /* su galeria ahora abre la landing */
  if (/class="pain/.test(sec.slice(0, 90))) sec = plegarLeccion(sec);
  if (/class="case/.test(sec.slice(0, 90))) sec = casoTiras(sec);
  if (/class="audience/.test(sec.slice(0, 90))) sec = nichos(sec);
  sec = decorar(sec);
  nuevas.push(conCierre(sec.replace('<section', '<section data-esc="' + esc + '"')));
});

/* ---------- 4 · riel de escenas + linea del header ---------- */
const miniScript = '\n<script>\n' +
'(function(){\n' +
'  var h=document.querySelector("header");\n' +
'  var f=function(){ h&&h.classList.toggle("con-linea", scrollY>10); };\n' +
'  f(); addEventListener("scroll", f, {passive:true});\n' +
'  /* cuenta regresiva: toma LIMITE del script original del precio (el script del precio la actualiza solo), asi no hay dos fechas */\n' +
'  /* en la barra de arriba, el "en N dias" se vuelve contador; el script original ya escribio el texto (corre antes) */\n' +
'  var ban=document.querySelector("[data-cuenta=banner]");\n' +
'  if(ban){\n' +
'    var mini=document.createElement("span"); mini.className="v2-cuenta-mini";\n' +
'    mini.innerHTML="<b data-c=d>00</b><i>d</i><b data-c=h>00</b><i>h</i><b data-c=m>00</b><i>m</i><b data-c=s>00</b><i>s</i>";\n' +
'    if(/ en \\d+ d\\u00edas\\.?\\s*$/.test(ban.innerHTML)) ban.innerHTML=ban.innerHTML.replace(/ en \\d+ d\\u00edas\\.?\\s*$/, " en");\n' +
'    ban.parentNode.insertBefore(mini, ban.nextSibling);\n' +
'  }\n' +
'  var cajas=[].slice.call(document.querySelectorAll(".v2-cuenta,.v2-cuenta-mini"));\n' +
'  if(cajas.length){\n' +
'    var lim=null; [].slice.call(document.scripts).forEach(function(s){ var m=/const LIMITE = \\x27(\\d{4}-\\d{2}-\\d{2})\\x27/.exec(s.textContent||""); if(m) lim=m[1]; });\n' +
'    var fin=lim?new Date(lim+"T12:00:00-04:00").getTime():NaN;   /* mismo instante para todos, no la medianoche de cada visitante */\n' +
'    var dd=function(n){ return (n<10?"0":"")+n; };\n' +
'    var tic=function(){ var r=fin-Date.now();\n' +
'      if(isNaN(r)||r<=0){ cajas.forEach(function(c){ c.hidden=true; }); return; }\n' +
'      var v={d:dd(Math.floor(r/864e5)),h:dd(Math.floor(r%864e5/36e5)),m:dd(Math.floor(r%36e5/6e4)),s:dd(Math.floor(r%6e4/1e3))};\n' +
'      cajas.forEach(function(c){ [].slice.call(c.querySelectorAll("[data-c]")).forEach(function(e){ var k=e.getAttribute("data-c"); if(e.textContent!==v[k]) e.textContent=v[k]; }); }); };\n' +
'    tic(); setInterval(tic,1000);\n' +
'  }\n' +
'  /* la barra fija de compra se aparta solo cuando el boton de compra real ya esta en pantalla:\n' +
'     asi el visitante siempre tiene un boton a mano, incluso al saltar a la tarjeta de precio */\n' +
'  var bc=document.querySelector("#precio .btn.checkout") || document.getElementById("precio");\n' +
'  if(bc&&"IntersectionObserver" in window){ new IntersectionObserver(function(es){ document.documentElement.classList.toggle("precio-visible", es[0].isIntersecting); },{threshold:0.9}).observe(bc); }\n' +
'  /* reveal robusto: cualquier interseccion enciende, y hay red a los 3 s */\n' +
'  var rv=[].slice.call(document.querySelectorAll(".reveal"));\n' +
'  if("IntersectionObserver" in window){\n' +
'    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("visible"); io.unobserve(e.target); } }); },{threshold:0,rootMargin:"0px 0px 12% 0px"});\n' +
'    rv.forEach(function(el){ io.observe(el); });\n' +
'  } else { rv.forEach(function(el){ el.classList.add("visible"); }); }\n' +
'  setTimeout(function(){ document.documentElement.classList.add("sin-reveal"); }, 3000);\n' +
'  var riel=document.getElementById("escRiel");\n' +
'  var escenas=[].slice.call(document.querySelectorAll("[data-esc]"));\n' +
'  if(riel && "IntersectionObserver" in window){\n' +
'    var ob=new IntersectionObserver(function(es){\n' +
'      es.forEach(function(e){ if(e.isIntersecting){\n' +
'        var n=escenas.indexOf(e.target)+1;\n' +
'        riel.textContent=(n<10?"0"+n:n)+" · "+e.target.getAttribute("data-esc");\n' +
'      }});\n' +
'    },{rootMargin:"-40% 0px -55% 0px"});\n' +
'    escenas.forEach(function(s){ ob.observe(s); });\n' +
'  }\n' +
'})();\n' +
'</script>\n' +
/* galeria: avanza sola por GPU, se arrastra con dedo o mouse, y un toque abre */
'<script>\n' +
'(function(){\n' +
'  /* tactil: scroll nativo que avanza solo. Tocar lo detiene; a los 3,5 s de soltar sigue desde ahi. */\n' +
'  function autoNativo(gal){\n' +
'    gal.classList.add("v2-gal-nativa");\n' +
'    if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;\n' +
'    /* 60 px/s = 1 pixel por cuadro a 60 Hz: el navegador dibuja pixeles enteros, asi que a menos\n' +
'       velocidad avanza a saltos de 1 px cada dos o tres cuadros y se ve a tirones. */\n' +
'    var PXS=60, x=gal.scrollLeft, puesto=x, pausaHasta=performance.now()+700, visible=false, tocando=false, volviendo=false, antes=0;\n' +
'    function pausa(ms){ pausaHasta=Math.max(pausaHasta, performance.now()+ms); }\n' +
'    gal.addEventListener("touchstart",function(){ tocando=true; pausa(2500); },{passive:true});\n' +
'    gal.addEventListener("touchend",function(){ tocando=false; pausa(2000); },{passive:true});\n' +
'    gal.addEventListener("touchcancel",function(){ tocando=false; pausa(2000); },{passive:true});\n' +
'    gal.addEventListener("pointerdown",function(){ pausa(2500); },{passive:true});\n' +
'    gal.addEventListener("scroll",function(){ if(Math.abs(gal.scrollLeft-puesto)>2){ x=gal.scrollLeft; puesto=x; if(!volviendo) pausa(2000); } },{passive:true});\n' +
'    if("IntersectionObserver" in window){ new IntersectionObserver(function(es){ visible=es[0].isIntersecting; },{threshold:0.2}).observe(gal); } else visible=true;\n' +
'    function paso(t){\n' +
'      var dt=antes?Math.min(t-antes,50):16; antes=t;\n' +
'      if(visible && !document.hidden && !tocando && !volviendo && t>pausaHasta && !document.querySelector("dialog[open]")){\n' +
'        var fin=gal.scrollWidth-gal.clientWidth;\n' +
'        if(fin>0){\n' +
'          if(x>=fin-1){ volviendo=true; gal.scrollTo({left:0,behavior:"smooth"}); setTimeout(function(){ x=gal.scrollLeft; puesto=x; volviendo=false; pausa(2500); },1600); }\n' +
'          else { x=Math.min(x+PXS*dt/1000,fin); gal.scrollLeft=x; puesto=gal.scrollLeft; }\n' +
'        }\n' +
'      }\n' +
'      requestAnimationFrame(paso);\n' +
'    }\n' +
'    requestAnimationFrame(paso);\n' +
'  }\n' +
'  document.querySelectorAll(".v2-gal").forEach(function(gal){\n' +
'  if(matchMedia("(hover: none) and (pointer: coarse)").matches){ autoNativo(gal); return; }  /* tactil: scroll nativo que avanza solo */\n' +
'  var track=gal.querySelector(".v2-gal-track"), set=gal.querySelector(".v2-gal-set"); if(!track||!set) return;\n' +
'  var quieto=matchMedia("(prefers-reduced-motion: reduce)").matches;\n' +
'  /* VEL va en pixeles por segundo y se multiplica por el tiempo real entre cuadros: asi la velocidad\n' +
'     es la misma en pantallas de 60 y de 120 Hz, y si el navegador pierde un cuadro no se ve un tiron. */\n' +
'  var x=0, vel=0, VEL=58, ultimo=0, pausaHasta=0, encima=false, arr=null, movio=false, visible=true, w=0;\n' +
'  function medir(){ w=set.getBoundingClientRect().width; }\n' +
'  function pintar(){ if(w){ if(x>=w) x-=w; if(x<0) x+=w; } track.style.transform="translate3d("+(-x)+"px,0,0)"; }\n' +
'  function paso(t){\n' +
'    var dt=ultimo?Math.min((t-ultimo)/1000,0.05):0.016; ultimo=t;\n' +
'    if(visible && !document.hidden){\n' +
'      if(!arr){\n' +
'        if(Math.abs(vel)>0.05){ x+=vel; vel*=0.94; }\n' +
'        else if(!quieto && !encima && t>pausaHasta){ x+=VEL*dt; }\n' +
'      }\n' +
'      pintar();\n' +
'    }\n' +
'    requestAnimationFrame(paso);\n' +
'  }\n' +
'  var tocar=function(){ pausaHasta=performance.now()+3500; };\n' +
'  gal.addEventListener("pointerdown",function(e){\n' +
'    if(e.pointerType==="mouse" && e.button!==0) return;\n' +
'    arr={x:e.clientX,x0:x,ult:e.clientX,ultT:performance.now(),id:e.pointerId}; movio=false; vel=0; tocar();\n' +
'  });\n' +
'  gal.addEventListener("pointermove",function(e){\n' +
'    if(!arr || e.pointerId!==arr.id) return;\n' +
'    var d=e.clientX-arr.x;\n' +
'    if(!movio && Math.abs(d)>6){ movio=true; gal.classList.add("arrastrando"); try{ gal.setPointerCapture(e.pointerId); }catch(_){} }\n' +
'    if(movio){ x=arr.x0-d; var ahora=performance.now(); vel=-(e.clientX-arr.ult)/Math.max(1,(ahora-arr.ultT))*16; arr.ult=e.clientX; arr.ultT=ahora; pintar(); }\n' +
'  });\n' +
'  var soltar=function(){ if(!arr) return; arr=null; gal.classList.remove("arrastrando"); tocar(); };\n' +
'  gal.addEventListener("pointerup",soltar); gal.addEventListener("pointercancel",soltar);\n' +
'  gal.addEventListener("click",function(e){ if(movio){ e.preventDefault(); e.stopPropagation(); movio=false; } },true);\n' +
'  gal.addEventListener("wheel",function(e){ if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){ e.preventDefault(); x+=e.deltaX; pintar(); tocar(); } },{passive:false});\n' +
'  if(matchMedia("(hover: hover)").matches){ gal.addEventListener("mouseenter",function(){ encima=true; }); gal.addEventListener("mouseleave",function(){ encima=false; }); }\n' +
'  if("IntersectionObserver" in window){ new IntersectionObserver(function(es){ visible=es[0].isIntersecting; },{rootMargin:"200px 0px"}).observe(gal); }\n' +
'  addEventListener("resize",medir,{passive:true}); addEventListener("load",medir); medir();\n' +
'  requestAnimationFrame(paso);\n' +
'  });\n' +
'})();\n' +
'</script>\n';

/* ---------- 5 · armar y escribir ---------- */
const html = head + '</head>\n' + abreBody + '\n' +
  antes + announcement + headerHTML + '\n' +
  '<div class="esc-riel" id="escRiel" aria-hidden="true">01 · Inicio</div>\n' +
  '<main>\n' + nuevas.join('\n\n') + '\n' + cola + miniScript + '\n</body>\n</html>\n';

/* ---------- 5b · el copy, en la voz de la marca: empatico y directo ---------- */
let salida = html;
const parrafo = (inicio, nuevo) => {
  const re = new RegExp('<p([^>]*)>\\s*' + inicio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?<\\/p>');
  if (!re.test(salida)) { avisos.push('copy sin aplicar: ' + inicio.slice(0, 40)); return; }
  salida = salida.replace(re, (m, attrs) => '<p' + attrs + '>' + nuevo + '</p>');
};
/* el problema: el recuadro de la verdad */
salida = salida.replace(/<div class="truth">[\s\S]*?<\/div>/,
  '<div class="truth">Nadie lee antes de juzgar. <strong>Deciden en dos segundos, con los ojos.</strong> Y si tu anuncio se ve barato, tu producto se ve barato, por bueno que sea. No es culpa tuya: nadie te enseñó a dirigir una imagen. <strong>No pierdes ventas por tu precio. Las pierdes antes, en la primera mirada.</strong></div>');
parrafo('Mira los dos.',
  'Mira los dos. El primero es el típico anuncio que ves en todos lados y que se nota que está hecho con IA. El segundo es el mismo producto con <b>dirección visual de Prompt Ads</b>.');
salida = salida.replace('<h2>Si no te sirve, te devolvemos todo.</h2>', '<h2>Si no aprendes a crear estos anuncios, te devolvemos el 100%.</h2>');

/* tarjeta de precio (pedido del 22/08): escalera de valor a USD 500, y cuenta regresiva bajo el precio */
{
  const c0 = salida.indexOf('<aside class="price-card" id="precio">');
  const c1 = salida.indexOf('</aside>', c0);
  if (c0 === -1 || c1 === -1) avisos.push('no encontre la tarjeta de precio');
  else {
    let card = salida.slice(c0, c1);
    const valores = [
      ['<span>Corregí y Continuá</span><b>USD 24</b>', '<span>Corregí y Continuá</span><b>USD 34</b>'],
      ['<span>Variedad Total</span><b>USD 24</b>', '<span>Variedad Total</span><b>USD 30</b>'],
        /* La guia es la pieza que manda, asi que es la cara: 279 de los 500.
           Decir que era gratis contradecia toda la pagina. */
        ['<span>Guía de uso del sistema</span><b>GRATIS</b>', '<span><b>La guía del método</b></span><b>USD 279</b>'],
      ['<b>Incluido</b>', '<b class="v2-si">Incluido</b>'],
      ['<b><s>USD 205</s></b>', '<b><s>USD 500</s></b>'],
    ];
    valores.forEach(([a, b]) => { if (!card.includes(a)) avisos.push('tarjeta: no encontre ' + a.slice(0, 40)); card = card.replace(a, b); });
    const cuenta = '\n              <div class="v2-cuenta" aria-label="Cuenta regresiva hasta que suba el precio">' +
      '<div><b data-c="d">00</b><span>días</span></div><i></i>' +
      '<div><b data-c="h">00</b><span>horas</span></div><i></i>' +
      '<div><b data-c="m">00</b><span>min</span></div><i></i>' +
      '<div><b data-c="s">00</b><span>seg</span></div></div>';
    const fin = card.indexOf('</p>', card.indexOf('class="price-after"'));
    if (fin === -1) avisos.push('tarjeta: no encontre price-after');
    else card = card.slice(0, fin + 4) + cuenta + card.slice(fin + 4);
    /* el empujon final, justo antes del boton (Martino elige la version) */
    const EMPUJE = 'El riesgo es nuestro, no tuyo. Tienes <b>7 días de garantía</b> para aprender el método con calma. Si no aprendes a crear estos anuncios, recuperas el 100% de tu dinero. <b>No te vas a arrepentir.</b>';
    const btn = card.indexOf('<a class="btn checkout"');
    if (btn === -1) avisos.push('tarjeta: no encontre el boton de compra');
    else card = card.slice(0, btn) + '<p class="v2-empuje">' + EMPUJE + '</p>\n            ' + card.slice(btn);
    /* ---- copias disponibles de la edicion, debajo del boton ----
     *  NUMEROS REALES: VENDIDAS sale del export de Hotmart (ventas aprobadas del
     *  metodo, historicas). Actualizarlo cada vez que se revisa el export.
     *  Cuando VENDIDAS llegue a CUPO hay que suspender ventas en Hotmart, si no
     *  la frase deja de ser cierta.                                            */
    const CUPO = 150, VENDIDAS = 138;
    const QUEDAN = Math.max(0, CUPO - VENDIDAS), LLENO = Math.min(100, Math.round(VENDIDAS / CUPO * 100));
    const CUPO_HTML = '<p class="mv-cupo">'
      + '<span class="mv-cupo-txt"><i class="mv-cupo-pun"></i>Quedan <em>' + QUEDAN + ' de ' + CUPO + ' copias</em> disponibles de esta edición.</span>'
      + '<span class="mv-cupo-barra"><i style="width:' + LLENO + '%"></i></span></p>';
    const btn2 = card.indexOf('<a class="btn checkout"');
    const finBtn = btn2 === -1 ? -1 : card.indexOf('</a>', btn2) + 4;
    if (finBtn === -1) avisos.push('tarjeta: no pude poner las copias disponibles');
    else card = card.slice(0, finBtn) + '\n            ' + CUPO_HTML + card.slice(finBtn);
    salida = salida.slice(0, c0) + card + salida.slice(c1);
  }
}
/* ---------- el checkout apunta al curso, no al ebook ---------- */
/*  El ebook (8104687) no admite video. El curso (8476880) si, y ya esta
 *  aprobado y vendiendo. El script de mas abajo le sigue agregando sck y
 *  xcod a cualquier enlace de pay.hotmart.com, asi que la atribucion por
 *  anuncio no se toca. Para volver atras: cambiar esta linea y reconstruir.
 */
{
  const VIEJO = 'https://pay.hotmart.com/Y106693224R?checkoutMode=10';
  const NUEVO = 'https://pay.hotmart.com/G107515293E?off=1tbcugw1&checkoutMode=10';
  if (!salida.includes(VIEJO)) avisos.push('checkout: no encontre el enlace viejo');
  else salida = salida.split(VIEJO).join(NUEVO);
}
/* ---------- google ads (21/09) ---------- */
/*  Etiqueta de Google (AW-18441137893) y el codigo del clic del anuncio hasta
 *  Hotmart. La compra la marca Hotmart con su pixel de Google Ads (etiqueta
 *  SKmRCOStxv8cEOXdtdlE, solo pagos inmediatos); aca solo se asegura que el
 *  clic (gclid, gbraid, wbraid) llegue al pago, tambien si la persona vuelve
 *  otro dia sin el codigo en la direccion. La etiqueta se carga cuando la
 *  pagina termina de cargar (o a los 4 s), para no frenar el celular.
 *  No toca el pixel de Meta, ssTrack, sck ni xcod. Para sacarla: borrar este
 *  bloque y reconstruir. */
{
  const ID = 'AW-18441137893';
  const CABEZA = `<!-- Google Ads: etiqueta de Google -->
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${ID}',{linker:{domains:['pay.hotmart.com']}});
(function(){var hecho=0;function carga(){if(hecho)return;hecho=1;var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${ID}';document.head.appendChild(s);}
if(document.readyState==='complete')setTimeout(carga,0);else addEventListener('load',function(){setTimeout(carga,0);});setTimeout(carga,4000);})();
</script>`;
  const PIE = `<script>
/* Google Ads: guarda el codigo del clic del anuncio y se lo pasa a Hotmart en el enlace de pago */
(function(){var K='ss_gads_v1',C=['gclid','gbraid','wbraid'],g={};
try{g=JSON.parse(localStorage.getItem(K)||'{}')||{};}catch(e){g={};}
try{var q=new URLSearchParams(location.search),n=null;C.forEach(function(k){var v=q.get(k);if(v&&v.length<600){n=n||{t:Date.now()};n[k]=v;}});if(n)g=n;}catch(e){}
if(!g.t||Date.now()-g.t>90*864e5)g={};
try{if(g.t)localStorage.setItem(K,JSON.stringify(g));else localStorage.removeItem(K);}catch(e){}
if(!g.t)return;
function pasa(a){try{var u=new URL(a.href);C.forEach(function(k){if(g[k])u.searchParams.set(k,g[k]);});a.href=u.toString();}catch(e){}}
document.querySelectorAll('a[href*="pay.hotmart.com"]').forEach(pasa);
document.addEventListener('click',function(ev){var a=ev.target&&ev.target.closest&&ev.target.closest('a[href*="pay.hotmart.com"]');if(a)pasa(a);},true);})();
</script>`;
  if (salida.split('</head>').length !== 2) avisos.push('google ads: no encontre un solo </head>');
  else salida = salida.replace('</head>', () => CABEZA + '\n</head>');
  if (salida.split('</body>').length !== 2) avisos.push('google ads: no encontre un solo </body>');
  else salida = salida.replace('</body>', () => PIE + '\n</body>');
}
salida = salida.replace('<h2>Uno se ignora. El otro se siente como <em>marca.</em></h2>', '<h2>Uno se ignora. El otro se siente <em>premium.</em></h2>');
parrafo('No son prompts sueltos',
  'No son prompts sueltos para que pruebes suerte. Es un método de seis archivos y un video: empiezas por la guía, que te enseña a dirigir la IA, y las otras cinco son las que ella ejecuta. El motor que genera los anuncios, el que los vuelve reales, el que les da dirección y el que los corrige cuando algo sale mal. <b>Todo lo que una agencia cobra por separado, resuelto adentro</b>, con la guía paso a paso para que no pierdas ni una hora. Y el estilo lo eliges tú: el método te enseña a trasladar la estética que quieras a tu producto, sin que la IA la cambie. Y nada de documentos de puro texto: cada archivo está diseñado, con ejemplos visuales en cada paso. Y además de los archivos, <b>el video explicativo muestra el método entero funcionando</b>, de principio a fin.');
parrafo('Mientras algunos siguen publicando',
  'Sabemos cómo se siente publicar lo mismo de siempre y ver que no pasa nada. Mientras tanto, otros ya están sacando anuncios que parecen de marca grande con una foto y un chat. Lo que antes costaba una agencia, un equipo y semanas, <b>hoy lo haces tú solo, esta misma tarde</b>. Y el que empieza ahora le saca meses de ventaja al que espera.');
parrafo('Entra con el sistema listo',
  'Entra con el sistema listo y deja de regalarle horas a un diseño que no vende. Produce anuncios con calidad de estudio, de los que cobrarían miles de dólares, <b>sin diseñador, sin agencia y sin semanas de producción</b>. No tienes que aprender nada nuevo: solo seguir los pasos.');
parrafo('Pruébalo',
  'Pruébalo <b>7 días</b>. Lee la guía y mira el video explicativo, crea tu primera tanda, y si al terminar no sabes hacerlo con tu producto, pides el reembolso y recibes el <b>100% de tu dinero</b>. Sin vueltas y sin preguntas incómodas: lo procesa Hotmart, así que tu compra está protegida de punta a punta. <b>Todo el riesgo lo ponemos nosotros.</b>');
parrafo('Y no te dejamos solo',
  'Y no te dejamos solo. Si te trabas en algún punto, escríbenos a <a href="mailto:soporte@simplystudioai.com">soporte@simplystudioai.com</a> y te damos una mano directa. Queremos que de verdad te pueda ser útil, no que compres y no lo uses.');
parrafo('Si vendes algo real y necesitas mostrarlo mejor, funciona.',
  'Si vendes algo real y estás cansado de crear anuncios o contenido que se nota que están hechos con IA, esto es para ti. <b>Tú pones la foto y tus datos; el sistema pone la dirección creativa.</b> El tiempo que te ahorra, lo usas en vender.');
/* testimonios: vuelven las frases mas vivas de la version del 7/08 (!!, muuuy, taaan) y la de Martino tal cual */
const TESTIMONIOS = {
  'Michael T.': 'Empecé usándolo para mi propia marca y terminé armando una empresa aparte que le hace el contenido a otras agencias. <b>Nunca pensé que un producto de este precio me iba a abrir un ingreso nuevo!!</b>',
  'Melanie D.': 'Mis primeros anuncios los tuve en 5 minutos, y después <b>una tanda de más de 100 anuncios en menos de media hora</b>. Estoy muuuy agradecida con esta empresa, el producto es genial!!',
  'Sofía E.': 'No sé nada de diseño y pensé que no era para mí… es arrastrar archivos y escribir lo que quieres nomás. <b>Mi primera tanda me salió el mismo día!!</b>',
  'Valentina G.': 'Al principio no entendía nada y ni confiaba, pero adentro te explica taaan bien cómo usarlo que <b>al ratito ya tenía muchísimos anuncios listos jajjaja</b>',
  'Ricardo G.': 'Tengo una tienda online y renovar los creativos era un dolor de cabeza total. Ahora saco anuncios nuevos cada semana yo solo, <b>y se nota en las ventas!!</b>',
  'Enrique G.': 'Tengo un local y nunca pude pagarme una sesión de fotos. Ahora mis publicaciones se ven como las de las marcas grandes <b>y me lo dicen los clientes!!</b>',
  'Mathias D.': 'Creo contenido para varias marcas y esto me cambió el ritmo: entrego anuncios de nivel estudio en una fracción del tiempo. <b>Mis clientes quedan felices!!</b>',
  'Lucía E.': 'Con ChatGPT Plus saqué más de 50 anuncios en una sentada, y todos con <b>calidad de un diseñador que me cobraría miles de dólares</b>. Todavía no lo puedo creer.',
  'Camila S.': 'Increíble cómo ayuda a crear mejores anuncios. La diferencia con lo que hacía antes es enorme, <b>no hay con qué darle</b>.',
  'Cesar T.': 'El producto está muy pero muy bueno y súper fácil de usar. Pensé que iba a ser complicadísimo y en realidad <b>lo puede hacer cualquiera</b>.',
};
{
  const vistos = {};
  salida = salida.replace(/(<p class="tcard-q">)([\s\S]*?)(<\/p>[\s\S]{0,400}?<b>)([^<]*)(<\/b>)/g, (m, a, q, mid, quien, z) => {
    const k = quien.trim(); if (!TESTIMONIOS[k]) return m; vistos[k] = (vistos[k] || 0) + 1; return a + TESTIMONIOS[k] + mid + quien + z;
  });
  Object.keys(TESTIMONIOS).forEach(k => { if (!vistos[k]) avisos.push('testimonio sin aplicar: ' + k); });
}

/* la nota bajo los pasos se quita entera (pedido del 22/08): los pasos cierran directo con el boton */
{
  const re = /<p class="case-note[^"]*">[\s\S]*?<\/p>/;
  if (!re.test(salida)) avisos.push('no encontre la nota bajo los pasos');
  else salida = salida.replace(re, '');
}
parrafo('Tomamos la foto de un producto cualquiera',
  'Tomamos la foto simple de dos productos, un bolso y unas zapatillas, y en minutos salieron todos estos anuncios. Dentro del sistema ves <b>el proceso completo con capturas reales</b>, paso a paso, para que lo repitas con tu producto sin adivinar nada.');
parrafo('El mismo sistema de seis PDFs',
  'Ninguna la hizo una agencia. Cada una salió de una foto común y de los seis PDFs del sistema, en minutos. <b>Es exactamente lo que puedes hacer hoy con lo que tú vendes.</b>');

/* el problema, mas corto (pedido del 21/08): fuera 'Tres cosas que juzgan' y la lista de sintomas 01-04 */
salida = salida.replace(/<div class="v2-juicio">[\s\S]*?<\/div>/, '');
{
  const p0 = salida.indexOf('<div class="symptoms reveal">');
  if (p0 !== -1) {
    const pCta = salida.indexOf('<div class="shell v2-cta', p0);
    const pSec = salida.indexOf('</section>', p0);
    const corte = (pCta !== -1 && pCta < pSec) ? pCta : pSec;
    salida = salida.slice(0, p0) + '</div>\n' + salida.slice(corte);
  } else avisos.push('no encontre la lista de sintomas');
}

/* pie: fuera la nota de no afiliacion (pedido del 21/08) */
salida = salida.replace('<span>Prompt Ads es un producto independiente. No está afiliado ni respaldado por OpenAI, ChatGPT, Meta o Hotmart.</span>', '');

/* ---------- 5c · todas las imagenes nuevas en WebP ---------- */
salida = salida.replace(/assets\/(colabs|deco|fondos|caso-nike)\/([A-Za-z0-9_-]+)\.jpg/g, (m, c, f) =>
  fs.existsSync(path.join('assets', c, f + '.webp')) ? 'assets/' + c + '/' + f + '.webp' : m);

/* ---------- 5d · vocabulario: es un METODO, no un sistema ---------- */
/*  Los seis PDFs ya dicen "metodo" y "anuncios"; la web seguia diciendo
 *  "sistema" y "piezas". El que compraba leia una cosa y abria otra.
 *  Corre al final, sobre la salida ya armada, para alcanzar tambien lo que
 *  viene trasplantado de _base.html (alt, meta, FAQ).
 *  Nunca toca <script> ni <style>: ahi viven el pixel, ssTrack y la cuenta
 *  atras, y un reemplazo suelto ahi dentro rompe el tracking.
 */
{
  const VOZ = [
    ['El sistema de prompts y guías para convertir', 'El método de seis archivos para convertir'],
    ['el sistema definitivo para crear anuncios de alta conversión, con ejemplos de piezas premium', 'el método definitivo para crear anuncios de alta conversión, con ejemplos de anuncios premium'],
    ['de los seis PDFs del sistema, en minutos', 'de los seis PDFs del método, en minutos'],
    ['el mismo sistema · cada anuncio', 'el mismo método · cada anuncio'],
    ['Dentro del sistema ves', 'Dentro del método ves'],
    ['El sistema la convirtió en una campaña', 'El método la convirtió en una campaña'],
    ['de zapatilla generado con el sistema', 'de zapatilla generado con el Método Prompt Ads', true],
    ['Los seis PDFs del sistema, al chat.', 'Los seis PDFs del método, al chat.'],
    ['data-esc="El sistema"', 'data-esc="El método"'],
    ['el sistema pone la dirección creativa', 'el método pone la dirección creativa'],
    ['el sistema de visuales estratégicos que venden', 'el método de visuales estratégicos que venden'],
    ['Entra con el sistema listo', 'Entra con el método listo', true],
    ['No. El sistema te da una estructura concreta', 'No. El método te da una estructura concreta'],
    ['puedes arrancar y probar el sistema', 'puedes arrancar y probar el método'],
    ['El pack incluye un sistema guiado', 'El método incluye un archivo guiado'],
    ['puedes usar el sistema para producir anuncios', 'puedes usar el método para producir anuncios'],
    ['Corregí y Continuá', 'Corrige y Continúa', true],
    ['Es el archivo que más vale y el que hay que leer primero. Aquí aprendes a hablarle a la IA: las palabras exactas que entiende, cómo pasarle una referencia para que la respete de verdad, y qué escribir cuando el resultado no es el que querías. Los otros cinco son los que ella ejecuta.', 'Hay una diferencia entre pedirle un anuncio a la IA y dirigirla. Esa diferencia es este archivo: las palabras exactas que la IA obedece, el secreto para que cada anuncio salga exactamente como lo imaginaste, y la línea que lo endereza cuando sale distinto. Y nada de un PDF de puro texto que aburre: todo está explicado paso a paso, con capturas y ejemplos visuales en cada punto, pensado para que lo entiendas a la primera y lo uses el mismo día.'],
    ['eliges las referencias y revisas el resultado final antes de publicarlo', 'eliges el estilo que quieres y revisas el resultado final antes de publicarlo'],
    ['La fidelidad mejora cuanto mejores y más claras sean tus referencias. El pack te enseña qué material aportar y', 'La fidelidad mejora cuanto mejor aplicas el método: el pack te enseña exactamente qué aportar y'],
    ['producto físico, servicio, local, inmobiliaria o producto digital.', 'producto físico, servicio, local, inmobiliaria o producto digital. Y no es un PDF de puro texto hecho sin ganas: cada archivo está diseñado y acompañado de ejemplos visuales y capturas reales, para que entiendas el método de la forma más clara posible.'],
  ];
  const trozos = salida.split(new RegExp("(<script[^]*?<\/script>|<style[^]*?<\/style>)", "i"));
  for (const [a, b, todas] of VOZ) {
    let hubo = false;
    for (let i = 0; i < trozos.length; i += 2) {
      if (!trozos[i].includes(a)) continue;
      hubo = true;
      trozos[i] = todas ? trozos[i].split(a).join(b) : trozos[i].replace(a, b);
    }
    if (!hubo) avisos.push('vocabulario: no encontre "' + a.slice(0, 46) + '"');
  }
  salida = trozos.join('');
}

/* ---------- 5e · el estilo lo decides tu + el reloj pasa a ser el bonus ---------- */
/*  Las dos objeciones que frenan compradores calientes (comentario publico del
 *  30/08: "puedo elegir yo el estilo?" y "hay paso a paso?") se responden EN EL
 *  CUERPO de la pagina, con capturas reales del interior de la guia, y ademas
 *  en la FAQ. Y desde el peldano 67 (ultimo precio) el reloj ya no anuncia una
 *  suba: cuenta el cierre de la EDICION del mes (antes, el bonus semanal).
 *  Cada edicion trae un material exclusivo que se retira al cerrar.
 *  Para pasar a la edicion siguiente:
 *  cambiar REGALO aca y cierra_iso en herramientas/escalera-de-precios.json,
 *  despues reconstruir y correr cambiar-precio.js 67.
 */
{
  const REGALO = 'Lo que la IA no te va a enseñar';

  /* los textos vivos del reloj: de anunciar la suba a anunciar el bonus */
  const RELOJ = [
    ["lejos:   p => '<b>' + MAY(p) + ':</b> sube a <b>USD ' + SUBE_A + '</b> en'",
     "lejos:   p => '<b>Edición Septiembre</b> Incluye actualizaciones y un material exclusivo que no vuelve. Cierra en'"],
    ["cerca:   p => '<b>Últimos días</b> de ' + p + '. Sube a <b>USD ' + SUBE_A + '</b> en'",
     "cerca:   p => '<b>Edición Septiembre</b> Últimos días con el material exclusivo. Cierra en'"],
    ["ultimo:  () => '<b>Último día con el precio más bajo que va a tener.</b> Mañana sube a <b>USD ' + SUBE_A + '</b>.'",
     "ultimo:  () => '<b>Edición Septiembre</b> Último día con el material exclusivo.'"],
    ["fecha:   f => 'El <b>' + f + '</b> pasa a <b>USD ' + SUBE_A + '</b>'",
     "fecha:   f => 'Edición Septiembre: incluye actualizaciones y <b>" + REGALO + "</b>, el material exclusivo de esta edición'"],
    ["manana:  () => '<b>Mañana sube a USD ' + SUBE_A + '</b>'",
     "manana:  () => '<b>Último día de la Edición Septiembre</b>'"],
    ["arribaLejos: p => MAY(p)", "arribaLejos: p => 'Edición Septiembre'"],
    ["arribaCerca: 'Últimos días'", "arribaCerca: 'Últimos días de la edición'"],
    ["arribaUltimo: 'Último día'", "arribaUltimo: 'Último día de la edición'"],
    ["pie: 'Después sube a USD ' + SUBE_A", "pie: 'Actualizaciones y material exclusivo incluidos'"],
    ["pieManana: 'Mañana sube a USD ' + SUBE_A", "pieManana: 'Último día de la edición'"],
  ];
  for (const [a, b] of RELOJ) {
    if (!salida.includes(a)) { avisos.push('reloj-bonus: no encontre ' + a.slice(0, 38)); continue; }
    salida = salida.replace(a, b);   /* primera aparicion = bloque es; pt/en quedan como estan */
  }

  /* el boton del banner deja de hablar de precio y habla del regalo */
  salida = salida.split("Asegurar mi precio").join("Reclamar la edición");
  salida = salida.split("Cuenta regresiva hasta que suba el precio").join("Cuenta regresiva hasta que cierra la edición");

  /* ---------- los dos caminos: el cierre antes de la oferta ---------- */
  /*  El argumento hazlo-solo-o-compra-el-atajo, corto y sin seccion pesada:
   *  el que llega hasta aca ya quiere el resultado; esto le pone precio al
   *  camino de aprenderlo a los golpes.
   */
  {
    const CAMINOS =
      '<section data-esc="Dos caminos" class="difference">\n' +
      '<div class="shell"><div class="section-intro reveal">' +
      '<span class="eyebrow muted">Los dos caminos</span>' +
      '<div><h2>Hazlo solo. O <em>hazlo ya.</em></h2>' +
      '<p>Aprender esto por tu cuenta se puede: cuesta meses de prueba y error. El Método Prompt Ads es eso mismo, ya resuelto: <b>cada error ya cometido, cada solución ya escrita, cada paso en orden</b>. Tú solo sigues los pasos, y en una tarde estás creando. Pagas una vez y te ahorras el camino entero.</p>' +
      '</div></div></div>\n</section>\n\n';
    const iOferta = salida.indexOf('<section data-esc="La oferta"');
    if (iOferta === -1) avisos.push('dos caminos: no encontre la oferta');
    else salida = salida.slice(0, iOferta) + CAMINOS + salida.slice(iOferta);
  }



  /* ---------- el video, ultima tarjeta de "El metodo", despues de los seis archivos ---------- */
  /*  Va como una tarjeta mas de la lista, igual que los archivos, para que se
   *  lea como parte de lo que incluye y no como un agregado aparte. No suma
   *  al contador grande de la esquina: los archivos siguen siendo 01 a 06.
   */
  /*  Tres compradores lo pidieron por escrito. Va pegado al listado de los
   *  seis archivos: primero se ve lo que incluye, despues el video, y recien
   *  ahi el boton. Sin seccion aparte, para que se lea como una sola idea.
   *  En celular la portada rompe el contenedor y va de borde a borde.
   */
  {
    const iA = salida.indexOf('<section data-esc="El método"');
    if (iA === -1) avisos.push('video: no encontre la seccion El metodo');
    else {
      const iCta = salida.indexOf('<div class="inside-grid">', iA);
      if (iCta === -1) avisos.push('video: no encontre la grilla de archivos');
      else {
        const CSS_TARJETA =
          '<style>' +
          '.v2-card-video::before{counter-increment:none;content:""}' +
          '.v2-card-video .card-cover{aspect-ratio:16/9;background:#0b0f0c}' +
          '.v2-card-video .card-cover img{object-fit:cover}' +
          '.v2-card-video .v2-vid-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;' +
          'width:74px;height:74px;border-radius:50%;background:rgba(255,255,255,.94);' +
          'box-shadow:0 10px 40px rgba(0,0,0,.28);display:grid;place-items:center;pointer-events:none}' +
          '.v2-card-video .v2-vid-play:before{content:"";border-left:20px solid #14170f;' +
          'border-top:12px solid transparent;border-bottom:12px solid transparent;margin-left:6px}' +
          '@media(max-width:720px){.v2-card-video .v2-vid-play{width:58px;height:58px}' +
          '.v2-card-video .v2-vid-play:before{border-left-width:15px;border-top-width:9px;border-bottom-width:9px}}' +
          '</style>';
        const TARJETA =
          '\n          <article class="inside-card v2-card-video reveal">' +
          '<div class="card-cover"><span class="card-tag">Video explicativo</span>' +
          '<img src="assets/producto/video-portada.webp" width="1280" height="720" loading="lazy" decoding="async" ' +
          'alt="A la izquierda, la foto de producto tal como sale del celular. A la derecha, el mismo producto convertido en anuncio.">' +
          '<span class="v2-vid-play" aria-hidden="true"></span></div>' +
          '<div class="card-body"><h3>Y además, el video del método</h3>' +
          '<p>Además de los seis archivos, una grabación completa donde se crea un anuncio de principio a fin, sin cortes. ' +
          'Lo ves funcionando y lo aplicas igual a lo tuyo: no importa si vendes un producto o un servicio, el método es el mismo para cualquier rubro.</p></div>' +
          '</article>';
        const iUltima = salida.indexOf('</article>', salida.indexOf('Fuerza ángulos, escenas y copy nuevos', iCta));
        if (iUltima === -1) avisos.push('video: no encontre la ultima tarjeta de archivos');
        else {
          const iIn = iUltima + '</article>'.length;
          salida = salida.slice(0, iIn) + TARJETA + salida.slice(iIn);
        }
        salida = salida.replace('</head>', CSS_TARJETA + '</head>');
      }
    }
  }


  /* ---------- el stack de valor: video en la guia + el bonus ---------- */
  {
    const A = '<li><span><b>La guía del método</b></span><b>USD 279</b></li>';
    const B = '<li><span><b>La guía del método + vídeo explicativo</b></span><b>USD 279</b></li>';
    if (salida.includes(A)) salida = salida.replace(A, B);
    else avisos.push('stack: no encontre la linea de la guia');

    const C = '<li><span>Actualizaciones de esta edición</span><b class="v2-si">Incluido</b></li>';
    const D = C +
      '<li><span><b>Lo que la IA no te va a enseñar</b><br>' +
      '<small style="opacity:.7;font-size:.86em;line-height:1.45;display:block;margin-top:3px">' +
      'Exclusivo de la Edición Septiembre. Qué decir, a quién y a qué precio: lo que se aprende quemando miles de dólares en anuncios que no venden.' +
      '</small></span><b class="v2-si">Incluido</b></li>';
    if (salida.includes(C)) salida = salida.replace(C, D);
    else avisos.push('stack: no encontre la linea de actualizaciones');
  }

  /* ---------- lo que cuesta esperar: el miedo a perder, al final ---------- */
  /*  Va DESPUES de la galeria y de las opiniones, justo antes de las preguntas.
   *  El que llego hasta aca ya vio 35 anuncios que podria estar haciendo y ya
   *  leyo las opiniones: es el punto de maximo deseo y de maxima duda.
   *  El angulo es distinto al de "No te quedes atras" de la oferta, que habla
   *  de la ventaja de llegar primero. Este habla del costo de quedarse igual,
   *  y se apoya en la garantia real de 7 dias, no en escasez inventada.
   */
  {
    const ESPERAR =
      '<section data-esc="Lo que cuesta esperar" class="difference">\n' +
      '<div class="shell"><div class="section-intro reveal">' +
      '<span class="eyebrow muted">Lo que cuesta esperar</span>' +
      '<div><h2>Dentro de un mes vas a estar <em>exactamente donde estás hoy.</em></h2>' +
      '<p>Piensa en el último mes. Cuántas publicaciones hiciste, cuántas horas te llevaron y cuántas ventas trajeron. <b>Ese número no cambia solo:</b> el mes que viene va a ser igual, y el siguiente también, hasta que cambies algo.</p>' +
      '<p>Cada semana que sigue igual tiene un costo que no aparece en ninguna cuenta: las horas que se te van armando anuncios que no frenan a nadie, y lo que pagas por cada persona que ve tu anuncio y sigue de largo. No se siente como una pérdida porque nunca la ves junta. Pero está, y se acumula.</p>' +
      '<p><b>Probarlo te cuesta una tarde, y tienes siete días para arrepentirte y recuperar tu dinero. No probarlo te cuesta otro mes igual al anterior.</b> De los dos caminos, solo uno tiene devolución.</p>' +
      '<p><a href="#precio" class="btn">Quiero empezar hoy</a></p>' +
      '</div></div></div>\n</section>\n\n';
    const iFaq = salida.indexOf('<section data-esc="Preguntas"');
    if (iFaq === -1) avisos.push('lo que cuesta esperar: no encontre las preguntas');
    else salida = salida.slice(0, iFaq) + ESPERAR + salida.slice(iFaq);
  }

  /* ---------- marquesina 2: "Hazlo", tras la garantia ---------- */
  /*  Genera deseo despues del cierre: 20 anuncios de 5 marcas que NO estan en
   *  la galeria del principio (perfume, sillas, comida, termos, skincare).
   *  Mismo mecanismo de scroll que la galeria de arriba, con su propio motor
   *  porque el original solo agarra la primera .v2-gal de la pagina.
   */
  {
    const PIEZAS2 = [["g2-01-byredo","Anuncio editorial de perfume creado con el Método Prompt Ads"],["g2-02-muuto","Anuncio de diseño de una silla creado con el Método Prompt Ads"],["g2-03-burguer","Anuncio gastronómico creado con el Método Prompt Ads"],["g2-04-stanley","Anuncio comparativo de un termo creado con el Método Prompt Ads"],["g2-05-ordinary","Anuncio de skincare creado con el Método Prompt Ads"],["g2-06-byredo","Anuncio de perfume con dirección de arte, hecho con el método"],["g2-07-muuto","Anuncio minimalista de mobiliario, hecho con el método"],["g2-08-burguer","Anuncio de hamburguesa bajo el agua, hecho con el método"],["g2-09-stanley","Anuncio deportivo de un termo, hecho con el método"],["g2-10-ordinary","Anuncio editorial de sérum, hecho con el método"],["g2-11-byredo","Anuncio de lujo de perfume, hecho con el método"],["g2-12-muuto","Anuncio de una silla sobre el agua, hecho con el método"],["g2-13-burguer","Anuncio de hamburguesa con auto clásico, hecho con el método"],["g2-14-stanley","Anuncio de termo en cielo abierto, hecho con el método"],["g2-15-ordinary","Anuncio de textura de sérum, hecho con el método"],["g2-16-byredo","Anuncio de perfume en atardecer, hecho con el método"],["g2-17-muuto","Anuncio de silla con modelo, hecho con el método"],["g2-18-burguer","Anuncio creativo de hamburguesa, hecho con el método"],["g2-19-stanley","Anuncio urbano de termo, hecho con el método"],["g2-20-ordinary","Anuncio científico de skincare, hecho con el método"],["g2-22-muuto","Anuncio de dos sillas en el campo, hecho con el método"],["g2-23-burguer","Anuncio de la anatomía de una hamburguesa, hecho con el método"],["g2-24-stanley","Anuncio de termo en movimiento, hecho con el método"],["g2-25-ordinary","Anuncio editorial de sérum puro, hecho con el método"],["g2-26-byredo","Anuncio floral de perfume, hecho con el método"],["g2-27-muuto","Anuncio de silla flotante, hecho con el método"],["g2-28-burguer","Anuncio de capas de hamburguesa, hecho con el método"],["g2-29-stanley","Anuncio deportivo de pausa e hidratación, hecho con el método"],["g2-30-ordinary","Anuncio de equilibrio de skincare, hecho con el método"],["g2-31-byredo","Anuncio de perfume en el desierto, hecho con el método"],["g2-32-muuto","Anuncio de dos formas de habitar, hecho con el método"],["g2-33-burguer","Anuncio de pausa con hamburguesa, hecho con el método"],["g2-34-stanley","Anuncio urbano de termo en uso, hecho con el método"],["g2-35-ordinary","Anuncio clínico de skincare, hecho con el método"],["g2-36-redbull","Anuncio de verano de Red Bull, hecho con el método"]];
    const MARCA2 = { byredo: 'Byredo', muuto: 'Muuto', burguer: 'Simply Burguer', stanley: 'Stanley', ordinary: 'The Ordinary', redbull: 'Red Bull' };
    const piezas2 = PIEZAS2.map(([f, alt], i) => {
      const marca = MARCA2[f.split('-')[2]] || 'simply studio';
      const num = String(i + 1).padStart(2, '0') + ' / ' + PIEZAS2.length;
      return '<figure class="v2-piece"><button class="zoomable" type="button" data-full="assets/galeria2/' + f + '.webp" aria-label="Ampliar anuncio de ' + marca + '">' +
        '<img src="assets/galeria2/' + f + '.webp" alt="' + alt + '" loading="lazy" decoding="async" width="600" height="750">' +
        '</button></figure>';
    }).join('');
    const GAL2 =
      '<section data-esc="Hazlo" class="difference v2-hazlo">\n' +
      '<div class="shell"><div class="section-intro reveal">' +
      '<span class="eyebrow muted">Todo esto salió del método</span>' +
      '<div><h2>Hazlo. <em>Empieza a crear anuncios así.</em></h2>' +
      '<p>Perfume, muebles, comida, deporte, skincare. Ninguno pasó por una agencia: cada uno salió de una foto real y del método. <b>El próximo puede ser de tu producto.</b></p></div></div></div>\n' +
      '<div class="v2-gal" id="galeria2"><div class="v2-gal-track">' +
      '<div class="v2-gal-set">' + piezas2 + '</div>' +
      '<div class="v2-gal-set" aria-hidden="true">' + piezas2 + '</div>' +
      '</div></div>\n' +
      '<div class="shell" style="text-align:center;margin-top:28px"><a href="#precio" style="display:inline-block;background:var(--ink,#171713);color:#F2EEE5;padding:17px 34px;border-radius:999px;font-weight:600;text-decoration:none">Quiero crear los míos</a></div>\n' +
      
      '</section>\n\n';
    const iProof2 = salida.indexOf('<section data-esc="Opiniones" class="proof proof-2"');
    if (iProof2 === -1) avisos.push('marquesina 2: no encontre proof-2 para inyectar');
    else salida = salida.slice(0, iProof2) + GAL2 + salida.slice(iProof2);
  }


  /* una pregunta nueva en la FAQ, antes de la de diseno */
  const FAQ1 = '<details><summary>¿Puedo elegir yo el estilo o lo decide la IA?</summary><p>Tú mandas, siempre. Ves un estilo que te gusta —de cualquier marca, de cualquier rubro— y el método te enseña a ponerlo al servicio de TU producto, sin que la IA lo cambie ni invente nada. Uno de los seis archivos, <b>Dirección Visual</b>, existe solo para eso: convertir la estética que tienes en la cabeza en instrucciones exactas. Y si un resultado se desvía, el archivo de correcciones trae la línea para enderezarlo.</p></details>';
  /* el boton del banner: ya no hay suba de precio que asegurar */
  /* el boton 'Asegurar mi precio' vivia en el banner, que ya no existe */

  const anclaFaq = '<details><summary>¿Necesito saber diseño?';
  if (!salida.includes(anclaFaq)) avisos.push('no encontre la FAQ para las preguntas nuevas');
  else salida = salida.replace(anclaFaq, FAQ1 + anclaFaq);
}

/* ---------- el titular de "para quien es" ---------- */
{
  const V = 'más rápido y con calidad de marca grande, esto es para ti.';
  const N = 'más rápido y con calidad como de las grandes marcas del mundo, esto es para ti.';
  if (salida.includes(V)) salida = salida.split(V).join(N);
  else avisos.push('para quien es: no encontre el titular');
}

/* ---------- el bonus en verde, y el video sin promesa de clic ---------- */
/*  El regalo se lee mejor si tiene color propio: en el banner oscuro va un
 *  verde claro, en la barra de celular el verde de marca sobre crema.
 *  Y debajo de la portada del video, una linea que aclara donde esta el
 *  video, para que el triangulo no prometa una reproduccion que no existe.
 */
{
  const CSS = '<style>' +
    '.announcement-inner [data-cuenta="banner"] b{color:var(--white,#fffdf8)}' +
    '.announcement-inner [data-cuenta="banner"] b:first-child{color:#8CCBA3}' +
    '.announcement .v2-cuenta-mini b{color:#FF7A6B}' +
    '.mobile-buy .v2-cuenta-mini b{color:#B3261E}' +
    '.mobile-buy [data-cuenta="movil-arriba"]{color:var(--verde-si,#1E5A3A)}' +
    '.mobile-buy [data-cuenta="movil"]{color:var(--ink,#171713)}' +
    '.v2-vid-cover{cursor:default}' +
    '.v2-vid-pie{max-width:720px;margin:12px auto 0;text-align:center;' +
    'font-size:.92rem;line-height:1.5;opacity:.62}' +
    '@media(max-width:760px){.v2-vid-pie{padding:0 22px}}' +
    '</style>';
  salida = salida.replace('</head>', CSS + '</head>');
}

/* ---------- opiniones: un solo motor para el carrusel ---------- */
/*  Las dos filas de opiniones tenian dos motores a la vez: la animacion CSS
 *  v2marq, que movia la fila sola, y el script que responde al dedo. La
 *  animacion pisa el transform del script, y como su keyframe solo define el
 *  final, cuanto mas avanza el ciclo menos mueve el dedo: al principio desliza
 *  y hacia el final queda duro. Se apaga la animacion (el script ya mueve la
 *  fila solo) y el arrastre pasa a tomar el control recien cuando el gesto es
 *  horizontal, igual que la galeria de anuncios.
 *  De paso, el aviso "Desliza para ver mas historias" vuelve a estar centrado.
 */
{
  const INI = "      // Frenar mientras se mira, para poder leer";
  const FIN = "      // La rueda del ratón también lo mueve en horizontal";
  const NUEVO = "      // Frenar mientras se mira, para poder leer (solo con mouse: en el celular\n      // el dedo ya lo frena al tocar, y pointerleave llega recién al soltar)\n      row.addEventListener('pointerenter', e=>{ if(e.pointerType === 'mouse'){ clearTimeout(volver); quieto = true; } });\n      row.addEventListener('pointerleave', e=>{ if(e.pointerType === 'mouse') quieto = false; });\n\n      // Arrastre. Solo toma el control cuando el gesto es claramente horizontal:\n      // si el dedo va hacia arriba o abajo, lo deja pasar y la página hace scroll\n      // normal. La velocidad al soltar se mide en el tiempo y no por evento, así\n      // la inercia se siente igual en cualquier celular.\n      let conDedo = false, gesto = null;\n      row.addEventListener('pointerdown', e=>{\n        if(e.pointerType === 'mouse' && e.button !== 0) return;\n        conDedo = e.pointerType === 'touch';\n        gesto = { x0: e.clientX, y0: e.clientY, ult: e.clientX, t: performance.now(), id: e.pointerId, horizontal: false };\n        inercia = 0;\n        quieto = true; clearTimeout(volver);\n        arrancar();\n      });\n      row.addEventListener('pointermove', e=>{\n        if(!gesto || e.pointerId !== gesto.id) return;\n        const dx = e.clientX - gesto.x0, dy = e.clientY - gesto.y0;\n        if(!gesto.horizontal){\n          if(Math.abs(dx) < 6 && Math.abs(dy) < 6) return;\n          if(Math.abs(dy) > Math.abs(dx)){ gesto = null; quieto = false; return; }\n          gesto.horizontal = true; arrastrando = true;\n          row.classList.add('agarrando');\n          track.style.willChange = 'transform';\n          try{ row.setPointerCapture(e.pointerId); }catch(err){}\n        }\n        const ahora = performance.now();\n        const d = e.clientX - gesto.ult;\n        x += d;\n        inercia = Math.max(-40, Math.min(40, d / Math.max(1, ahora - gesto.t) * 16));\n        gesto.ult = e.clientX; gesto.t = ahora;\n        pintar();\n      });\n      const soltar = ()=>{\n        const habia = arrastrando;\n        gesto = null;\n        if(!habia){ quieto = false; return; }\n        arrastrando = false;\n        row.classList.remove('agarrando');\n        track.style.willChange = 'auto';\n        clearTimeout(volver);\n        // Con el dedo retoma al rato, cuando la inercia ya se apagó.\n        volver = setTimeout(()=>{ quieto = false; }, conDedo ? 900 : 1200);\n      };\n      ['pointerup','pointercancel'].forEach(ev=>row.addEventListener(ev, soltar));\n      row.addEventListener('pointerleave', e=>{ if(e.pointerType !== 'touch') soltar(); });\n\n";
  const CSS = "<style>.m-track,.proof-2 .m-track{animation:none!important}.proof .marquee-hint{display:flex;align-items:center;justify-content:center;gap:10px;text-align:center;width:100%;box-sizing:border-box;padding:0 20px}</style>";
  const i0 = salida.indexOf(INI), i1 = salida.indexOf(FIN);
  if (i0 === -1 || i1 === -1 || i1 < i0) avisos.push('opiniones: no encontre el bloque de arrastre');
  else salida = salida.slice(0, i0) + NUEVO + salida.slice(i1);
  if (salida.indexOf(INI) !== salida.lastIndexOf(INI)) avisos.push('opiniones: el bloque de arrastre aparece dos veces');
  if (!salida.includes('</head>')) avisos.push('opiniones: no encontre </head>');
  else salida = salida.replace('</head>', CSS + '</head>');
}

/* ---------- revision en todos los tamanos de pantalla ---------- */
/*  a. Bajo el pie quedaba una franja crema de 70 px en celular: era el hueco
 *     reservado para la barra fija de compra, que se ve vacio cuando la barra
 *     se oculta. Ahora ese espacio lo tiene el pie, que es oscuro. Y como la
 *     barra aparece en todos los tamanos, en tablet ya no tapa el copyright.
 *  b. En tablet y computadora con barra de desplazamiento visible, las
 *     secciones a sangre (width:100vw) median 15 px de mas y la pagina se
 *     corria de costado. overflow-x:clip lo corta sin romper el header fijo.
 *  c. A 320 px el boton "Conseguir Prompt Ads" se salia 3 px de la pantalla.
 *  d. "Quiero el bonus" media 15 px de alto: dificil de tocar con el dedo.
 */
{
  const CSS = "<style>body{padding-bottom:0!important}footer{padding-bottom:env(safe-area-inset-bottom,0px)}html{overflow-x:clip}@media(max-width:360px){.nav{gap:10px}.brand{font-size:17px}.nav-links .btn{padding:0 10px;font-size:10px;letter-spacing:.04em}}@media(max-width:720px){.announcement a{display:inline-block;padding:8px 6px;margin:-8px -6px}.btn.ghost{min-height:40px;display:inline-flex;align-items:center}}</style>";
  if (!salida.includes('</head>')) avisos.push('dispositivos: no encontre </head>');
  else salida = salida.replace('</head>', CSS + '</head>');
}

/* ---------- titulo de la guia: es la guia de uso del metodo, no un archivo mas ---------- */
{
  const V = '<h3>La guía · empieza por aquí</h3>';
  const N = '<h3>La guía de uso del método</h3>';
  if (!salida.includes(V)) avisos.push('guia: no encontre el titulo');
  else salida = salida.replace(V, N);
}

/* ---------- edicion: barra con registro de lujo ---------- */
/*  Negro, marfil y dorado en vez del rojo de oferta. "Edicion Septiembre" como
 *  rotulo en versalitas doradas y una sola frase corta al lado. */
{
  const CSS = "<style>.announcement{background:#0e0e0b;border-bottom:1px solid rgba(201,179,126,.28)}.announcement-inner{color:#CFC8B6;letter-spacing:.03em}.announcement-inner [data-cuenta=\"banner\"] b{color:#EDE5CF;font-weight:500}.announcement-inner [data-cuenta=\"banner\"] b:first-child{color:#C9B37E;text-transform:uppercase;letter-spacing:.2em;font-size:.9em;margin-right:10px}.announcement .v2-cuenta-mini{background:transparent;border:1px solid rgba(201,179,126,.38)}.announcement .v2-cuenta-mini b{color:#EDE5CF}.announcement .v2-cuenta-mini i{color:#8F8671}.announcement a{color:#C9B37E;text-decoration:none;border-bottom:1px solid rgba(201,179,126,.55);text-transform:uppercase;letter-spacing:.16em;font-size:.88em;padding-bottom:1px}.announcement a:hover{color:#EDE5CF;border-bottom-color:#EDE5CF}.mobile-buy [data-cuenta=\"movil-arriba\"]{color:#7A6440;letter-spacing:.18em;text-transform:uppercase}.mobile-buy [data-cuenta=\"movil\"]{color:var(--ink,#171713)}.mobile-buy .v2-cuenta-mini b{color:#7A6440}</style>";
  salida = salida.replace('</head>', CSS + '</head>');
}

/* ---------- inicio con la galeria: estilos ---------- */
{
  const CSS = "<style>.v2-hero-gal{padding-top:clamp(20px,3vw,44px)}.v2-hero-gal-head{text-align:center;margin:0 auto clamp(22px,3vw,40px)}.v2-hero-gal-head h1{font:400 clamp(44px,6vw,88px)/.95 \"Instrument Serif\",Georgia,serif;letter-spacing:-.045em;margin:10px auto 0;max-width:18ch}.v2-nw{white-space:nowrap}.v2-hero-gal-head h1 em{font-style:italic}.v2-hero-gal-pie{text-align:center;max-width:720px;margin:clamp(26px,3.4vw,44px) auto 0}.v2-hero-gal-tit{font:400 clamp(28px,3.4vw,44px)/1.05 \"Instrument Serif\",Georgia,serif;letter-spacing:-.03em;margin:0 0 12px}.v2-hero-gal-txt{margin:0 auto;max-width:600px;color:var(--muted,#6b6a63);font-size:clamp(15px,1.25vw,17px);line-height:1.55}.v2-hero-gal-txt b{color:var(--ink,#171713);font-weight:600}.v2-hero .v2-hero-h{font:400 clamp(40px,5.6vw,84px)/1.02 \"Instrument Serif\",Georgia,serif;letter-spacing:-.035em;margin:18px 0 18px;max-width:min(19ch,100%)}.v2-hero .v2-hero-h em{font-style:italic}@media(max-width:720px){.v2-hero-gal-head h1{font-size:clamp(32px,9.6vw,46px);max-width:none}.v2-hero .v2-hero-h{font-size:clamp(34px,9.5vw,48px);max-width:none}.v2-hero-gal-pie{padding:0 4px}}.faq-wrap{padding-top:clamp(28px,3.6vw,44px)}.v2-hero-gal-head .eyebrow{justify-content:center}.v2-hero-gal-head .eyebrow::after{content:\"\";width:26px;height:1px;background:currentColor;opacity:.5;flex:none}.v2-hero-gal .v2-gal-nota{flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px}.btn:not(.light):not(.ghost){background:linear-gradient(120deg,var(--forest-deep) 0%,var(--ink) 48%,#0b0b09 72%,var(--forest) 100%);background-size:220% 100%;background-position:0% 50%;box-shadow:inset 0 1px 0 rgba(255,255,255,.10),inset 0 0 0 1px rgba(201,185,138,.24),0 12px 30px -14px rgba(21,34,24,.6);transition:background-position .7s var(--ease),box-shadow .45s var(--ease),transform .45s var(--ease)}.btn:not(.light):not(.ghost):hover{background-position:100% 50%;box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 0 0 1px rgba(201,185,138,.5),0 18px 38px -14px rgba(21,34,24,.7)}@media(prefers-reduced-motion:reduce){.btn:not(.light):not(.ghost){transition:none}}</style>";
  salida = salida.replace('</head>', CSS + '</head>');
}

/* ---------- giro del ebook relativo a la pantalla ---------- */
/*  El script original media el avance desde scrollY = 0, pensado para un
 *  ebook arriba de todo. Ahora vive en la segunda seccion: gira desde que
 *  asoma por abajo (85% del alto de pantalla) hasta que su mitad llega al
 *  tercio de arriba. Asi da la vuelta entera mientras se ve, este donde este.
 */
{
  const GIRO = [
    ['var actual = -1, vivo = false, pedido = false, recorrido = 1;',
     'var actual = -1, vivo = false, pedido = false, recorrido = 1, inicio = 0;'],
    ['recorrido = Math.max((r.top + scrollActual() + r.height) * 0.62, 1);',
     'inicio = r.top + scrollActual() - innerHeight * 0.85;\n          recorrido = Math.max(r.height * 0.5 + innerHeight * 0.6, 1);'],
    ['var p = Math.min(Math.max(scrollActual() / recorrido, 0), 1);',
     'var p = Math.min(Math.max((scrollActual() - inicio) / recorrido, 0), 1);'],
  ];
  GIRO.forEach(([a, b]) => {
    if (!salida.includes(a)) avisos.push('OJO giro: no encontre ' + a.slice(0, 48));
    else salida = salida.split(a).join(b);
  });
}

/* ---------- la barra fija se va cuando aparece el pie ---------- */
/*  El pie tiene su propio boton. Si la barra se queda, tapa el copyright y
 *  obliga a dejar un margen vacio abajo. Asi el copyright queda al fondo.
 */
{
  const CSS = '<style>html.pie-visible .mobile-buy.show{transform:translateY(110%)}</style>';
  const JS = '<script>(function(){var p=document.querySelector("footer");if(!p)return;' +
    'if(!("IntersectionObserver" in window))return;' +
    'new IntersectionObserver(function(e){document.documentElement.classList.toggle("pie-visible",e[0].isIntersecting)},{rootMargin:"0px 0px -8px 0px"}).observe(p);' +
    '})();</script>';
  salida = salida.replace('</head>', CSS + '</head>').replace('</body>', JS + '</body>');
}

/* ---------- caso con tiras: estilos y comportamiento ---------- */
/*  Vidrio con la misma receta que las tarjetas (tcard, precio, garantia).
 *  Alto fijo por tira y ancho segun la proporcion de cada imagen: nada se
 *  recorta. En celular el panel se abre casi de borde a borde. */
{
  const CSS = `<style>
.v2-caso{margin:clamp(26px,3.4vw,44px) 0 clamp(52px,7vw,96px)}
.v2-caso-tabs{display:flex;gap:4px;width:max-content;max-width:100%;margin:0 auto clamp(16px,2vw,24px);padding:5px;border-radius:999px;
  background:linear-gradient(135deg,rgba(255,255,255,.66) 0%,rgba(255,255,255,.3) 100%);border:1px solid rgba(255,255,255,.75);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 18px 40px -24px rgba(20,20,16,.38);
  -webkit-backdrop-filter:blur(18px) saturate(1.45);backdrop-filter:blur(18px) saturate(1.45)}
.v2-caso-tab{display:flex;align-items:center;gap:10px;padding:5px 20px 5px 5px;border:0;border-radius:999px;background:transparent;cursor:pointer;
  font:500 11px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-2);
  transition:background .5s var(--ease),color .5s var(--ease),box-shadow .5s var(--ease)}
.v2-caso-tab img{width:32px;height:32px;border-radius:50%;object-fit:cover;flex:none;background:var(--paper-2);box-shadow:0 0 0 1px rgba(20,20,16,.1)}
@media(hover:hover){.v2-caso-tab:not(.on):hover{background:rgba(255,255,255,.6)}}
.v2-caso-tab.on{color:var(--paper);background:linear-gradient(120deg,var(--forest-deep) 0%,var(--ink) 55%,#0b0b09 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1),inset 0 0 0 1px rgba(201,185,138,.24),0 10px 24px -12px rgba(21,34,24,.6)}
.v2-caso-tab.on img{box-shadow:0 0 0 1.5px rgba(201,185,138,.75)}
.v2-caso-vitrina{position:relative;overflow:hidden;border-radius:24px;padding:14px 0;
  background:linear-gradient(135deg,rgba(255,255,255,.58) 0%,rgba(255,255,255,.24) 42%,rgba(255,255,255,.16) 100%);
  border:1px solid rgba(255,255,255,.55);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -22px 44px -34px rgba(255,255,255,.9),0 34px 80px -34px rgba(20,20,16,.32);
  -webkit-backdrop-filter:blur(22px) saturate(1.5);backdrop-filter:blur(22px) saturate(1.5)}
.v2-caso-tira{--h:clamp(320px,30vw,430px);position:relative;display:flex;align-items:center;gap:12px;padding:0 14px;
  overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scroll-padding-inline:14px;
  scrollbar-width:none;-webkit-overflow-scrolling:touch;outline:0}
.v2-caso-tira::-webkit-scrollbar{display:none}
.v2-caso-tira[hidden]{display:none!important}
.v2-caso-tira:focus-visible{outline:2px solid var(--forest);outline-offset:-2px}
.v2-caso-tira.entra{animation:v2CasoEntra .8s var(--ease) both}
.v2-caso-tira img{-webkit-user-drag:none;user-select:none;-webkit-user-select:none}
@media(hover:hover) and (pointer:fine){.v2-caso-tira{cursor:grab}}
.v2-caso-tira.arrastrando{cursor:grabbing;scroll-snap-type:none;scroll-behavior:auto}
.v2-caso-tira.arrastrando .zoomable{pointer-events:none}
@keyframes v2CasoEntra{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
.v2-caso-fig{flex:none;height:var(--h);margin:0;scroll-snap-align:start;border-radius:14px;overflow:hidden;background:var(--paper-2);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 16px 34px -22px rgba(20,20,16,.42)}
.v2-caso-fig .zoomable{display:block;position:relative;width:100%;height:100%;padding:0;border:0;background:none;border-radius:inherit;overflow:hidden;cursor:zoom-in}
.v2-caso-fig img{display:block;width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease)}
@media(hover:hover){.v2-caso-fig:hover img{transform:scale(1.035)}}
.v2-caso-chip{position:absolute;left:10px;top:10px;padding:8px 11px;border-radius:999px;
  font:500 9.5px/1 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--ink);
  background:linear-gradient(135deg,rgba(255,255,255,.8),rgba(255,255,255,.48));border:1px solid rgba(255,255,255,.85);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 8px 20px -10px rgba(20,20,16,.4);
  -webkit-backdrop-filter:blur(10px) saturate(1.4);backdrop-filter:blur(10px) saturate(1.4)}
.v2-caso-puente{flex:none;position:relative;z-index:2;display:grid;place-items:center;width:46px;height:46px;margin:0 -29px;border-radius:50%;color:var(--ink);
  background:linear-gradient(135deg,rgba(255,255,255,.82),rgba(255,255,255,.44));border:1px solid rgba(255,255,255,.9);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 12px 26px -12px rgba(20,20,16,.45);
  -webkit-backdrop-filter:blur(12px) saturate(1.4);backdrop-filter:blur(12px) saturate(1.4)}
.v2-caso-nota{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:clamp(14px,1.8vw,20px);
  font:400 10px/1.55 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);text-align:center}
.v2-caso-mover{flex:none;display:grid;place-items:center;width:42px;height:42px;padding:0;border-radius:50%;cursor:pointer;color:var(--ink);
  background:linear-gradient(135deg,rgba(255,255,255,.74),rgba(255,255,255,.36));border:1px solid rgba(255,255,255,.82);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 10px 24px -14px rgba(20,20,16,.4);
  -webkit-backdrop-filter:blur(12px) saturate(1.4);backdrop-filter:blur(12px) saturate(1.4);
  transition:background .4s var(--ease),color .4s var(--ease),opacity .4s var(--ease)}
@media(hover:hover){.v2-caso-mover:hover:not(:disabled){background:var(--ink);color:var(--paper)}}
.v2-caso-mover:disabled{opacity:.35;cursor:default}
.v2-caso-tab:focus-visible,.v2-caso-mover:focus-visible{outline:2px solid var(--forest);outline-offset:3px}
@media(max-width:720px){
  .v2-caso-vitrina{margin-inline:calc(10px - var(--gut));border-radius:20px;padding:10px 0;
    background:linear-gradient(135deg,rgba(255,255,255,.7) 0%,rgba(255,255,255,.4) 45%,rgba(255,255,255,.3) 100%);
    -webkit-backdrop-filter:none;backdrop-filter:none}
  .v2-caso-tira{--h:min(86vw,400px);gap:10px;padding:0 10px;scroll-padding-inline:10px}
  .v2-caso-fig{border-radius:12px}
  .v2-caso-puente{width:40px;height:40px;margin:0 -25px}
  .v2-caso-tab{gap:8px;padding:4px 16px 4px 4px;font-size:10.5px}
  .v2-caso-tab img{width:30px;height:30px}
  .v2-caso-nota{gap:12px}
  .v2-caso-nota span{max-width:250px}
  .v2-caso-mover{width:38px;height:38px}
}
@media(prefers-reduced-motion:reduce){.v2-caso-tira.entra{animation:none}.v2-caso-fig img{transition:none}}
</style>`;
  const JS = `<script>(function(){
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  [].forEach.call(document.querySelectorAll(".v2-caso"), function(c){
    var tabs = [].slice.call(c.querySelectorAll(".v2-caso-tab")),
        tiras = [].slice.call(c.querySelectorAll(".v2-caso-tira")),
        movs = [].slice.call(c.querySelectorAll(".v2-caso-mover")),
        actual = 0;
    if (!tabs.length || tabs.length !== tiras.length) return;
    function estado(){
      var t = tiras[actual];
      if (!t.clientWidth) { movs.forEach(function(b){ b.disabled = false; }); return; }
      var fin = t.scrollWidth - t.clientWidth - 2;
      movs.forEach(function(b){ b.disabled = (+b.getAttribute("data-mover") < 0) ? t.scrollLeft <= 2 : t.scrollLeft >= fin; });
    }
    function ir(n, animar, foco){
      actual = n;
      tabs.forEach(function(t, i){ var si = i === n; t.classList.toggle("on", si); t.setAttribute("aria-selected", si ? "true" : "false"); t.tabIndex = si ? 0 : -1; });
      tiras.forEach(function(t, i){ t.hidden = i !== n; });
      var t = tiras[n]; t.scrollLeft = 0;
      if (animar && !quieto) { t.classList.remove("entra"); void t.offsetWidth; t.classList.add("entra"); }
      if (foco) tabs[n].focus();
      estado();
    }
    tabs.forEach(function(t, i){
      t.addEventListener("click", function(){ if (i !== actual) ir(i, true); });
      t.addEventListener("keydown", function(e){
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault(); ir((i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length, true, true);
      });
    });
    tiras.forEach(function(t){
      t.addEventListener("scroll", estado, { passive: true });
      t.addEventListener("animationend", function(){ t.classList.remove("entra"); });
      if ("ResizeObserver" in window) new ResizeObserver(estado).observe(t);
      /* mouse: se arrastra como con el dedo; al soltar se acomoda en la pieza mas cercana */
      var arr = null, movio = false;
      t.addEventListener("pointerdown", function(e){ if (e.pointerType !== "mouse" || e.button !== 0) return; arr = { x: e.clientX, s: t.scrollLeft, id: e.pointerId, v: 0, u: e.clientX }; movio = false; });
      t.addEventListener("pointermove", function(e){
        if (!arr || e.pointerId !== arr.id) return;
        var d = e.clientX - arr.x;
        if (!movio && Math.abs(d) > 6) { movio = true; t.classList.add("arrastrando"); try { t.setPointerCapture(e.pointerId); } catch (_) {} }
        if (movio) { arr.v = e.clientX - arr.u; arr.u = e.clientX; t.scrollLeft = arr.s - d; }
      });
      var soltar = function(){
        if (!arr) return; var v = arr.v; arr = null; if (!movio) return;
        var pad = parseFloat(getComputedStyle(t).paddingLeft) || 0, meta = t.scrollLeft - v * 8, mejor = 0, dist = 1e9;
        [].forEach.call(t.querySelectorAll(".v2-caso-fig"), function(f){ var p = f.offsetLeft - pad, dd = Math.abs(p - meta); if (dd < dist) { dist = dd; mejor = p; } });
        /* el iman vuelve recien cuando termina de acomodarse: si no, salta hacia atras un instante */
        var fin = function(){ clearTimeout(tm); t.removeEventListener("scrollend", fin); t.classList.remove("arrastrando"); };
        var tm = setTimeout(fin, 750); t.addEventListener("scrollend", fin);
        t.scrollTo({ left: Math.min(mejor, t.scrollWidth - t.clientWidth), behavior: quieto ? "auto" : "smooth" });
        setTimeout(function(){ movio = false; }, 0);
      };
      t.addEventListener("pointerup", soltar); t.addEventListener("pointercancel", soltar);
      t.addEventListener("click", function(e){ if (movio) { e.preventDefault(); e.stopPropagation(); } }, true);
    });
    movs.forEach(function(b){ b.addEventListener("click", function(){
      var t = tiras[actual];
      t.scrollBy({ left: (+b.getAttribute("data-mover")) * Math.max(t.clientWidth * 0.8, 220), behavior: quieto ? "auto" : "smooth" });
    }); });
    addEventListener("resize", estado, { passive: true });
    /* al acercarse la seccion, las primeras del otro producto se bajan antes: el cambio es instantaneo */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function(es){
        if (!es[0].isIntersecting) return; io.disconnect(); estado();
        tiras.forEach(function(t){ [].slice.call(t.querySelectorAll("img"), 0, 3).forEach(function(im){ im.loading = "eager"; }); });
      }, { rootMargin: "600px 0px" });
      io.observe(c);
    }
    ir(0, false);
  });
})();</script>`;
  salida = salida.replace('</head>', CSS + '</head>').replace('</body>', JS + '</body>');
}

/* ---------- galerias en pantallas tactiles: deslizar nativo (18/09) ---------- */
/*  En iPhone la marquesina movida por JS (una tira de 36.000 px con 116 piezas
 *  que avanza sola y va cargando fotos grandes) agotaba la memoria y Safari
 *  cerraba la pagina. En pantallas tactiles la galeria pasa a scroll nativo:
 *  sin motor, sin la copia duplicada, con iman por pieza. En escritorio sigue
 *  la marquesina de siempre. */
{
  const CSS = '<style>@media (hover:none) and (pointer:coarse){' +
    '.v2-gal{overflow-x:auto!important;overflow-y:hidden!important;touch-action:auto!important;cursor:auto!important;' +
    'scroll-snap-type:none;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none}' +
    '.v2-gal::-webkit-scrollbar{display:none}' +
    '.v2-gal-track{transform:none!important;will-change:auto!important;animation:none!important;' +
    'padding-left:var(--gut,20px)!important;padding-right:calc(var(--gut,20px) - 18px)!important}' +
    '.v2-gal-set[aria-hidden="true"]{display:none!important}' +
    '.v2-gal .v2-piece{scroll-snap-align:none}' +
    '.v2-gal-desliza .ar{animation:v2EmpujaDer 1.8s cubic-bezier(.45,0,.2,1) infinite}' +
    '.v2-gal-desliza .ar:first-child{animation-name:v2EmpujaIzq}' +
    '@keyframes v2EmpujaDer{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}' +
    '@keyframes v2EmpujaIzq{0%,100%{transform:translateX(0)}50%{transform:translateX(-5px)}}' +
    '@media (prefers-reduced-motion:reduce){.v2-gal-desliza .ar{animation:none}}' +
    '.v2-hero-gal .v2-gal{animation:none!important;opacity:1!important;transform:none!important}' +
    '}</style>';
  salida = salida.replace('</head>', CSS + '</head>');
}
/* el boton "Ver que puedes crear" llevaba a la galeria, que ahora es lo primero: sobra */
{
  const re = /\s*<a class="btn ghost" href="#resultado">Ver qué puedes crear<\/a>/;
  if (!re.test(salida)) avisos.push('no encontre el boton Ver que puedes crear');
  else salida = salida.replace(re, '');
}

/* ---------- 5f · mas visual (21/09): contador que acompaña, demo del chat, circulo de aprender solo, popup y comparacion con New Balance ---------- */
/*  Las piezas viven en _mas-visual.html / .css / .js (empiezan con _ : Vercel no las sube; quedan dentro del index). */
{
  const MV_HTML = fs.readFileSync('_mas-visual.html', 'utf8');
  const parte = n => { const m = MV_HTML.split('<!--@@' + n + '-->')[1]; return m ? m.split('<!--@@')[0].trim() : ''; };
  const RELOJ = '<b data-c=d>00</b><i>d</i><b data-c=h>00</b><i>h</i><b data-c=m>00</b><i>m</i><b data-c=s>00</b><i>s</i>';
  const cambia = (viejo, nuevo, nombre) => { if (!salida.includes(viejo)) avisos.push('mas visual: no encontre ' + nombre); else salida = salida.split(viejo).join(nuevo); };
  /* 1 · la barra fija de abajo lleva el reloj */
  /* el texto de abajo lo sigue escribiendo cambiar-precio.js; queda oculto y el reloj va al lado */
  const reMovil = /(<b data-cuenta="movil">[\s\S]*?<\/b>)/;
  /* (la barra de abajo se sacó el 22/09: su reloj ya no se inserta) */
  /* 2 · (el reloj del header se sacó el 22/09: la franja de arriba queda fija con su reloj) */
  /* 3 · los tres pasos pasan a ser la demo del chat */
  const rePasos = /<div class="case-steps">(?:\s*<article class="case-step reveal">[\s\S]*?<\/article>){3}\s*<\/div>/;
  if (!rePasos.test(salida)) avisos.push('mas visual: no encontre los tres pasos'); else salida = salida.replace(rePasos, parte('demo'));
  /* 4 · los dos caminos: el circulo de aprender solo contra la linea recta del metodo */
  const reCaminos = /<section data-esc="Dos caminos" class="difference">[\s\S]*?<\/section>/;
  if (!reCaminos.test(salida)) avisos.push('mas visual: no encontre los dos caminos'); else salida = salida.replace(reCaminos, parte('caminos'));
  /* 4b · el ahorro en barras, en lugar de la lista de lo que costaria */
  const reCosto = /<p class="cost-intro">[\s\S]*?<p class="cost-bridge">[\s\S]*?<\/p>/;
  if (!reCosto.test(salida)) avisos.push('mas visual: no encontre lo que costaria'); else salida = salida.replace(reCosto, parte('ahorro'));
  /* 5 · comparacion: el mismo New Balance, feo y con direccion (el 990 editorial) */
  cambia('assets/prompt-ads/05-comparacion-anuncio-generico-640.webp 640w, assets/prompt-ads/05-comparacion-anuncio-generico.webp 1000w', 'assets/versus-nb/generico-640.webp 640w, assets/versus-nb/generico.webp 1122w', 'srcset generico');
  cambia('assets/prompt-ads/06-comparacion-anuncio-premium-640.webp 640w, assets/prompt-ads/06-comparacion-anuncio-premium.webp 1000w', 'assets/versus-nb/premium-990-640.webp 640w, assets/versus-nb/premium-990.webp 1122w', 'srcset premium');
  cambia('assets/prompt-ads/05-comparacion-anuncio-generico-640.webp', 'assets/versus-nb/generico-640.webp', 'generico 640');
  cambia('assets/prompt-ads/05-comparacion-anuncio-generico.webp', 'assets/versus-nb/generico.webp', 'generico');
  cambia('assets/prompt-ads/06-comparacion-anuncio-premium-640.webp', 'assets/versus-nb/premium-990-640.webp', 'premium 640');
  cambia('assets/prompt-ads/06-comparacion-anuncio-premium.webp', 'assets/versus-nb/premium-990.webp', 'premium');
  salida = salida.replace(/(src="assets\/versus-nb\/(?:generico|premium-990)\.webp" )width="1254" height="1254"/g, '$1width="1122" height="1402"');
  /* la X roja sobre el generico y el visto azul sobre el premium */
  const X = '<span class="mv-x" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><path d="M36 36 64 64"/><path d="M64 36 36 64"/></svg></span>';
  const OK = '<span class="mv-ok" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><path d="M31 52 45 66 71 37"/></svg></span>';
  const reGen = /(<button class="zoomable" data-full="assets\/versus-nb\/generico\.webp"[\s\S]*?<\/button>)/;
  const rePre = /(<button class="zoomable" data-full="assets\/versus-nb\/premium-990\.webp"[\s\S]*?<\/button>)/;
  if (!reGen.test(salida) || !rePre.test(salida)) avisos.push('mas visual: no encontre las imagenes de la comparacion');
  else salida = salida.replace(reGen, '$1' + X).replace(rePre, '$1' + OK);
  /* 6 · popup + estilos + comportamiento */
  /* comprimido: sin comentarios ni sangrías (pesa menos en el celular) */
  const miniCSS = t => t.replace(/\/\*[\s\S]*?\*\//g, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).join('\n');
  const miniJS = t => t.replace(/^[ \t]*\/\*[\s\S]*?\*\/[ \t]*\r?\n/gm, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).join('\n');
  const CSS = '<style>' + miniCSS(fs.readFileSync('_mas-visual.css', 'utf8')) + '</style>';
  /* el popup va antes del lightbox: asi existe cuando corre el script que hace andar los relojes */
  cambia('<dialog class="lightbox"', parte('popup') + ' <dialog class="lightbox"', 'el lightbox (popup)');
  /* 7 · garantía: el sello nuevo, la confianza en la tarjeta de precio y "hecho por nosotros" */
  cambia('<div class="seal"><div><b>7 días</b><span>Aprendes o te devolvemos</span></div></div>', parte('sello'), 'el sello de garantia');
  const reConf = /<div class="trust-row">[\s\S]*?<\/div>\s*<p class="secure">[\s\S]*?<\/p>/;
  if (!reConf.test(salida)) avisos.push('mas visual: no encontre la fila de confianza'); else salida = salida.replace(reConf, parte('confianza'));
  const iG = salida.indexOf('<section data-esc="Garantía" class="guarantee">');
  const fG = iG < 0 ? -1 : salida.indexOf('</section>', iG);
  if (fG < 0) avisos.push('mas visual: no encontre la seccion de garantia'); else salida = salida.slice(0, fG) + parte('nuestro') + '\n' + salida.slice(fG);
  /* 8 · la marca: "Método Prompt Ads" con brillo en la portada; en el título de la galería, grande y subrayada */
  cambia('<span class="eyebrow muted v2-sube d1">Método Prompt Ads para ChatGPT</span>', '<span class="eyebrow muted v2-sube d1"><span class="mv-marca">Método Prompt Ads</span> para ChatGPT</span>', 'la marca de la portada');
  cambia('Todos estos anuncios salieron con el <em>Método Prompt Ads.</em>', 'Todos estos anuncios salieron con el <em class="mv-marca mv-marca-grande">Método Prompt Ads.</em>', 'la marca del titulo de la galeria');
  /* 9 · qué pasa cuando compras: el paso 3 nombra el video y la guía, en el mismo orden que la línea del método */
  cambia('<li>Entras, sigues la guía y creas tus primeros anuncios <b>en minutos</b>.</li>', '<li>Entras, miras el video explicativo, sigues la guía y creas tus primeros anuncios <b>en minutos</b>.</li>', 'el paso 3 de que pasa cuando compras');
  /* 10 · la letra chic de la marca, el título de "qué incluye" y la marca arriba del precio */
  /* las fuentes, servidas desde la propia web (las mismas de Google Fonts): sin pedido externo que frene la primera pintura.
     Se precargan las tres que se ven apenas abre la página. */
  const reFuentes = /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet">/;
  const PRECARGA = ['instrument-serif-normal-400-latin', 'instrument-serif-italic-400-latin', 'inter-normal-latin'].map(n => '<link rel="preload" href="assets/fonts/' + n + '.woff2" as="font" type="font/woff2" crossorigin>').join('');
  if (!reFuentes.test(salida)) avisos.push('mas visual: no encontre las fuentes de Google'); else salida = salida.replace(reFuentes, PRECARGA + '<style>' + fs.readFileSync('_fuentes.css', 'utf8').trim() + '</style>');
  /* el reloj de la franja viene en el HTML (antes lo agregaba el script al final y la página saltaba) */
  const reBanner = /(<span data-cuenta="banner">[\s\S]*?<\/span>)/;
  if (!reBanner.test(salida)) avisos.push('mas visual: no encontre la franja'); else salida = salida.replace(reBanner, '$1<span class="v2-cuenta-mini">' + RELOJ + '</span>');
  const reGuardia = /if\(ban\)\{(\s*var mini=document\.createElement\("span"\);)/;
  if (!reGuardia.test(salida)) avisos.push('mas visual: no encontre el script del reloj de la franja'); else salida = salida.replace(reGuardia, 'if(ban&&!ban.parentNode.querySelector(".v2-cuenta-mini")){$1');
  cambia('<h2>¿Qué incluye el método Prompt Ads?</h2>', '<h2>¿Qué incluye el <em class="mv-marca mv-marca-grande mv-marca-izq mv-marca-h2">Método Prompt Ads?</em></h2>', 'el titulo de que incluye');
  const reRotulo = /(<span class="launch-tag">[^<]*<\/span>)/;
  if (!reRotulo.test(salida)) avisos.push('mas visual: no encontre el rotulo del precio'); else salida = salida.replace(reRotulo, '$1<span class="mv-marca mv-marca-precio">Método Prompt Ads</span>');
  /* 11 · la franja compacta que queda fija arriba al bajar (antes del script de los relojes, para que el suyo ande) */
  /* (la franja compacta se sacó el 22/09: la franja real, completa, queda fija) */
  /* 12 · textos: "esto es para ti" en verde, el método v13 (una guía y cinco archivos) y sin rayas largas */
  cambia('esto es para ti.</h2>', '<em>esto es para ti.</em></h2>', 'el titulo de para quien es');
  const reRaya = /empiezan a parecerse\s*(?:—|&mdash;)\s*sin perder coherencia/;
  if (!reRaya.test(salida)) avisos.push('mas visual: no encontre la raya de variedad total'); else salida = salida.replace(reRaya, 'empiezan a parecerse, sin perder coherencia');
  const reFaqQue = /Son <b>6 archivos en PDF<\/b> que trabajan juntas:[\s\S]*?producto físico, servicio, local, inmobiliaria o producto digital\./;
  if (!reFaqQue.test(salida)) avisos.push('mas visual: no encontre la pregunta de que es'); else salida = salida.replace(reFaqQue, 'Son <b>6 archivos en PDF</b> que trabajan juntos: <b>2 son guías que lees tú, y empiezas por ahí</b> (la guía de uso paso a paso, que te enseña todo el proceso con capturas, y la de dirección visual), y <b>4 son archivos de prompts e instrucciones</b> que arrastras directo al chat de ChatGPT (el Protocolo Maestro, el de realismo, el de correcciones y el de variedad). No es un software ni una app: <b>lees la guía, subes la foto de lo que vendes, pegas los archivos en ChatGPT y te genera los anuncios</b>. Funciona para cualquier negocio: producto físico, servicio, local, inmobiliaria o producto digital.');
  const reFaqEstilo = /Ves un estilo que te gusta\s*(?:—|&mdash;)de cualquier marca, de cualquier rubro(?:—|&mdash;)\s*y el método[\s\S]*?instrucciones exactas\./;
  if (!reFaqEstilo.test(salida)) avisos.push('mas visual: no encontre la pregunta del estilo'); else salida = salida.replace(reFaqEstilo, 'Ves un estilo que te gusta, de cualquier marca o rubro, y el método te enseña a ponerlo al servicio de TU producto, sin que la IA lo cambie ni invente nada. Uno de los seis archivos, <b>Dirección Visual</b>, existe solo para eso: convertir la estética que tienes en la cabeza en instrucciones exactas.');
  const JS = '<script>' + miniJS(fs.readFileSync('_mas-visual.js', 'utf8')) + '</script>';
  salida = salida.replace('</head>', CSS + '</head>').replace('</body>', JS + '</body>');
}

fs.writeFileSync('_nueva.html', salida, 'utf8');
console.log('  _nueva.html: ' + Math.round(salida.length / 1024) + ' KB');

/* ---------- 6 · verificacion ---------- */
const debe = ['id="resultado"', 'id="incluye"', 'id="oferta"', 'id="preguntas"', 'id="precio"',
  'id="prodImg"', 'id="prodGiro"', 'id="lightbox"', 'id="mobileBuy"',
  'data-cuenta="banner"', 'fbq(', 'ssTrack', 'LIMITE', 'const PRECIO = 47',
  'v2-gal-set', 'esc-riel', 'prodFlotar', 'v2-sube d1'];
debe.forEach(m => { if (!salida.includes(m)) avisos.push('FALTA: ' + m); });
['vitrina-inexistente'].forEach(m => { if (salida.includes(m)) avisos.push('SOBRA: ' + m); });
console.log('  piezas: ' + PIEZAS.length + ' x2  ·  scripts: ' + (html.match(/<script/g) || []).length +
  '  ·  main: ' + (html.match(/<main>/g) || []).length + '/' + (html.match(/<\/main>/g) || []).length);
console.log(avisos.length ? avisos.map(a => '  ' + a).join('\n') : '  verificacion: todo presente');
