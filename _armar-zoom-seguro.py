# -*- coding: utf-8 -*-
# Martino 24/11/2026: «cuando acerco la pantalla con mis 2 dedos... se me cierra y dice que ocurre un error».
# Causa: en iPhone (Safari y el navegador de Instagram) las cintas que se mueven solas siguen moviéndose con la
# pantalla agrandada y el teléfono las vuelve a dibujar sin parar en alta resolución hasta quedarse sin memoria.
# Arreglo (no cambia nada a zoom normal):
#  1) Detector en el <head>: con zoom (visualViewport.scale > 1,02) o con 2 dedos en la pantalla marca html.ss-quieto
#     y window.ssQuieto = true; al volver a zoom normal, a los 0,4 s todo retoma.
#  2) Las 4 cintas que se mueven solas (galería de anuncios en celular y en computadora, flyers, testimonios/casos)
#     se quedan quietas mientras dure el zoom. Se siguen pudiendo arrastrar con el dedo.
#  3) Con zoom se pausan las animaciones CSS y se sueltan las capas de GPU que no hacen falta.
#  4) Se puede pellizcar también encima de las cintas y de la foto ampliada de los testimonios (antes lo bloqueaba).
import sys
raw = open('index.html', 'rb').read()
bom = raw.startswith(b'\xef\xbb\xbf')
t = raw.decode('utf-8-sig')
SEGUIMIENTO = ['1448725857302388', 'AW-18441137893', 'InitiateCheckout', '1tbcugw1', '3hjxp67m', "fbq('init'", 'ss_bv_v2', 'ss_bv2', 'G107515293E']
antes = {s: t.count(s) for s in SEGUIMIENTO}
if 'ss-quieto' in t:
    sys.exit('FRENO: el arreglo de zoom ya está aplicado.')

def uno(viejo, nuevo, n=1):
    global t
    if t.count(viejo) != n:
        sys.exit('FRENO: «%s» aparece %d veces (esperaba %d).' % (viejo[:90], t.count(viejo), n))
    t = t.replace(viejo, nuevo)

# 1) detector en el head, justo después del viewport
VIEW = '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
DETECTOR = ('<style>html.ss-quieto *,html.ss-quieto *::before,html.ss-quieto *::after{animation-play-state:paused!important}'
            'html.ss-quieto .fl-track,html.ss-quieto .m-track{will-change:auto!important}'
            'html.ss-quieto .m-track,html.ss-quieto .v2-marcas-track,html.ss-quieto .v2-gal-track{backface-visibility:visible!important}</style>'
            '<script>/* 24/11: zoom con dos dedos sin que el iPhone cierre la página: con zoom todo lo que se mueve solo se queda quieto */'
            '(function(){var H=document.documentElement,V=window.visualViewport,d=0,tm=0;window.ssQuieto=!1;'
            'function q(v){if(v===window.ssQuieto)return;window.ssQuieto=v;H.classList.toggle("ss-quieto",v)}'
            'function r(){var z=V?V.scale>1.02:!1;clearTimeout(tm);if(z||d>1)q(!0);else tm=setTimeout(function(){q(!1)},400)}'
            'if(V)V.addEventListener("resize",r,{passive:!0});'
            'function tc(e){d=e.touches?e.touches.length:0;r()}'
            '["touchstart","touchend","touchcancel"].forEach(function(n){addEventListener(n,tc,{passive:!0,capture:!0})});'
            'addEventListener("gesturestart",function(){clearTimeout(tm);q(!0)},{passive:!0});'
            'addEventListener("gestureend",r,{passive:!0})})();</script>')
uno(VIEW, VIEW + DETECTOR)

# 2a) cinta de flyers
uno('if(visible&&!document.hidden&&!p){', 'if(visible&&!document.hidden&&!p&&!window.ssQuieto){')
# 2b) testimonios y casos (ssCarrusel): sigue el ciclo pero no avanza solo
uno('function b(){g&&!document.hidden?(m||(Math.abs(f)>.08', 'function b(){g&&!document.hidden?(m||window.ssQuieto||(Math.abs(f)>.08')
# 2c) galería de anuncios en celular (desplazamiento nativo que avanza solo)
uno('u>i&&!document.querySelector("dialog[open]")){var f=e.scrollWidth-e.clientWidth;',
    'u>i&&!window.ssQuieto&&!document.querySelector("dialog[open]")){var f=e.scrollWidth-e.clientWidth;')
# 2d) galería de anuncios en computadora (pellizco del trackpad)
uno('s=t,v&&!document.hidden&&(l||(Math.abs(o)>.05?', 's=t,v&&!document.hidden&&!window.ssQuieto&&(l||(Math.abs(o)>.05?')

# 2e) testimonios y casos a zoom normal: se mueven en su propia capa (antes se redibujaban ~800 veces por segundo
#     en Chrome; mismas letras, medido) y al soltar el arrastre vuelve a la regla de la hoja de estilos.
uno('.m-track{display:flex;gap:14px;width:max-content}', '.m-track{display:flex;gap:14px;width:max-content;will-change:transform}')
uno('t.style.willChange="auto"', 't.style.willChange=""')

# 2f) las dos demostraciones del chat (ChatGPT y Claude): con zoom esperan en el paso en que están y siguen al volver
uno('setTimeout((function(){t===L&&b?n():a("corte")}),e)', 'setTimeout((function k(){t===L&&b?window.ssQuieto?setTimeout(k,250):n():a("corte")}),e)')
uno('setTimeout((function(){t===g&&L?s():a("corte")}),e)', 'setTimeout((function k(){t===g&&L?window.ssQuieto?setTimeout(k,250):s():a("corte")}),e)')

# 4) dejar pellizcar encima de las cintas y de la foto ampliada
uno('.m-row{touch-action:pan-y', '.m-row{touch-action:pan-y pinch-zoom')
uno('.fl-fila.fl-js{touch-action:pan-y', '.fl-fila.fl-js{touch-action:pan-y pinch-zoom')
uno('.lightbox.ts-on img{touch-action:pan-y', '.lightbox.ts-on img{touch-action:pan-y pinch-zoom')

despues = {s: t.count(s) for s in SEGUIMIENTO}
if antes != despues:
    sys.exit('FRENO: cambió el seguimiento %s -> %s' % (antes, despues))
open('index.html', 'wb').write((b'\xef\xbb\xbf' if bom else b'') + t.encode('utf-8'))
print('ok: detector de zoom + 4 cintas quietas con zoom + testimonios en su capa + demos del chat en pausa con zoom + pellizco permitido en cintas y foto ampliada; seguimiento intacto', despues)
