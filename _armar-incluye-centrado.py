# -*- coding: utf-8 -*-
# Martino 24/11/2026 («y actualiza nomás ya al mundo»): en computadora el título de «Qué incluye» quedaba pegado a la
# izquierda (ancho máximo sin márgenes automáticos) mientras el libro y el botón van centrados. Se centra solo en esa sección.
import sys
raw = open('index.html', 'rb').read(); bom = raw.startswith(b'\xef\xbb\xbf'); t = raw.decode('utf-8-sig')
V = '<style>html.ss-quieto *,'
if t.count(V) != 1: sys.exit('FRENO: no encontré el lugar del estilo.')
if '#incluye .v2-hero-h{margin-left:auto' in t: sys.exit('FRENO: ya aplicado.')
t = t.replace(V, '<style>#incluye .v2-hero-h{margin-left:auto;margin-right:auto}</style>' + V)
open('index.html', 'wb').write((b'\xef\xbb\xbf' if bom else b'') + t.encode('utf-8'))
print('ok: título de «Qué incluye» centrado')
