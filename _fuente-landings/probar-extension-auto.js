// Prueba _ob-extension-auto.html (el reloj se reinicia solo con 3 días más cada vez que llega a cero) sin mandar eventos.
//   node _fuente-landings/probar-extension-auto.js
const { abrir } = require('./probar-reloj.js');
const PY = 'America/Asuncion';
const ob = r => [r.oferta.estado === 'ob' || 'estado ' + r.oferta.estado, /67/.test(r.precio) || r.precio, r.pagos.every(p => p.off === '1tbcugw1') || 'enlace'];
const casos = [
  ['hoy sáb 24 · igual que hoy', '2026-10-24T20:00:00-03:00', r => [...ob(r), r.texto.includes('lunes 26') || 'falta lunes 26']],
  ['lun 26 11:59 · último minuto', '2026-10-26T11:59:00-03:00', r => [...ob(r), r.texto.includes('lunes 26') || 'falta lunes 26']],
  ['lun 26 12:00:20 · 3 días más', '2026-10-26T12:00:20-03:00', r => [...ob(r), r.texto.includes('jueves 29') || 'falta jueves 29', !r.texto.includes('lunes 26') || 'sobra lunes 26']],
  ['mié 28 · sigue', '2026-10-28T09:00:00-03:00', r => [...ob(r), r.texto.includes('jueves 29') || 'falta jueves 29']],
  ['jue 29 12:00:20 · otros 3', '2026-10-29T12:00:20-03:00', r => [...ob(r), r.texto.includes('domingo 1') || 'falta domingo 1']],
  ['dom 1/11 12:00:20 · otros 3', '2026-11-01T12:00:20-03:00', r => [...ob(r), r.texto.includes('miércoles 4') || 'falta miércoles 4']],
  ['vie 13/11 · sigue rodando', '2026-11-13T15:00:00-03:00', r => [...ob(r), r.texto.includes('sábado 16') || r.texto.includes('lunes 16') || 'fecha ' + (r.texto.match(/(lunes|martes|miércoles|jueves|viernes|sábado|domingo) \d+/) || [''])[0]]],
];
(async () => {
  const p = await abrir(); let mal = 0;
  for (const [nombre, hora, chequeo] of casos) {
    const r = await p.estado({ archivo: '_ob-extension-auto.html', hora, zona: PY, ancho: 390 });
    const fallas = chequeo(r).filter(x => x !== true);
    console.log((fallas.length ? 'MAL ' : 'ok  ') + nombre + (fallas.length ? ' → ' + fallas.join(' · ') : ''));
    mal += fallas.length;
  }
  await p.cerrar(); process.exit(mal ? 1 : 0);
})();
