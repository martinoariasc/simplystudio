// Prueba _oferta-bienvenida.html (October Black hasta el 31/10 23:59; después, USD 67 por 24 horas y USD 87) sin mandar eventos.
//   node _fuente-landings/probar-oferta-bienvenida.js [carpeta-de-fotos]
const path = require('path');
const { abrir } = require('./probar-reloj.js');
const PY = 'America/Asuncion', A = process.argv[3] || '_oferta-bienvenida.html', FOTOS = process.argv[2];
const OFF67 = '1tbcugw1', OFF87 = '3hjxp67m';
const visita = iso => `try { localStorage.setItem('ss_bv_v1', String(Date.parse('${iso}'))); } catch (e) {}`;
const sinMemoria = `Object.defineProperty(window, 'localStorage', { get(){ throw new Error('sin memoria'); } }); Object.defineProperty(document, 'cookie', { get(){ return ''; }, set(){} });`;
const reloj = t => /^visible/.test(t) && !/^visible 00.*00.*00.*00$/.test(t);
const pago = (r, off) => (r.pagos.length && r.pagos.every(p => p.off === off)) || 'pago ' + [...new Set(r.pagos.map(p => p.off))].join(',');
const sinOB = r => !/October/i.test(r.texto) || 'queda October Black';
const ob = r => [r.oferta.estado === 'ob' || 'estado ' + r.oferta.estado, r.ssPrecio === 67 || 'precio ' + r.ssPrecio, pago(r, OFF67), reloj(r.relojTarjeta) || 'sin reloj', /Plan 365/.test(r.texto) || 'sin Plan 365', !/a las 12:00/.test(r.texto) || 'dice 12:00'];
const bv = r => [r.oferta.estado === 'bv' || 'estado ' + r.oferta.estado, r.ssPrecio === 67 || 'precio ' + r.ssPrecio, /67/.test(r.precio) || r.precio, pago(r, OFF67), sinOB(r), reloj(r.relojTarjeta) || 'sin reloj', reloj(r.relojArriba) || 'sin reloj arriba',
  /Precio de bienvenida/i.test(r.banner || '') || 'banner ' + r.banner, /USD 87/.test(r.despuesBv || '') || 'despues ' + r.despuesBv, /^visible/.test(r.etiquetaBv ? 'visible' : '') || 'sin etiqueta', /^visible/.test(r.cupoBv || '') || 'sin barra', /Plan 365/.test(r.texto) || 'sin Plan 365', /USD 620/.test(r.valorTotal || '') || 'total ' + r.valorTotal,
  (r.clic || []).some(c => /"value":67/.test(c)) || 'InitiateCheckout ' + r.clic];
const casos = [
  ['sáb 31 02:40 · October Black, reloj hasta las 23:59', { hora: '2026-10-31T02:40:00-03:00' }, r => [...ob(r), /21.*\d\d.*\d\d/.test(r.relojTarjeta) || r.relojTarjeta]],
  ['sáb 31 15:00 · antes el reloj ya se había ido', { hora: '2026-10-31T15:00:00-03:00' }, r => [...ob(r), /08/.test(r.relojTarjeta) || r.relojTarjeta]],
  ['sáb 31 23:58 · último minuto', { hora: '2026-10-31T23:58:00-03:00' }, ob],
  ['dom 1/11 00:01 · primera visita', { hora: '2026-11-01T00:01:00-03:00' }, r => [...bv(r), /23/.test(r.relojTarjeta) || r.relojTarjeta]],
  ['lun 2/11 00:00 · volvió, le quedan 10 horas', { hora: '2026-11-02T00:00:00-03:00', preparar: visita('2026-11-01T10:00:00-03:00') }, r => [...bv(r), / 09 /.test(r.relojTarjeta) || r.relojTarjeta]],
  ['lun 2/11 11:00 · pasaron las 24 horas', { hora: '2026-11-02T11:00:00-03:00', preparar: visita('2026-11-01T10:00:00-03:00') }, r => [r.oferta.estado === 'regular' || 'estado ' + r.oferta.estado, r.ssPrecio === 87 || 'precio ' + r.ssPrecio, /87/.test(r.precio) || r.precio, pago(r, OFF87), sinOB(r), !/^visible/.test(r.relojTarjeta) || 'sobra reloj', /Plan 365/.test(r.texto) || 'sin Plan 365', (r.clic || []).some(c => /"value":87/.test(c)) || 'InitiateCheckout ' + r.clic]],
  ['mar 3/11 · visitante nuevo, sigue igual', { hora: '2026-11-03T15:00:00-03:00' }, bv],
  ['jue 5/11 · sigue igual aunque la landing nueva no esté', { hora: '2026-11-05T15:00:00-03:00' }, bv],
  ['dom 1/11 · aparato sin memoria: USD 67 sin reloj', { hora: '2026-11-01T10:00:00-03:00', preparar: sinMemoria }, r => [r.oferta.estado === 'fin' || 'estado ' + r.oferta.estado, r.ssPrecio === 67 || 'precio ' + r.ssPrecio, /67/.test(r.precio) || r.precio, pago(r, OFF67), sinOB(r), !/^visible/.test(r.relojTarjeta) || 'sobra reloj']],
  ['dom 1/11 · México', { hora: '2026-11-01T10:00:00-03:00', zona: 'America/Mexico_City' }, bv],
  ['dom 1/11 · Madrid, escritorio', { hora: '2026-11-01T10:00:00-03:00', zona: 'Europe/Madrid', ancho: 1280 }, bv],
  ['sáb 31 23:59:50 · con la página abierta cambia sola', { hora: '2026-10-31T23:59:50-03:00', luego: { espera: 14000, leer: `JSON.stringify({ e: window.ssOferta.estado, ob: /October/i.test(document.body.innerText), p: window.ssPrecio })` } }, r => { const l = JSON.parse(r.luego || '{}'); return [l.e === 'bv' || 'quedó ' + l.e, l.ob === false || 'queda October Black', l.p === 67 || 'precio ' + l.p]; }],
];
(async () => {
  const p = await abrir(); let mal = 0;
  for (const [nombre, o, chequeo] of casos) {
    const r = await p.estado({ archivo: A, zona: PY, ancho: 390, ...o });
    const fallas = chequeo(r).filter(x => x !== true);
    const err = r.errores.filter(e => e !== 'RED: ' && !/Failed to fetch/.test(e));   // lo mismo en la página publicada: son los pedidos que bloquea la prueba
    if (err.length) fallas.push('errores: ' + err.slice(0, 2).join(' | '));
    if (r.desborde > 0) fallas.push('desborde ' + r.desborde);
    console.log((fallas.length ? 'MAL ' : 'ok  ') + nombre + (fallas.length ? ' → ' + fallas.join(' · ') : ''));
    mal += fallas.length;
  }
  if (FOTOS) {
    const sem = { hora: '2026-11-01T10:00:00-03:00', zona: PY, archivo: A };
    await p.estado({ ...sem, ancho: 390, fotos: [{ ir: 'arriba', archivo: path.join(FOTOS, 'bv-arriba-390.png') }, { ir: 'precio', archivo: path.join(FOTOS, 'bv-precio-390.png') }, { ir: '.ob-cupo.bv-cupo', archivo: path.join(FOTOS, 'bv-cupo-390.png') }] });
    await p.estado({ ...sem, ancho: 1280, fotos: [{ ir: 'arriba', archivo: path.join(FOTOS, 'bv-arriba-1280.png') }, { ir: 'precio', archivo: path.join(FOTOS, 'bv-precio-1280.png') }] });
    await p.estado({ hora: '2026-11-02T11:00:00-03:00', zona: PY, archivo: A, ancho: 390, preparar: visita('2026-11-01T10:00:00-03:00'), fotos: [{ ir: 'precio', archivo: path.join(FOTOS, 'regular-precio-390.png') }] });
  }
  await p.cerrar(); process.exit(mal ? 1 : 0);
})();
