// OCTOBER BLACK · publicada el 1/10/2026 a las 12:00
// Parte de _base-octubre.html (la web de septiembre, main 82a3e59) y escribe _october-black.html:
//   1. Sin "Edición Septiembre": ni el material exclusivo (se retira, como se prometió) ni el contador de copias.
//   2. El pack nuevo: Errores comunes, Ángulos que venden y Avatares hiperrealistas adentro, y el Plan 365 de regalo
//      mientras dure October Black. Cada pieza con su tarjeta y su mockup en "Qué incluye".
//   3. Precio: USD 67 durante October Black; cuando el reloj llega a cero (FIN a las 12:00 de Paraguay), USD 87.
//      El reloj es el de siempre (LIMITE), así que después del cierre hay que publicar la versión a 87.
//   4. Menos promesas: se sacan las frases nuestras que prometen ventas y la pila de "valor total" en dólares.
//      La comparación con el mercado (agencia, fotos, diseñador) queda: es el ancla honesta del precio.
//   5. Tema October Black: toda la web en noche y oro.
// Cada cambio tiene que encontrar su lugar exactamente una vez; si no, no escribe nada.
// Uso: node _armar-october-black.js      (con --origen otro.html para partir de otra página)
const fs = require('fs');
const path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const ORIGEN = path.join(__dirname, arg('--origen', '_base-octubre.html'));   // index.html ya es la salida publicada
const DESTINO = path.join(__dirname, '_october-black.html');

const FIN = '2026-10-12';        // el día en que termina October Black (a las 12:00 de Paraguay) y sube el precio
const FIN_TEXTO = '12 de octubre';
const PRECIO = 67, DESPUES = 87;

let h = fs.readFileSync(ORIGEN, 'utf8');
const original = h;
const fallas = [];
function cambiar(nombre, patron, reemplazo) {
  const re = patron instanceof RegExp ? new RegExp(patron.source, patron.flags.replace('g', '') + 'g') : null;
  const veces = re ? (h.match(re) || []).length : h.split(patron).length - 1;
  if (veces !== 1) { fallas.push(nombre + ' (aparece ' + veces + ' veces)'); return; }
  h = re ? h.replace(new RegExp(patron.source, patron.flags.replace('g', '')), reemplazo) : h.replace(patron, () => reemplazo);
}

// ---------- 0 · marca de borrador ----------
cambiar('doctype', /<!doctype html>/i, m => m + '\n<!-- OCTOBER BLACK · la arma _armar-october-black.js a partir de _base-octubre.html. No editar a mano. -->');

// ---------- 1 · barra de arriba ----------
cambiar('banner', /<span data-cuenta="banner">[\s\S]*?<\/span>/, `<span data-cuenta="banner"><b>October Black</b> El pack completo a USD ${PRECIO}. Sube a USD ${DESPUES} en</span>`);
cambiar('reclamar', />\s*Reclamar la edición\s*</, '>Ver la oferta<');

// ---------- 2 · inicio: el sello del evento, arriba del título ----------
cambiar('sello', '<div class="showcase-head v2-hero-gal-head">',
  `<div class="showcase-head v2-hero-gal-head"><div class="ob-sello v2-sube d1"><i aria-hidden="true"></i><b>October Black</b><span>hasta el ${FIN_TEXTO}</span></div>`);

// ---------- 3 · menos promesas (solo frases nuestras: las opiniones de clientes no se tocan) ----------
cambiar('titular del método', ' en minutos y <em>aumenta tus ventas.</em></h2>', ' en minutos.</h2>');
cambiar('marcas que facturan', 'el método que hace que tu marca se vea como las que facturan millones', 'el método que hace que tu marca se vea como las grandes marcas del mundo');
cambiar('opiniones 1', '<h2>Dejaron de improvisar y <em>empezaron a vender.</em></h2>', '<h2>Dejaron de improvisar. <em>Ahora sus anuncios se ven de marca.</em></h2>');
cambiar('opiniones 2', 'nota en las ventas.</em></h2>', 'nota en cada anuncio.</em></h2>');

// ---------- 4 · qué incluye: las tarjetas de siempre, de arriba hacia abajo, con los mockups nuevos ----------
// Martino (30/09) pidió volver al formato de antes, una tarjeta debajo de la otra: "hay gente que no puede scrollear o se
// olvida". Las seis tarjetas de archivos quedan con su texto; cambian las fotos por los mockups nuevos (hechos con sus
// referencias de escena) y después se suman las piezas nuevas con el mismo formato. El video va último (Martino, 30/09).
// Las fotos viven en assets/pack/ (900 px, y 600 px para el celular). En el celular la foto se recorta a 4:3:
// ENCUADRE dice qué parte de la foto queda a la vista (la altura), para que no se corte el libro.
const FOTO_NUEVA = {
  'guia-de-uso': '01-guia-de-uso', 'protocolo-maestro': '02-protocolo-maestro', 'reality-layer': '03-reality-layer',
  'direccion-visual': '04-direccion-visual', 'corregi-continua': '05-corrige-y-continua', 'variedad-total': '06-variedad-total'
};
const ENCUADRE = { '03-reality-layer': '70%', '04-direccion-visual': '30%', '07-errores-comunes': '55%', '09-avatares-hiperrealistas': '20%', '10-marketing-y-ventas': '40%' };
const foto = (archivo, alt) => `<picture><source media="(max-width:760px)" srcset="assets/pack/${archivo}-600.webp"><source srcset="assets/pack/${archivo}-600.webp 600w, assets/pack/${archivo}.webp 900w" sizes="510px"><img decoding="async" src="assets/pack/${archivo}.webp" width="900" height="900" loading="lazy" alt="${alt}"${ENCUADRE[archivo] ? ` style="object-position:50% ${ENCUADRE[archivo]}"` : ''}></picture>`;
const tarjeta = (clase, tag, archivo, alt, titulo, texto) => `
<article class="inside-card ${clase} reveal"><div class="card-cover"><span class="card-tag">${tag}</span>${foto(archivo, alt)}</div><div class="card-body"><h3>${titulo}</h3><p>${texto}</p></div></article>`;
const NUEVAS =
  tarjeta('ob-card', 'Nuevo', '07-errores-comunes', 'La guía Errores comunes y cómo solucionarlos, del Método Prompt Ads', 'Errores comunes y cómo solucionarlos',
    'Un texto que no combina con la imagen, anuncios saturados, un producto que de costado sale raro, diez anuncios iguales. Los diez tropiezos que más se repiten y cómo arreglar cada uno, en 26 páginas.') +
  tarjeta('ob-card', 'Nuevo', '08-angulos-que-venden', 'La guía Ángulos que venden, del Método Prompt Ads', 'Ángulos que venden',
    '120 formas de vender lo mismo, en 12 familias, con ejemplos de productos y de servicios. El método te enseña cómo se ve tu anuncio; esta guía, qué decir en cada uno.') +
  tarjeta('ob-card', 'Ahora incluido', '09-avatares-hiperrealistas', 'La guía Cómo crear avatares hiperrealistas, del Método Prompt Ads', 'Cómo crear avatares hiperrealistas',
    'Una cara propia para tu marca, que no existe en ninguna parte y se mantiene igual en todos tus anuncios. Antes se vendía aparte: ahora viene en el pack.') +
  tarjeta('ob-card ob-card-regalo', 'Regalo October Black', '11-plan-365', 'El Plan 365 en Excel, un plan de acción de un año', 'Plan 365: un año de ideas',
    `Tu plan de acción de un año: un ángulo de venta y una idea de anuncio para cada día, con su prompt, para productos y para servicios. Se lo pasas a ChatGPT y lo adapta a tu negocio en minutos. De regalo con October Black, hasta el ${FIN_TEXTO}.`);
cambiar('qué incluye', /<div class="inside-grid">[\s\S]*?<\/article>\s*<\/div>/, grilla => {
  const una = (nombre, re, fn) => {
    const n = (grilla.match(new RegExp(re.source, 'g')) || []).length;
    if (n !== 1) { fallas.push(nombre + ' (aparece ' + n + ' veces)'); return; }
    grilla = grilla.replace(re, fn);
  };
  for (const [viejo, nuevo] of Object.entries(FOTO_NUEVA))
    una('foto de ' + viejo, new RegExp('<picture><source media="\\(max-width:760px\\)" srcset="assets/mockups-modulos/' + viejo + '-600\\.webp">[\\s\\S]*?alt="([^"]*)"></picture>'), (m, alt) => foto(nuevo, alt));
  // las piezas nuevas entran antes del video, así el video queda último
  una('piezas nuevas', /<article class="inside-card v2-card-video reveal">/, m => NUEVAS + '\n' + m);
  // el video, que ahora cierra la lista, ya no viene "además de los seis archivos" sino de todo el pack
  una('texto del video', /Además de los seis archivos, una grabación completa/, () => 'Además de los archivos y las guías, una grabación completa');
  return grilla;
});

// ---------- 5 · la tarjeta de precio ----------
cambiar('pila', /<ul class="stack">[\s\S]*?<\/ul>\s*<div class="stack-total">[\s\S]*?<\/div>/, `<ul class="stack">
 <li><span><b>La guía del método + video explicativo</b></span><b class="v2-si">Incluido</b></li>
 <li><span>Protocolo Maestro</span><b class="v2-si">Incluido</b></li>
 <li><span>Reality Layer</span><b class="v2-si">Incluido</b></li>
 <li><span>Dirección Visual</span><b class="v2-si">Incluido</b></li>
 <li><span>Corrige y Continúa</span><b class="v2-si">Incluido</b></li>
 <li><span>Variedad Total</span><b class="v2-si">Incluido</b></li>
 <li><span><b>Errores comunes y cómo solucionarlos</b><small class="ob-que">La frase exacta para arreglar cada error.</small></span><b class="v2-si ob-nuevo">Nuevo</b></li>
 <li><span><b>Ángulos que venden</b><small class="ob-que">Qué decir en cada anuncio: 120 formas, con ejemplos.</small></span><b class="v2-si ob-nuevo">Nuevo</b></li>
 <li><span><b>Cómo crear avatares hiperrealistas</b><small class="ob-que">Una cara propia para tu marca.</small></span><b class="v2-si">Incluido</b></li>
 <li class="ob-regalo"><span><b>Plan 365</b><small class="ob-que">Tu plan de acción de un año, adaptado a tu negocio. Solo en October Black.</small></span><b class="v2-si">Regalo</b></li>
 <li><span>Actualizaciones del método</span><b class="v2-si">Incluido</b></li>
</ul> <div class="stack-total"><span>Todo incluido</span><b>Pago único</b></div>`);
cambiar('etiqueta del precio', '<span class="launch-tag">Método completo</span>', '<span class="launch-tag">October Black</span>');
cambiar('texto bajo el precio', /<p class="price-after" data-cuenta="despues">[\s\S]*?<\/p>/, `<p class="price-after" data-cuenta="despues">Precio October Black hasta el <b>${FIN_TEXTO}</b>. Después sube a USD ${DESPUES}.</p>`);
cambiar('reloj de la tarjeta', 'aria-label="Cuenta regresiva hasta que cierra la edición"', 'aria-label="Cuenta regresiva hasta que termina October Black"');
cambiar('contador de copias', /<p class="mv-cupo">[\s\S]*?<\/p>/, '');
cambiar('nota del precio', 'Incluye todas las actualizaciones de esta edición, sin costo adicional y para siempre.', 'Incluye todas las actualizaciones del método, sin costo adicional y para siempre.');

// ---------- 6 · barra de compra del celular (hoy oculta por el diseño, pero que no diga nada viejo) ----------
cambiar('celular arriba', /<span data-cuenta="movil-arriba">[\s\S]*?<\/span>/, '<span data-cuenta="movil-arriba">October Black</span>');
cambiar('celular abajo', /<b data-cuenta="movil">[\s\S]*?<\/b>/, `<b data-cuenta="movil">El pack completo a USD ${PRECIO}</b>`);

// ---------- 7 · preguntas: qué es October Black ----------
cambiar('pregunta nueva', '<h2>Preguntas frecuentes.</h2>', `<h2>Preguntas frecuentes.</h2> <details><summary>¿Qué es October Black?</summary><p>Es el lanzamiento de la edición de octubre del método. Hasta el ${FIN_TEXTO}, el pack completo (el método con su video, Errores comunes, Ángulos que venden y Cómo crear avatares hiperrealistas, más el Plan 365 de regalo) cuesta <b>USD ${PRECIO}</b>. Cuando el reloj de arriba llega a cero, el precio pasa a <b>USD ${DESPUES}</b>. Los que ya compraron el método reciben las piezas nuevas sin pagar de nuevo.</p></details>`);

// ---------- 8 · el reloj: misma lógica de siempre, con la fecha y los textos de October Black ----------
cambiar('fecha del reloj', /const LIMITE = '\d{4}-\d{2}-\d{2}';[^\n]*/, `const LIMITE = '${FIN}';      // termina October Black (a las 12:00 de Paraguay) y el precio sube a ${DESPUES}`);
cambiar('precio que sube', /const SUBE_A = \d+;/, `const SUBE_A = ${DESPUES};`);
cambiar('nombre del peldaño', /const PELDANO = '[^']*';/, "const PELDANO = 'October Black';");
cambiar('textos del reloj', /es: \{\s*meses:[\s\S]*?pieManana: '[^']*'\s*\},/, `es: {
        meses: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
        de: ' de ',
        peldano: PELDANO,
        lejos:   p => '<b>October Black</b> El pack completo a USD ' + PRECIO + '. Sube a USD ' + SUBE_A + ' en',
        cerca:   p => '<b>October Black</b> Últimos días a USD ' + PRECIO + '. Sube a USD ' + SUBE_A + ' en',
        ultimo:  () => '<b>October Black</b> Último día a USD ' + PRECIO + '. Sube a USD ' + SUBE_A + ' en',
        fecha:   f => 'Precio October Black hasta el <b>' + f + '</b>. Después sube a USD ' + SUBE_A + '.',
        manana:  () => '<b>Último día a USD ' + PRECIO + '.</b> Hoy sube a USD ' + SUBE_A + '.',
        arribaLejos: p => 'October Black',
        arribaCerca: 'Últimos días de October Black',
        arribaUltimo: 'Último día de October Black',
        pie: 'El pack completo a USD ' + PRECIO,
        pieManana: 'Hoy sube a USD ' + SUBE_A
      },`);

// ---------- 8b · el sello de garantía en oro: el degradé metálico vive dentro del SVG (CSS no puede rellenar SVG con degradés) ----------
cambiar('sello dorado', /(aria-label="Garantía de 7 días">\s*<svg viewBox="0 0 200 200" aria-hidden="true">)/, m => m + '<defs><linearGradient id="ob-oro-sello" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7E9B8"/><stop offset=".32" stop-color="#E3CF98"/><stop offset=".56" stop-color="#C6A45E"/><stop offset=".76" stop-color="#EFDA9E"/><stop offset="1" stop-color="#B28E4A"/></linearGradient></defs>');

// ---------- 9 · el tema October Black ----------
cambiar('tema', '</head>', fs.readFileSync(path.join(__dirname, '_fuente-landings', 'october-black.css'), 'utf8').replace(/^/, '<style id="october-black">\n') + '\n</style>\n</head>');

// ---------- controles ----------
const cuenta = (s, re) => (s.match(re) || []).length;
for (const re of [/fbq\(/g, /ssTrack\(/g, /ssIdent/g, /gtag\(/g, /connect\.facebook\.net/g, /googletagmanager/g, /api\/track/g, /pay\.hotmart\.com/g]) {
  if (cuenta(original, re) !== cuenta(h, re)) fallas.push('cambió el seguimiento: ' + re.source);
}
for (const viejo of [/Edición Septiembre/, /copias por edición/, /Lo que la IA no te va a enseñar/, /Valor total/, /aumenta tus ventas/, /facturan millones/, /se vende aparte/]) {
  if (viejo.test(h.replace(/<script[\s\S]*?<\/script>/g, ''))) fallas.push('quedó texto viejo: ' + viejo.source);
}
if (!h.includes('off=1tbcugw1')) fallas.push('el enlace de pago cambió');
if (fallas.length) { console.error('NO SE ESCRIBIÓ NADA:\n - ' + fallas.join('\n - ')); process.exit(1); }
fs.writeFileSync(DESTINO, h);
console.log('OK ' + path.basename(DESTINO) + ' · ' + Math.round(h.length / 1024) + ' KB · October Black hasta el ' + FIN + ' 12:00 PY · USD ' + PRECIO + ' y después ' + DESPUES);
