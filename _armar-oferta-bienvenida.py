# -*- coding: utf-8 -*-
# Después de October Black (pedido de Martino del 31/10/2026: no llega a hacer la actualización hoy; al llegar a cero el contador, 3 días más
# con una oferta que ya no sea October Black y que suba a USD 87 cuando pase un día, «así como íbamos a hacer luego»).
#   · Hasta el sábado 31/10 23:59 de Paraguay: October Black. Se arregla el reloj, que llegaba a cero a las 12:00 aunque el plazo era 23:59.
#   · Desde el 31/10 23:59: precio de bienvenida por visitante, sin fecha de cierre: USD 67 (oferta 1tbcugw1) durante 24 horas desde su primera
#     visita y después USD 87 (oferta 3hjxp67m). Mismas claves que la landing nueva (ss_bv_v1, ss_bv): su plazo sigue igual cuando se publique.
#   · El Plan 365 sigue en la página: el comprador lo recibe igual en Hotmart. Sale toda mención a October Black.
#   python _armar-oferta-bienvenida.py   -> _oferta-bienvenida.html (después: probar, copiar a index.html y publicar)
import io, subprocess, sys

html = subprocess.run(['git', 'show', 'HEAD:index.html'], capture_output=True).stdout.decode('utf-8')
SEGUIMIENTO = ['1448725857302388', 'AW-18441137893', 'InitiateCheckout', 'off=1tbcugw1', 'TiempoEnPagina', "fbq('init'"]
antes = {s: html.count(s) for s in SEGUIMIENTO}

CAMBIOS = [
    # estado de la oferta
    ("  else if (Date.now() >= FOCT) { var k4 = Math.ceil((Date.now() - FOCT + 1) / P3); F6 = FOCT + (k4 - 1) * P3; F = FOCT + k4 * P3; }   // después, otra vez 3 días más cada vez",
     "  else if (Date.now() >= FOCT) { F6 = C29; F = FOCT; }   // 31/10: al llegar a cero termina October Black; desde ahí, precio de bienvenida de cada visitante"),
    ("  var BIENVENIDA = 87;                               // el precio desde ese momento (mismo enlace de pago de siempre)",
     "  var BIENVENIDA = 67;                               // el precio de bienvenida (mismo enlace de pago de siempre)"),
    ("  var HORAS = 72;  ", "  var HORAS = 24;  "),
    ("  var REGULAR = { precio: 107, off: '' };", "  var REGULAR = { precio: 87, off: '3hjxp67m' };"),
    # lo que se ve en cada estado
    ('<b>October Black</b><span>hasta el jueves 8 de octubre</span></div>',
     '<b>October Black</b><span>hasta el jueves 8 de octubre</span></div><div class="ob-sello v2-sube d1" data-of="bv"><i aria-hidden="true"></i><b>Precio de bienvenida</b><span>por 24 horas</span></div>'),
    ('<article class="inside-card ob-card ob-card-regalo reveal" data-of="ob"><div class="card-cover"><span class="card-tag">Regalo October Black</span>',
     '<article class="inside-card ob-card ob-card-regalo reveal"><div class="card-cover"><span class="card-tag" data-of="ob">Regalo October Black</span><span class="card-tag" data-of="post">Incluido</span>'),
    (' De regalo con October Black, hasta el 8 de octubre.</p>', '<span data-of="ob"> De regalo con October Black, hasta el 8 de octubre.</span></p>'),
    ('<li class="ob-regalo" data-of="ob"><span><b>Plan 365</b><small class="ob-que">Tu plan de acción de un año, adaptado a tu negocio. Solo en October Black.</small>',
     '<li class="ob-regalo"><span><b>Plan 365</b><small class="ob-que">Tu plan de acción de un año, adaptado a tu negocio.<span data-of="ob"> Solo en October Black.</span></small>'),
    ('<s data-of="post">USD 593</s>', '<s data-of="post">USD 620</s>'),
    ('<span class="launch-tag" data-of="ob">October Black</span>',
     '<span class="launch-tag" data-of="ob">October Black</span><span class="launch-tag" data-of="bv">Precio de bienvenida</span>'),
    ('Precio October Black hasta el <b>8 de octubre</b>. Después sube a USD 87.</p>',
     'Precio October Black hasta el <b>8 de octubre</b>. Después sube a USD 87.</p>\n              <p class="price-after" data-bv="despues" data-of="bv">Después sube a USD 87.</p>'),
    ('<p class="mv-cupo ob-cupo" data-of="ob"><span class="mv-cupo-txt"><i class="mv-cupo-pun"></i><em>Últimos días a USD 67</em></span><span class="mv-cupo-barra" aria-hidden="true"><i style="--f:55%"></i></span><span class="mv-cupo-pie">El jueves 8 a las 12:00 sube a <em>USD 87</em>.</span></p>',
     '<p class="mv-cupo ob-cupo" data-of="ob"><span class="mv-cupo-txt"><i class="mv-cupo-pun"></i><em>Últimos días de October Black</em></span><span class="mv-cupo-barra" aria-hidden="true"><i style="--f:55%"></i></span><span class="mv-cupo-pie">Termina el jueves 8 a las 23:59.</span></p>'
     '<p class="mv-cupo ob-cupo bv-cupo" data-of="bv"><span class="mv-cupo-txt"><i class="mv-cupo-pun"></i><em>24 horas a USD 67</em></span><span class="mv-cupo-barra" aria-hidden="true"><i style="--f:0%"></i></span><span class="mv-cupo-pie">Después sube a <em>USD 87</em>.</span></p>'),
    ('Hasta el jueves 8 de octubre a las 12:00 (hora de Paraguay), el pack', 'Hasta el jueves 8 de octubre a las 23:59 (hora de Paraguay), el pack'),
    ('Cuando el reloj de arriba llega a cero, el precio pasa a <b>USD 87</b>. Los que ya compraron el método reciben las piezas nuevas sin pagar de nuevo.</p></details>',
     'Cuando el reloj de arriba llega a cero, termina October Black. Los que ya compraron el método reciben las piezas nuevas sin pagar de nuevo.</p></details>'
     '\n        <details data-of="bv"><summary>¿Por qué tengo un precio especial y un reloj?</summary><p>Es tu precio de bienvenida: dura 24 horas desde la primera vez que entras. Después, el precio sube a <b>USD 87</b>.</p></details>'),
    # relojes y textos
    ("x.innerHTML = 'Tu precio de bienvenida vale hasta <b>' + o.cuandoLargo.texto + '</b>. Después, USD ' + o.regular + '.';",
     "x.innerHTML = 'Tu precio de bienvenida vale hasta <b>' + o.cuandoLargo.texto + '</b>. Después sube a USD ' + o.regular + '.';"),
    ("const fin = new Date(LIMITE + HORA);",
     "const fin = (window.ssOferta && window.ssOferta.estado === 'ob' && window.ssOferta.fin) ? new Date(window.ssOferta.fin) : new Date(LIMITE + HORA);"),
    ("manana:  () => '<b>Último día a USD ' + PRECIO + '.</b> Hoy sube a USD ' + SUBE_A + '.',",
     "manana:  () => '<b>Último día de ' + PELDANO + '.</b> Después sube a USD ' + SUBE_A + '.',"),
    ('var fin=lim?new Date(lim+"T12:00:00-03:00").getTime():NaN;   /* mismo instante para todos, no la medianoche de cada visitante */',
     'var oc=window.ssOferta,fin=(oc&&(oc.estado===\'ob\'||oc.estado===\'bv\')&&oc.fin)?oc.fin:lim?new Date(lim+"T12:00:00-03:00").getTime():NaN;   /* ob: el mismo instante para todos · bv: el plazo de este visitante */'),
    ("[].forEach.call(document.querySelectorAll('.ob-cupo .mv-cupo-barra i'),function(i){i.style.setProperty('--f',Math.round(f*100)+'%');});})();",
     "[].forEach.call(document.querySelectorAll('.ob-cupo:not(.bv-cupo) .mv-cupo-barra i'),function(i){i.style.setProperty('--f',Math.round(f*100)+'%');});})();"),
]

out = html
for viejo, nuevo in CAMBIOS:
    if out.count(viejo) != 1:
        sys.exit('FRENO: no se cambió nada. Este texto aparece %d veces: %s' % (out.count(viejo), viejo[:90]))
    out = out.replace(viejo, nuevo, 1)

for s, n in antes.items():
    if out.count(s) != n:
        sys.exit('FRENO: cambió el seguimiento o el pago: %s (%d -> %d)' % (s, n, out.count(s)))

io.open('_oferta-bienvenida.html', 'w', encoding='utf-8', newline='').write(out)
print('ok: _oferta-bienvenida.html', len(html), '->', len(out), '·', len(CAMBIOS), 'cambios')
