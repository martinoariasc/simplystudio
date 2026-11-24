# -*- coding: utf-8 -*-
# Martino 24/11/2026: «esto está de más aquí, porque abajo vuelve a mostrar todo esto… abajo está mejor, muestra mejor todo
# con imágenes» y «ese video que se anima con el scroll se ve muy de baja calidad».
# 1) Sección «Qué incluye»: queda el título «Todo lo que nos llevó más de USD 24.000 aprender, en un pago único.», el libro y
#    el botón; sale la lista con tildes (se repetía con las tarjetas con imágenes de abajo y con «Todo lo que te llevas»).
# 2) El libro que gira con el scroll: en celulares (pantallas de densidad 1,5 o más) usa los cuadros de 1080 px en vez de los
#    de 640 px estirados (se veían borrosos). Con zoom de dos dedos se queda quieto, como el resto de lo que se mueve.
import sys, re
raw = open('index.html', 'rb').read(); bom = raw.startswith(b'\xef\xbb\xbf'); t = raw.decode('utf-8-sig')
SEGUIMIENTO = ['1448725857302388', 'AW-18441137893', 'InitiateCheckout', '1tbcugw1', '3hjxp67m', 'ss_bv_v2', 'ss_bv2', 'G107515293E']
antes = {s: t.count(s) for s in SEGUIMIENTO}
def uno(viejo, nuevo, n=1):
    global t
    if t.count(viejo) != n: sys.exit('FRENO: «%s» aparece %d veces (esperaba %d).' % (viejo[:90], t.count(viejo), n))
    t = t.replace(viejo, nuevo)
m = re.search(r'<div class="v2-hero-sub v2-sube d4"><ul class="nov-incl">.*?</ul></div>', t, re.S)
if not m or 'Se actualiza. Desde que sali' not in m.group(0): sys.exit('FRENO: no encontré la lista de «Qué incluye».')
uno(m.group(0), '')
uno('r=window.innerWidth<=760?"giro-640":window.innerWidth>900&&i>=1.5?"giro-1080":"giro-760"',
    'r=i>=1.5?"giro-1080":window.innerWidth<=760?"giro-640":"giro-760"')
uno('function g(){u||(u=!0,requestAnimationFrame(v))}function p(){h();', 'function g(){u||window.ssQuieto||(u=!0,requestAnimationFrame(v))}function p(){h();')
if 'Todo lo que nos llevó más de USD 24.000 aprender' not in t: sys.exit('FRENO: se perdió el título de los USD 24.000.')
despues = {s: t.count(s) for s in SEGUIMIENTO}
if antes != despues: sys.exit('FRENO: cambió el seguimiento %s -> %s' % (antes, despues))
open('index.html', 'wb').write((b'\xef\xbb\xbf' if bom else b'') + t.encode('utf-8'))
print('ok: lista quitada, libro en 1080 en celulares y quieto con zoom; seguimiento intacto')
