# -*- coding: utf-8 -*-
# Martino 24/11/2026, correcciones sobre la rama bf-precio-coherente:
#  1) El precio SOLO dentro de la tarjeta #precio (nada de USD ni números de precio en franja, hero, botones, barra del celular ni FAQ).
#  2) Fondo de October Black (b01bad1: #0B0E0C con aura crema y verde) en lugar del negro noir; se conservan logos de pago y el resto del diseño.
#  3) Sin «(hora de Paraguay)».
#  4) El corte 67 -> 87 es la medianoche LOCAL de cada visitante (new Date(2026,11,1,0,0,0): hora del dispositivo, sin zona fija): cambio de precio, recarga automática y marca de «visitante de noviembre». El modo de prueba ?ss_fecha= también se lee en hora local.
#   python _armar-bf-correcciones.py   (edita index.html en el lugar; frena si algo no aparece lo esperado)
import sys, re
raw = open('index.html', 'rb').read()
bom = raw.startswith(b'\xef\xbb\xbf')
t = raw.decode('utf-8-sig')
SEGUIMIENTO = ['1448725857302388', 'AW-18441137893', 'InitiateCheckout', '1tbcugw1', '3hjxp67m', "fbq('init'", 'ss_bv_v2', 'ss_bv2', 'G107515293E']
antes = {s: t.count(s) for s in SEGUIMIENTO}

def uno(viejo, nuevo, n=1):
    global t
    if t.count(viejo) != n:
        sys.exit('FRENO: «%s» aparece %d veces (esperaba %d). No se cambió nada.' % (viejo[:80], t.count(viejo), n))
    t = t.replace(viejo, nuevo)

# ---- 4) corte en la medianoche local de cada visitante
uno('Date.parse("2026-12-01T00:00:00-03:00")', 'new Date(2026,11,1,0,0,0).getTime()')
uno('   Hasta el lunes 30/11/2026 23:59:59 (Paraguay): USD 67 para todos', '   Hasta el lunes 30/11/2026 23:59:59 en la hora de cada visitante (medianoche local): USD 67 para todos')
uno('Desde el 01/12/2026 00:00: quien ya', 'Desde el 01/12/2026 00:00 local: quien ya')
# fecha mostrada = día local del visitante (antes se calculaba restando 3 h y leyendo UTC)
for v, n in (('new Date(o.bf-108e5)', 'new Date(o.bf)'), ('new Date(t-108e5)', 'new Date(t)'), ('new Date(o.bf+1e3-108e5)', 'new Date(o.bf+1e3)')):
    uno(v, n)
for g in ('getUTCDay', 'getUTCDate', 'getUTCMonth', 'getUTCHours', 'getUTCMinutes'):
    t = t.replace(g, g.replace('UTC', ''))
# modo de prueba en hora local
uno('N.parse(v+"-03:00")', 'N.parse(v)')

# ---- 2) fondo October Black: se borran las variables noir y se mapean sus colores a los de October Black
a = t.index('<style id="bf-noir">'); b = t.index('</style>', a)
css = t[a:b]
css = re.sub(r'html\.of-bf\{--ob-noche:[^}]*\}', '', css, count=1)
for v, n in (('#0A0A09', '#0A0D0B'), ('#080807', '#070908'), ('#0B0B0A', '#0B0E0C'), ('rgba(10,10,9,.8)', 'rgba(11,14,12,.74)'), ('rgba(10,10,9,.62)', 'rgba(11,14,12,.62)'),
             ('#EFE9DC', '#F0EBE0'), ('#C9C2B4', '#D3CDBE'), ('#9C968A', '#A39E8E'), ('#CDBB8A', '#E3CF98'), ('#B9A877', '#C9B37E'),
             ('--forest-deep:#121110', '--forest-deep:#0F1A13'), ('#121110', '#151B17'),
             ('--line-strong:rgba(239,233,220,.11)', '--line-strong:rgba(240,235,224,.24)'),
             ('rgba(255,255,255,.022)', 'rgba(255,255,255,.045)'), ('border-color:rgba(239,233,220,.08)!important', 'border-color:rgba(240,235,224,.13)!important'),
             ('rgba(239,233,220,.07)', 'rgba(240,235,224,.12)')):
    css = css.replace(v, n)
css = css.replace('rgba(239,233,220,', 'rgba(240,235,224,')
t = t[:a] + css + t[b:]

uno('html.of-bf .announcement{background:#000!important', 'html.of-bf .announcement{background:#0B0E0C!important')   # franja de arriba con el fondo de October Black
# ---- 1) precio solo en #precio
# hero Black Friday: sin precio ni ahorro; botón sin número
uno('<p class="bf-precio"><s data-bf-antes>USD <span data-bf="r"></span></s><b><small>USD</small><span data-bf="p"></span></b></p>', '')
uno(' <span class="bf-ahorro" data-bf-antes>Ahorras <b>USD <span data-bf="ah"></span></b> sobre el precio regular.</span>', '')
uno('<span>Conseguir el Método a USD <span data-bf="p"></span></span>', '<span>Conseguir el Método</span>')
# bono: sin «valor»
uno('<span class="nov-bono-antes">Valor <s>USD 500</s></span>', '')
# línea de precio del cierre (la reescribían los scripts con USD): se quita el elemento; el bloque «Black Friday · hasta el…» de arriba queda
uno('<p class="nov-cierre-precio" data-linea-precio></p>', '')
# preguntas frecuentes sin números de precio
uno('Tu precio de bienvenida es de <b>USD 67</b> durante los 3 días siguientes a tu primera visita, con el pack completo', 'Tu precio de bienvenida lo ves en la tarjeta de precio y dura 3 días desde tu primera visita, con el pack completo')
uno('Después de esos 3 días, el precio es <b>USD 87</b>. Los que ya compraron', 'Después de esos 3 días, el precio sube. Los que ya compraron')
uno('Después, el precio es USD 87. Y el precio puede subir en cualquier momento.', 'Después, el precio sube. Y el precio puede subir en cualquier momento.')
# textos que escribe el script de Black Friday
uno('b.innerHTML="<b>Black Friday</b> "+(ANTES?"<s>USD "+R+"</s> ":"")+"<span class=\\"bf-b-precio\\">USD "+P+"</span><span class=\\"bf-urg\\"',
    'b.innerHTML="<b>Black Friday</b> <span class=\\"bf-urg\\"')
uno('e.innerHTML="Precio Black Friday: USD "+P+" hasta el "+F+" a las 23:59 (hora de Paraguay). Desde el "+F1+", USD <span data-p-reg>"+R+"</span>."',
    'e.innerHTML="Precio Black Friday: USD "+P+" hasta el "+F+". Desde el "+F1+", USD <span data-p-reg>"+R+"</span>."')
uno('if(m)m.textContent="Black Friday \xb7 USD "+P;', 'if(m)m.textContent="Black Friday";var mv=document.querySelector(\'[data-cuenta="movil"]\');if(mv)mv.textContent="Hasta el "+F;')
uno('cuesta USD "+P+" para todos, sin importar cuándo entraste por primera vez. Termina el "+F+" a las 23:59 (hora de Paraguay). Desde el "+F1+", el precio regular es USD "+R+"."',
    'tiene el precio de Black Friday para todos, sin importar cuándo entraste por primera vez. Termina el "+F+". Desde el "+F1+", vuelve el precio regular, que ves en la tarjeta de precio."')
uno('e.textContent="El Black Friday termina el "+F+" a las 23:59 (hora de Paraguay)."', 'e.textContent="El Black Friday termina el "+F+"."')
# botones: vuelven a su texto de siempre, sin precio
a2 = t.index('/* botones con el precio del evento */'); b2 = t.index('function cierre()', a2)
bloque = t[a2:b2]
assert 'Comprar ahora a USD' in bloque
nuevo = ('/* botones: el precio solo va en la tarjeta #precio */\nq(\'main a.btn[href="#precio"]:not(.bf-btn)\').forEach(function(e){if(e.closest(".nov-cierre-accion"))return;var n=e.firstChild;if(n&&n.nodeType===3)n.nodeValue="Quiero el Método "});\nq(".price-card .btn.checkout").forEach(function(e){e.textContent="Comprar ahora a USD "+P});\nq(".nov-cierre-accion>.btn").forEach(function(e){e.textContent="Quiero el Método Prompt Ads"});\n')
t = t[:a2] + nuevo + t[b2:]
a3 = t.index('function cierre(){'); b3 = t.index('q(".ss-pagos img")', a3)
t = t[:a3] + 'function cierre(){}\n' + t[b3:]
# franja urgente sin hora ni país: «Hasta el lunes 30 de noviembre»
uno('+F+\'</span><span class="bf-urg-h"><span class="bf-urg-sep">\xb7</span>\'+HORA+\' <span class="bf-urg-pais">(hora de Paraguay)</span></span>\'',
    '+F+\'</span>\'')

for s, n in antes.items():
    if t.count(s) != n and not (s == '3hjxp67m' and t.count(s) == n):
        sys.exit('FRENO: cambió el seguimiento o el pago: %s (antes %d, ahora %d)' % (s, n, t.count(s)))
open('index.html', 'wb').write((b'\xef\xbb\xbf' if bom else b'') + t.encode('utf-8'))
print('ok: index.html · BOM', bom)
