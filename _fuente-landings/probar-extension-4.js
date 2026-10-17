// Prueba _ob-extension-4.html (la cuarta tanda de 3 días más de October Black) sin mandar eventos.
//   node _fuente-landings/probar-extension-2.js [archivo-nuevo] [archivo-publicado]
// Dos partes:
//   A · antes del miércoles 14/10 a las 12:00 la página nueva tiene que ser IGUAL a la publicada, campo por campo;
//   B · desde ese instante: reloj nuevo de 3 días, "sábado 17", USD 67, Plan 365 y el mismo enlace de pago;
//       el sábado 17/10 a las 12:00 pasa sola a USD 87, igual que la publicada iba a hacer el domingo.
const { abrir } = require('./probar-reloj.js');
const NUEVA = process.argv[2] || '_ob-extension-4.html', PUBLICADA = process.argv[3] || 'index.html', PY = 'America/Asuncion';
const tiene = (r, t) => r.texto.includes(t), val = r => (r.clic || []).join(' ');
const ob = r => [/67/.test(r.precio) || 'precio ' + r.precio, /"value":67/.test(val(r)) || 'pago', r.plan365 || 'sin Plan 365', /^visible/.test(r.relojTarjeta) || 'sin reloj abajo', /^visible/.test(r.relojArriba) || 'sin reloj arriba',
  r.pagos.length > 0 && r.pagos.every(p => p.off === '1tbcugw1') || 'enlace', r.relojArriba.replace(/\D/g, '').slice(0, 6) === r.relojTarjeta.replace(/\D/g, '').slice(0, 6) || 'los dos relojes no coinciden'];
// los segundos del reloj cambian entre una lectura y otra: se comparan días, horas y minutos
const sinSegundos = s => String(s).replace(/(\d\d\s*d\s*\d\d\s*h\s*\d\d\s*m\s*)\d\d(\s*s)/g, '$1SS$2').replace(/\d\d(\s*SEG)/g, 'SS$1');   // también el reloj de la tarjeta (… MIN 37 SEG)
const CAMPOS = ['banner', 'relojArriba', 'enlaceArriba', 'sello', 'etiqueta', 'precio', 'despues', 'relojTarjeta', 'cupo', 'valorTotal', 'barraAhorro', 'plan365', 'octoberBlack', 'barraCelular', 'movilArriba', 'movil', 'botonMovil', 'pregunta', 'ssPrecio', 'clases', 'texto', 'desborde'];
const iguales = (a, b) => {
  const dif = CAMPOS.filter(k => sinSegundos(a[k]) !== sinSegundos(b[k])).map(k => k + ': «' + String(sinSegundos(a[k])).slice(0, 60) + '» / «' + String(sinSegundos(b[k])).slice(0, 60) + '»');
  for (const k of ['estado', 'precio', 'ext', 'f1', 'fin']) if ((a.oferta || {})[k] !== (b.oferta || {})[k]) dif.push('oferta.' + k);
  if (JSON.stringify(a.pagos) !== JSON.stringify(b.pagos)) dif.push('enlaces de pago');
  if (val(a) !== val(b)) dif.push('inicio de pago');
  return dif;
};

const A = [
  ['vie 16 17:00:20 · Paraguay', '2026-10-16T17:00:20-03:00', PY, 390],
  ['sáb 17 09:00:20 · Paraguay, último día', '2026-10-17T09:00:20-03:00', PY, 390],
  ['sáb 17 11:58:20 · México, 360 px', '2026-10-17T11:58:20-03:00', 'America/Mexico_City', 360],
  ['vie 16 20:30:20 · Madrid, escritorio', '2026-10-16T20:30:20-03:00', 'Europe/Madrid', 1440],
];
const B = [
  ['sáb 17 12:00:20 · otros 3 días', '2026-10-17T12:00:20-03:00', PY, r => ob(r).concat([r.oferta.ext4 === true || 'estado', /Últimos días/.test(r.banner) || r.banner, tiene(r, 'martes 20') || 'falta martes 20', !tiene(r, 'sábado 17') || 'sobra sábado 17', !tiene(r, 'jueves 8') || 'sobra jueves 8',
    /^visible 02/.test(r.relojTarjeta) || r.relojTarjeta, /20 de octubre/.test(r.texto) || 'falta 20 de octubre', !/(^|\D)(8|11|14|17) de octubre/.test(r.texto) || 'queda una fecha vieja', /lleno 0%/.test(r.cupo) || r.cupo])],
  ['igual en México, 360 px', '2026-10-17T12:00:20-03:00', 'America/Mexico_City', r => ob(r).concat([r.oferta.ext4 === true || 'estado', tiene(r, 'martes 20') || 'falta martes 20', !tiene(r, 'sábado 17') || 'sobra sábado 17']), 360],
  ['igual en Madrid, escritorio', '2026-10-17T12:00:20-03:00', 'Europe/Madrid', r => ob(r).concat([r.oferta.ext4 === true || 'estado', tiene(r, 'martes 20') || 'falta martes 20', !tiene(r, 'sábado 17') || 'sobra sábado 17']), 1440],
  ['dom 18 18:00 · sigue', '2026-10-18T18:00:00-03:00', PY, r => ob(r).concat([/^visible 01/.test(r.relojTarjeta) || r.relojTarjeta, /Últimos días/.test(r.banner) || r.banner])],
  ['mar 20 09:00 · último día', '2026-10-20T09:00:00-03:00', PY, r => ob(r).concat([/Último día/.test(r.banner) || r.banner])],
  ['mar 20 12:00:20 · cierre', '2026-10-20T12:00:20-03:00', PY, r => [r.oferta.estado === 'fin' || 'estado', /87/.test(r.precio) || r.precio, /^oculto/.test(r.relojTarjeta) || 'queda reloj', /"value":87/.test(val(r)) || 'pago ' + val(r).slice(0, 80)]],
  ['abierta el sábado a las 12:00', '2026-10-17T11:59:54-03:00', PY, r => [r.luego === 'true' || 'no se reinició sola'], 390, { espera: 9500, leer: "String(!!(window.ssOferta && window.ssOferta.ext4) && document.body.innerText.includes('martes 20') && /67/.test(document.querySelector('#precio .price').innerText))" }],
];
const limpios = r => r.errores.filter(e => !/^RED:|Failed to fetch/.test(e)).concat(r.desborde > 0 ? ['se sale'] : []);

(async () => {
  const p = await abrir(); let mal = 0;
  try {
    console.log('A · antes del miércoles 12:00, igual a la publicada');
    for (const [nombre, hora, zona, ancho] of A) {
      const [a, b] = [await p.estado({ archivo: PUBLICADA, hora, zona, ancho }), await p.estado({ archivo: NUEVA, hora, zona, ancho })];
      const f = iguales(a, b).concat(limpios(b));
      if (f.length) mal++;
      console.log((f.length ? '  FALLA · ' : '  bien · ') + nombre + ' · ' + (f.length ? f.join(' ; ') : b.banner + ' | ' + b.relojTarjeta.slice(0, 24) + ' | ' + b.movil));
    }
    console.log('B · desde el miércoles 12:00');
    for (const [nombre, hora, zona, comprobar, ancho, luego] of B) {
      const r = await p.estado({ archivo: NUEVA, hora, zona, ancho: ancho || 390, luego });
      const f = comprobar(r).filter(x => x !== true).concat(limpios(r));
      if (f.length) mal++;
      console.log((f.length ? '  FALLA · ' : '  bien · ') + nombre + ' · ' + (f.length ? f.join(' ; ') : r.banner + ' | ' + r.relojTarjeta.slice(0, 24) + ' | ' + r.movil));
    }
    // el cierre del sábado tiene que verse como el cierre que la publicada iba a mostrar el miércoles
    const [a, b] = [await p.estado({ archivo: PUBLICADA, hora: '2026-10-17T12:00:20-03:00', zona: PY, ancho: 390 }), await p.estado({ archivo: NUEVA, hora: '2026-10-20T12:00:20-03:00', zona: PY, ancho: 390 })];
    const f = CAMPOS.filter(k => sinSegundos(a[k]) !== sinSegundos(b[k]));
    if (f.length) mal++;
    console.log((f.length ? '  FALLA · ' : '  bien · ') + 'el cierre del miércoles es el mismo que tenía el domingo' + (f.length ? ' · distinto en: ' + f.join(', ') : ' · ' + b.precio));
  } finally { p.cerrar(); }
  console.log(mal ? mal + ' con fallas' : 'Todo bien');
  process.exit(mal ? 1 : 0);
})();
