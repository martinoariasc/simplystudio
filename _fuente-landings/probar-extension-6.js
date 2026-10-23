// Prueba _ob-extension-6.html (sexta tanda de 3 días más de October Black) sin mandar eventos.
//   node _fuente-landings/probar-extension-6.js
const { abrir } = require('./probar-reloj.js');
const PY = 'America/Asuncion';
const casos = [
  ['hoy vie 23 01:00 · igual que hoy', '2026-10-23T01:00:00-03:00', r => [r.oferta.estado === 'ob' || 'estado', /67/.test(r.precio) || r.precio, r.texto.includes('viernes 23') || 'falta viernes 23']],
  ['vie 23 11:59 · último minuto', '2026-10-23T11:59:00-03:00', r => [r.oferta.estado === 'ob' || 'estado', /67/.test(r.precio) || r.precio]],
  ['vie 23 12:00:20 · otros 3 días', '2026-10-23T12:00:20-03:00', r => [r.oferta.estado === 'ob' || 'estado', r.oferta.ext6 === true || 'ext6', /67/.test(r.precio) || r.precio, r.texto.includes('lunes 26') || 'falta lunes 26', !r.texto.includes('viernes 23') || 'sobra viernes 23', r.pagos.every(p => p.off === '1tbcugw1') || 'enlace']],
  ['dom 25 20:00 · sigue', '2026-10-25T20:00:00-03:00', r => [r.oferta.estado === 'ob' || 'estado', /67/.test(r.precio) || r.precio, r.texto.includes('lunes 26') || 'falta lunes 26']],
  ['lun 26 12:00:20 · cierre', '2026-10-26T12:00:20-03:00', r => [r.oferta.estado === 'fin' || 'estado ' + r.oferta.estado, /87/.test(r.precio) || r.precio]],
];
(async () => {
  const p = await abrir(); let mal = 0;
  for (const [nombre, hora, chequeo] of casos) {
    const r = await p.estado({ archivo: '_ob-extension-6.html', hora, zona: PY, ancho: 390 });
    const fallas = chequeo(r).filter(x => x !== true);
    console.log((fallas.length ? 'MAL ' : 'ok  ') + nombre + (fallas.length ? ' → ' + fallas.join(' · ') : ''));
    mal += fallas.length;
  }
  await p.cerrar(); process.exit(mal ? 1 : 0);
})();
