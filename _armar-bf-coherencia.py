# -*- coding: utf-8 -*-
# Martino 24/11/2026: arreglos de coherencia de REVISION-COHERENCIA-PAGINA.md (países, testimonios, «dos archivos», garantía).
import sys, re, html
raw = open('index.html', 'rb').read()
bom = raw.startswith(b'\xef\xbb\xbf')
t = raw.decode('utf-8-sig')
SEGUIMIENTO = ['1448725857302388', 'AW-18441137893', 'InitiateCheckout', '1tbcugw1', '3hjxp67m', "fbq('init'", 'ss_bv_v2', 'ss_bv2', 'G107515293E']
antes = {s: t.count(s) for s in SEGUIMIENTO}
def uno(viejo, nuevo, n=1):
    global t
    if t.count(viejo) != n: sys.exit('FRENO: «%s» aparece %d veces (esperaba %d).' % (viejo[:80], t.count(viejo), n))
    t = t.replace(viejo, nuevo)
# 1) países (dato real: compradores en 23 países según el historial de Hotmart desde agosto)
uno('<b>Usado en 17 países</b>', '<b>Compradores en más de 20 países</b>')
# 2) testimonios: solo textuales de opiniones-de-la-web.json y ninguno de ventas o ingresos
import json
J = json.load(open(r'C:/Users/USER/Desktop/Jobs/Productos digitales/simply studio/Productos/Prompt Ads/anuncios/02-10-26 embudo/opiniones-de-la-web.json', encoding='utf-8'))
norm = lambda x: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', x))).strip()
ver = {norm(j['texto']) for j in J}
mala = re.compile(r'ventas|ingreso|ganancia|factur|dinero', re.I)
quitados = []
def filtra(m):
    q = norm(re.search(r'<p class="tcard-q">(.*?)</p>', m.group(0), re.S).group(1))
    if q not in ver or mala.search(q):
        quitados.append(re.search(r'<b>([^<]*)</b><span>', m.group(0)).group(1)); return ''
    return m.group(0)
t = re.sub(r'<article class="tcard">.*?</article> ?', filtra, t, flags=re.S)
print('testimonios quitados:', quitados)
# 3) «dos archivos» / «no instalas nada»
uno('<p>No instalas nada ni necesitas saber diseñar: funciona con la IA que ya usas.</p>', '<p>Para empezar: dos archivos y tu ChatGPT. (El Método avanzado con Claude es opcional) No necesitas saber diseñar.</p>')
uno('<p>No. Descargas dos archivos, arrastras uno a Claude y él prepara todo; tú inicias sesión en tu cuenta de ChatGPT y aceptas los permisos que te pide.</p>',
    '<p>No. Para empezar: dos archivos y tu ChatGPT. (El Método avanzado con Claude es opcional). En esa versión arrastras un archivo a Claude y él prepara todo; tú inicias sesión en tu cuenta de ChatGPT y aceptas los permisos que te pide.</p>')
# 4) garantía: una sola redacción
G = '7 días de garantía: si no aprendes a crear tus imágenes, te devolvemos el 100\u00a0% de tu dinero'
uno('7 días de garantía con devolución del 100\u00a0%', G, 4)
uno('Si en 7 días sientes que no aprendiste el concepto o que no es para ti, pides la devolución y te reintegramos el 100\u00a0%. Sin preguntas.', G + '.')
uno('Tienes 7 días de garantía. Si sientes que no aprendiste el concepto o que no es para ti, pides la devolución y te reintegramos el 100\u00a0%. Sin preguntas.', G + '.')
for s, n in antes.items():
    if t.count(s) != n: sys.exit('FRENO: cambió el seguimiento o el pago: %s' % s)
open('index.html', 'wb').write((b'\xef\xbb\xbf' if bom else b'') + t.encode('utf-8'))
print('ok')
