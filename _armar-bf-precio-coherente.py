# -*- coding: utf-8 -*-
# Martino 24/11/2026: precio coherente para Black Friday y para después.
#   Hasta el lunes 30/11/2026 23:59:59 (Paraguay): TODOS ven USD 67 y el botón va al checkout de 67 (off=1tbcugw1).
#   Desde el 01/12 00:00: quien ya tenía marca de visita antes del 01/12 (ss_bv_v2 / cookie ss_bv2) ve USD 87 con off=3hjxp67m;
#   quien llega por primera vez desde el 01/12 vuelve a los 3 días en USD 67 desde su primera visita y después USD 87 (esquema de siempre).
#   Modo de prueba: ?ss_fecha=2026-12-01T00:01 (hora de Paraguay) simula la fecha. Sin el parámetro no hace nada.
# Se aplica sobre index.html (rama black-friday-noir). Frena si algo no aparece exactamente una vez.
#   python _armar-bf-precio-coherente.py
import sys, re
raw = open('index.html', 'rb').read()
bom = raw.startswith(b'\xef\xbb\xbf')
t = raw.decode('utf-8-sig')
SEGUIMIENTO = ['1448725857302388', 'AW-18441137893', 'InitiateCheckout', '1tbcugw1', '3hjxp67m', "fbq('init'", 'ss_bv_v2', 'ss_bv2', 'G107515293E']
antes = {s: t.count(s) for s in SEGUIMIENTO}
antes['3hjxp67m'] += 1  # la capa nueva lo nombra una vez (el código de la oferta regular; antes solo estaba cifrado)

# 1) capa de precio (reemplaza la capa Black Friday de noviembre)
MARCA = '<script>/* BLACK FRIDAY · todo noviembre'
assert t.count(MARCA) == 1
ini = t.index(MARCA)
fin = t.index('</script>', ini) + len('</script>')
vieja = t[ini:fin]
assert 'location.reload' in vieja and 'o.bf=FIN' in vieja, 'no es la capa esperada'
CAPA = ('<script>/* PRECIO BLACK FRIDAY Y DESPUÉS (capa encima de la oferta de siempre; todo automático, nadie publica nada el 01/12).\n'
 '   Hasta el lunes 30/11/2026 23:59:59 (Paraguay): USD 67 para todos y el botón al checkout de 67.\n'
 '   Desde el 01/12/2026 00:00: quien ya tenía marca de visita anterior al 01/12 ve USD 87 y el botón al checkout de 87;\n'
 '   quien llega por primera vez desde el 01/12 sigue el esquema de siempre: 67 durante 3 días desde su primera visita y después 87. */\n'
 '!function(){var DIC=Date.parse("2026-12-01T00:00:00-03:00"),FIN=DIC-1e3,o=window.ssOferta,h=document.documentElement,t=Date.now();\n'
 'if(!o)return;\n'
 'if(t<DIC){h.classList.remove("of-"+o.fase);o.fase="bv";o.precio=o.bv;delete o.off;o.finBv=FIN;o.bf=FIN;window.ssPrecio=o.precio;\n'
 'h.classList.add("of-bv","of-bf");setTimeout(function(){location.reload()},Math.min(DIC-t+1500,2e9));return}\n'
 'if(o.fase==="bv"&&o.inicio&&o.inicio<DIC){h.classList.remove("of-bv");o.fase="regular";o.precio=o.regular;o.off="3hjxp67m";delete o.finBv;window.ssPrecio=o.precio;h.classList.add("of-regular")}}();</script>')
t = t[:ini] + CAPA + t[fin:]

# 2) reloj de prueba: primer script del <head>; solo actúa con ?ss_fecha=
RELOJ = ('<script>/* Modo de prueba: ?ss_fecha=2026-12-01T00:01 (hora de Paraguay) simula la fecha y el reloj sigue corriendo desde ahí. Sin ese parámetro no hace nada. */\n'
 r'!function(){try{var m=/[?&]ss_fecha=(\d{4}-\d\d-\d\d(?:T\d\d:\d\d(?::\d\d)?)?)(?:&|#|$)/.exec(location.search);if(!m)return;var v=m[1];if(v.length===10)v+="T12:00:00";else if(v.length===16)v+=":00";var N=Date,sim=N.parse(v+"-03:00");if(isNaN(sim))return;var k="ss_fecha_t0",t0=0,s;try{s=JSON.parse(sessionStorage.getItem(k)||"null");if(s&&s.v===v)t0=s.t}catch(e){}if(!t0){t0=N.now();try{sessionStorage.setItem(k,JSON.stringify({v:v,t:t0}))}catch(e){}}var d=sim-t0;'
 'var S=function(){var a=arguments;if(!(this instanceof S))return new N(N.now()+d).toString();return a.length?new(Function.prototype.bind.apply(N,[null].concat([].slice.call(a)))):new N(N.now()+d)};S.prototype=N.prototype;S.now=function(){return N.now()+d};S.parse=N.parse;S.UTC=N.UTC;window.Date=S;window.ssFechaPrueba=v}catch(e){}}();</script>')
CH = '<meta charset="utf-8">'
assert t.count(CH) == 1
t = t.replace(CH, CH + RELOJ)

# 3) mensaje de precio coherente con los anuncios
CAMBIOS = [
    ('e.innerHTML="Precio de Black Friday para todos hasta el "+F+" a las 23:59 (hora de Paraguay). Después, el precio regular es USD <span data-p-reg>"+R+"</span>."',
     'e.innerHTML="Precio Black Friday: USD "+P+" hasta el "+F+" a las 23:59 (hora de Paraguay). Desde el "+F1+", USD <span data-p-reg>"+R+"</span>."', 1),
    ('"</b> hasta el "+F+". Después, el precio regular es USD "+R+"."',
     '"</b> hasta el "+F+". Desde el "+F1+", USD "+R+"."', 1),
]
for viejo, nuevo, n in CAMBIOS:
    if t.count(viejo) != n:
        sys.exit('FRENO: «%s» aparece %d veces (esperaba %d). No se cambió nada.' % (viejo[:70], t.count(viejo), n))
    t = t.replace(viejo, nuevo)
for s, n in antes.items():
    if t.count(s) != n:
        sys.exit('FRENO: cambió el seguimiento o el pago: %s (antes %d, ahora %d)' % (s, n, t.count(s)))
open('index.html', 'wb').write((b'\xef\xbb\xbf' if bom else b'') + t.encode('utf-8'))
print('ok: index.html · BOM', bom, '· capa nueva', len(CAPA), 'caracteres')
