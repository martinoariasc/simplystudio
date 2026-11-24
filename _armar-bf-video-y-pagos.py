# -*- coding: utf-8 -*-
# Martino 24/11/2026: (1) tarjeta del video con texto que vende mejor; (2) logos de pago con sus colores de marca (tarjetita blanca redondeada de cada ícono), mismo tamaño en todos lados.
#   python _armar-bf-video-y-pagos.py   (edita index.html en el lugar; frena si algo no aparece lo esperado)
import sys, re
raw = open('index.html', 'rb').read()
bom = raw.startswith(b'\xef\xbb\xbf')
t = raw.decode('utf-8-sig')
SEGUIMIENTO = ['1448725857302388', 'AW-18441137893', 'InitiateCheckout', '1tbcugw1', '3hjxp67m', "fbq('init'", 'ss_bv_v2', 'ss_bv2', 'G107515293E']
antes = {s: t.count(s) for s in SEGUIMIENTO}
def uno(viejo, nuevo, n=1):
    global t
    if t.count(viejo) != n:
        sys.exit('FRENO: «%s» aparece %d veces (esperaba %d).' % (viejo[:80], t.count(viejo), n))
    t = t.replace(viejo, nuevo)
# 1) video
uno('<h3>16 minutos. A propósito.</h3><p>Podríamos haber grabado 20 horas para que parezca más. Hicimos lo contrario: recortamos hasta dejar solo lo que te sirve. En el video ves cómo se crea un anuncio de principio a fin, sin cortes. El resto lo aprendes creando, con tu producto y con tu IA de guía, todo el tiempo que necesites.</p>',
    '<h3>Un video corto. Una habilidad para siempre.</h3><p>El video dura 16 minutos y no le sobra nada: ves cómo se crea un anuncio de marca grande de principio a fin, sin cortes. Pero el Método no es un curso para mirar. Es un sistema que tu IA lee en segundos y que te guía con tu propio producto cada vez que lo necesitas: hoy, mañana y en cada lanzamiento. Mientras otros siguen mirando horas de clases, tú ya estás publicando imágenes que hacen que tu producto se vea caro.</p>')
# 2) logos: originales a color (sin la versión monocroma noir) y mismo tamaño
t = t.replace('assets/pagos/noir/', 'assets/pagos/')
a = t.index('q(".ss-pagos img").forEach(function(i){var s=i.getAttribute("src")')
b = t.index('function todo()', a)
t = t[:a] + t[b:]
uno('html.of-bf .ss-pagos img{width:34px!important;height:21px!important;border-radius:0!important;opacity:.82;transition:opacity .3s ease}',
    'html.of-bf .ss-pagos img{width:36px!important;height:23px!important;border-radius:4px!important;opacity:1;background:#fff}')
uno('html.of-bf .price-card .ss-pagos img{width:30px!important;height:19px!important}', 'html.of-bf .price-card .ss-pagos img{width:31px!important;height:20px!important}')
uno('html.of-bf .ss-pagos ul{gap:10px 12px!important}html.of-bf .ss-pagos img{width:27px!important;height:17px!important}', 'html.of-bf .ss-pagos ul{gap:6px!important}html.of-bf .ss-pagos img{width:31px!important;height:20px!important}')
uno('html.of-bf .price-card .ss-pagos ul{gap:9px 9px!important}', 'html.of-bf .price-card .ss-pagos ul{gap:6px!important}')
for s, n in antes.items():
    if t.count(s) != n: sys.exit('FRENO: cambió el seguimiento o el pago: %s' % s)
open('index.html', 'wb').write((b'\xef\xbb\xbf' if bom else b'') + t.encode('utf-8'))
print('ok')
