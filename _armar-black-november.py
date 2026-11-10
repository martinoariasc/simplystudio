# -*- coding: utf-8 -*-
# BLACK NOVEMBER (Martino 10/11/2026). Se aplica sobre index.html (landing de noviembre, minificada). Frena si algo no aparece exactamente
# las veces esperadas y no deja nada a medias.
#   1. Precio: USD 67 para TODOS hasta el lunes 30/11/2026 23:59 (Paraguay, -03:00); desde el 01/12 00:00 USD 87 y el botón va a la oferta 87.
#      Se saca la lógica de «3 días por visitante» (ss_bv_v2 / ss_bv2): nadie ve otro precio ni otro reloj según cuándo entró.
#   2. Nombre: el «precio de bienvenida» pasa a leerse «Precio de bienvenida · Black November».
#   3. Look negro: las reglas de October Black (html.of-ob) se copian como html.of-bn y esa clase solo está puesta mientras dura la promo.
#   Lo demás (secciones, textos, imágenes, orden, enlace de Hotmart con checkoutMode=10, píxel) no se toca.
#   python _armar-black-november.py        (edita index.html en el lugar)
import re, sys

raw = open('index.html', 'rb').read()
bom = raw.startswith(b'\xef\xbb\xbf')
t = raw.decode('utf-8-sig')
SEGUIMIENTO = ['1448725857302388', 'AW-18441137893', 'InitiateCheckout', '1tbcugw1', 'checkoutMode=10', "fbq('init'"]
antes = {s: t.count(s) for s in SEGUIMIENTO}

def una_vez(viejo, nuevo, n=1):
    global t
    if t.count(viejo) != n:
        sys.exit('FRENO: «%s» aparece %d veces (esperaba %d). No se cambió nada.' % (viejo[:80], t.count(viejo), n))
    t = t.replace(viejo, nuevo)

# ---------- 1 · el script de precio (ofuscado) se reemplaza entero por uno claro ----------
ini = t.index('<script>function s17_E(){')
fin = t.index('</script>', ini) + len('</script>')
bloque = t[ini:fin]
assert 'ss_bv_v2' in bloque and 'ssPrecio' in bloque, 'no es el script de precio esperado'
PRECIO_JS = r'''<script>/* Black November: USD 67 para todos hasta el lunes 30/11/2026 23:59 (Paraguay, -03:00); desde el 01/12 00:00, USD 87. Sin memoria por visitante. */
!function(){
var FIN=Date.parse("2026-11-30T23:59:59.999-03:00"),L=document.documentElement,Q=Date.now(),
bv=Q<=FIN,E={estado:"nov",fase:bv?"bv":"regular",precio:bv?67:87,bv:67,regular:87,nov:Date.parse("2026-10-30T00:00:00-03:00"),finEdicion:FIN,finBv:FIN};
if(!bv)E.off="3hjxp67m";
window.ssOferta=E;window.ssPrecio=E.precio;
L.classList.add("of-nov","of-"+E.fase,"of-nv");
if(bv)L.classList.add("of-bn");
var hecho=false,F=function(){
if(hecho)return;
var falta=FIN+1-Date.now();
if(falta<=0){hecho=true;location.reload();return}
setTimeout(F,Math.min(falta+50,2e9))};
if(bv){setTimeout(F,Math.min(FIN+1-Q+50,2e9));
document.addEventListener("visibilitychange",function(){document.hidden||F()});
addEventListener("pageshow",F)}
}();</script>'''
t = t[:ini] + PRECIO_JS + t[fin:]

# ---------- 2 · textos ----------
una_vez('<span data-cuenta="banner"><b>Tu precio de bienvenida</b> termina en</span>',
        '<span data-cuenta="banner"><b>Precio de bienvenida · Black November</b> termina en</span>')
una_vez('"<b>Tu precio de bienvenida</b> termina en"', '"<b>Precio de bienvenida · Black November</b> termina en"')
una_vez('t&&(t.textContent="ob"===e.estado?"Precio de October Black":"Tu precio de bienvenida")',
        't&&(t.textContent="Precio de bienvenida · Black November")')
una_vez('<span class="launch-tag" data-of="nv" data-fase="bv">Tu precio de bienvenida</span>',
        '<span class="launch-tag" data-of="nv" data-fase="bv">Precio de bienvenida · Black November</span>')
una_vez('Tienes 3 días desde tu primera visita. Después, el precio sube a USD <span data-p-reg>87</span>.',
        'USD 67 para todos hasta el lunes 30 de noviembre a las 23:59 (hora de Paraguay). Después, el precio sube a USD <span data-p-reg>87</span>.')
una_vez('Pasados los 3 días, el precio sube a USD <span data-p-reg>87</span>.',
        'Desde el 1 de diciembre, el precio sube a USD <span data-p-reg>87</span>.')
una_vez('<summary>¿Por qué tengo un precio especial y un reloj?</summary><p>Es tu precio de bienvenida: dura 3 días desde la primera vez que entras. Después, el precio es USD 87. Y el precio puede subir en cualquier momento.</p>',
        '<summary>¿Qué es el precio de bienvenida de Black November y por qué hay un reloj?</summary><p>Es el precio de bienvenida de Black November: USD 67 para todos, hasta el lunes 30 de noviembre a las 23:59 (hora de Paraguay). El reloj cuenta hasta esa fecha. Desde el 1 de diciembre, el precio es USD 87.</p>')
una_vez('aria-label="Cuenta regresiva hasta que termina October Black"', 'aria-label="Cuenta regresiva hasta que termina Black November"')

# FAQ de October Black (oculta desde que terminó, y todavía hablaba de «3 días desde tu primera visita»): se saca
m = re.findall(r'<details data-of="ob"><summary>¿Qué es October Black\?</summary>.*?</details>', t, flags=re.S)
if len(m) != 1:
    sys.exit('FRENO: FAQ de October Black aparece %d veces' % len(m))
t = t.replace(m[0], '')

# sello de arriba: lugar del sello de October Black
una_vez('<div class="nov-sello v2-sube d1" data-of="nov">',
        '<div class="ob-sello v2-sube d1" data-of="bn"><i aria-hidden="true"></i><b>Black November</b><span>hasta el lunes 30 de noviembre</span></div><div class="nov-sello v2-sube d1" data-of="nov">')

# línea del cierre: el texto viene del script comprimido (decía «24 horas» y luego un arreglo la pasó a «3 días»)
ini2 = t.index('<script>/* 09/11: el cierre dice 3 días')
fin2 = t.index('</script>', ini2) + len('</script>')
CIERRE_JS = r'''<script>/* Black November: línea de precio del cierre y etiqueta del reloj (el script comprimido de arriba trae el texto viejo) */
!function(){var e=window.ssOferta,l=document.querySelector("[data-linea-precio]"),c=document.querySelector(".v2-cuenta");
if(!e)return;
l&&(l.textContent="bv"===e.fase?"Precio de bienvenida · Black November: USD "+e.bv+" hasta el 30 de noviembre. Después sube a USD "+e.regular+".":"Precio: USD "+e.regular+".");
c&&c.setAttribute("aria-label","Cuenta regresiva hasta que termina Black November")}();</script>'''
t = t[:ini2] + CIERRE_JS + t[fin2:]

# ---------- 3 · look negro ----------
# se copian las reglas de October Black (html.of-ob) como html.of-bn
def reglas(css):
    out, prof, cur = [], 0, ''
    for ch in css:
        cur += ch
        if ch == '{': prof += 1
        elif ch == '}':
            prof -= 1
            if prof == 0:
                out.append(cur.strip()); cur = ''
    return out
estilos = re.findall(r'<style[^>]*>(.*?)</style>', t, flags=re.S)
ob = []
for e in estilos:
    for r in reglas(e):
        if 'of-ob' in r and 'data-of' not in r:
            ob.append(r)
if not (45 <= len(ob) <= 60):
    sys.exit('FRENO: reglas de October Black encontradas: %d' % len(ob))
bn = '\n'.join(r.replace('of-ob', 'of-bn') for r in ob)
EXTRA = open('_black-november-extra.css', encoding='utf-8').read() if __import__('os').path.exists('_black-november-extra.css') else ''
ESTILO = ('<style id="black-november">/* Black November: mismo look negro de October Black; la clase of-bn solo está puesta mientras dura la promo */\n'
          'html:not(.of-bn) [data-of="bn"]{display:none!important}\nhtml.of-bn .nov-sello{display:none!important}\n' + bn + '\n' + EXTRA + '</style>')
una_vez('</head>', ESTILO + '</head>')

# ---------- control ----------
for s, n in antes.items():
    if t.count(s) != n:
        sys.exit('FRENO: cambió el seguimiento o el pago: %s' % s)
for malo in ['ss_bv_v2', 'ss_bv2', '24 horas', 'primera visita', 'primera vez que entras']:
    if malo in t:
        sys.exit('FRENO: queda «%s»' % malo)
open('index.html', 'wb').write((b'\xef\xbb\xbf' if bom else b'') + t.encode('utf-8'))
print('ok: index.html · reglas negras copiadas:', len(ob), '· BOM', bom)
