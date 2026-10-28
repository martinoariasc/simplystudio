// Prueba _ob-extension-octubre.html (al llegar a cero el 29/10, hasta el sábado 31/10 23:59; después, 3 días más cada vez) sin mandar eventos.
//   node _fuente-landings/probar-extension-octubre.js
const { abrir } = require('./probar-reloj.js');
const PY = 'America/Asuncion';
const ob = r => [r.oferta.estado === 'ob' || 'estado ' + r.oferta.estado, /67/.test(r.precio) || r.precio, r.pagos.every(p => p.off === '1tbcugw1') || 'enlace'];
const casos = [
  ['mié 28 · igual que hoy (jueves 29)', '2026-10-28T15:00:00-03:00', r => [...ob(r), r.texto.includes('jueves 29') || 'falta jueves 29']],
  ['jue 29 11:59 · último minuto', '2026-10-29T11:59:00-03:00', r => [...ob(r), r.texto.includes('jueves 29') || 'falta jueves 29']],
  ['jue 29 12:00:20 · hasta el sábado 31', '2026-10-29T12:00:20-03:00', r => [...ob(r), r.texto.includes('sábado 31') || 'falta sábado 31', !r.texto.includes('domingo 1') || 'sobra domingo 1']],
  ['sáb 31 23:58 · último minuto de octubre', '2026-10-31T23:58:00-03:00', r => [...ob(r), r.texto.includes('sábado 31') || r.texto.includes('hoy') || 'falta sábado 31']],
  ['dom 1/11 10:00 · vuelve el reloj de 3 días', '2026-11-01T10:00:00-03:00', r => [...ob(r), r.texto.includes('martes 3') || 'falta martes 3']],
];
(async () => {
  const p = await abrir(); let mal = 0;
  for (const [nombre, hora, chequeo] of casos) {
    const r = await p.estado({ archivo: '_ob-extension-octubre.html', hora, zona: PY, ancho: 390 });
    const fallas = chequeo(r).filter(x => x !== true);
    console.log((fallas.length ? 'MAL ' : 'ok  ') + nombre + (fallas.length ? ' → ' + fallas.join(' · ') : ''));
    mal += fallas.length;
  }
  await p.cerrar(); process.exit(mal ? 1 : 0);
})();
