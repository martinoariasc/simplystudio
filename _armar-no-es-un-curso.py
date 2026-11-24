# -*- coding: utf-8 -*-
# Martino 24/11/2026: los 6 cambios «No es un curso» de estrategia/no-es-un-curso-22-11/PROPUESTA.md (textos exactos, tú neutro).
#   python _armar-no-es-un-curso.py   (edita index.html en el lugar; frena si algo no aparece exactamente una vez)
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

# 1) «Qué es»: línea debajo del título
uno('Como tener una agencia creativa de primer nivel dentro de tu ChatGPT o Claude, sin pagar miles de dólares por ella.</p></div>',
    'Como tener una agencia creativa de primer nivel dentro de tu ChatGPT o Claude, sin pagar miles de dólares por ella.</p>'
    '<p class="nov-baj nov-nocurso">No es un curso para mirar. Es un sistema que tu IA lee en segundos y te enseña a usar con tu propio producto.</p></div>')

# 2) Tarjeta del video
uno('<h3>Y además, el video del método</h3><p>Además de los archivos y las guías, una grabación completa donde se crea un anuncio de principio a fin, sin cortes. Lo ves funcionando y lo aplicas igual a tu producto.</p>',
    '<h3>16 minutos. A propósito.</h3><p>Podríamos haber grabado 20 horas para que parezca más. Hicimos lo contrario: recortamos hasta dejar solo lo que te sirve. En el video ves cómo se crea un anuncio de principio a fin, sin cortes. El resto lo aprendes creando, con tu producto y con tu IA de guía, todo el tiempo que necesites.</p>')

# 3) «No vas a estar solo»: título y primer párrafo
uno('<h2 id="nov-ia-t">No vas a estar solo: <em>la IA te enseña el método mientras lo usas.</em></h2>',
    '<h2 id="nov-ia-t">No se aprende mirando. <em>Se aprende creando.</em></h2>')
m = re.search(r'<p class="nov-baj">El método trae instrucciones para la IA que lo lee\..*?</p>', t)
if not m: sys.exit('FRENO: no encuentro el primer párrafo de «No vas a estar solo»')
t = t[:m.start()] + '<p class="nov-baj">Un curso te da horas de clases con el producto de otro. Aquí tu IA lee el método y te lo enseña con el tuyo: paso a paso, explicándote qué hace y por qué, y respondiendo cada duda las veces que necesites, hasta que lo haces solo.</p>' + t[m.end():]

# 4) Bloque de precio: «Incluido» en cada ítem y ancla real
for v in ('318', '221', '27', '500'):
    uno('<span class="nov-val">USD %s</span>' % v, '<span class="nov-val inc">Incluido</span>', 2 if v == '27' else 1)
uno('<div class="stack-total nov-total"><span>Valor total</span><b><s data-of="ob">USD 620</s><s data-of="nv">USD 1.093</s></b></div>',
    '<style>.nov-ancla{margin:0;padding:16px 0;border-top:1px solid var(--ink);border-bottom:1px solid var(--line);color:var(--ink);text-align:center;font:600 clamp(16px,2.4vw,19px)/1.4 var(--sans)}.nov-ancla span{display:block;font-weight:500;opacity:.85}.nov-ancla b{display:block;margin-top:4px;font-weight:700}html.of-bf .nov-ancla{order:1;border-top-color:rgba(239,233,220,.18)}</style>'
    '<div class="nov-ancla"><span>Lo que nos costó aprenderlo: más de USD 24.000 en anuncios reales.</span><b>Lo que pagas tú: USD <i style="font-style:normal" data-ancla-p>67</i>, una sola vez.</b></div>'
    '<script>!function(){var o=window.ssOferta,p=window.ssPrecio||(o&&o.precio);if(p)[].forEach.call(document.querySelectorAll("[data-ancla-p]"),function(e){e.textContent=p})}()</script>')
uno('<p class="nov-chip-ahorro" data-of="nv">Te ahorras USD <span class="nov-ahorro-n">1.026</span></p>', '')
uno('o=1093,', 'o=+e.regular||87,')  # la cuenta animada del precio ya no arranca en el «valor» inventado

# 5) Preguntas frecuentes: la nueva va primera y se dejan 8 visibles
uno('<h2>Preguntas frecuentes.</h2> <details>',
    '<h2>Preguntas frecuentes.</h2> <details><summary>¿Es un curso? ¿Cuánto dura el video?</summary><p>No es un curso de horas de clases. El video dura 16 minutos y muestra un anuncio creado de principio a fin, sin cortes. El valor está en los archivos: tu IA los lee y te enseña el método paso a paso con tu producto, todo el tiempo que necesites. Tu primer anuncio sale en unos 15 minutos. Y el método se sigue actualizando: las mejoras te llegan sin pagar de nuevo.</p></details><details>')
FAQ_JS = ('<script>!function(){var w=document.querySelector(".faq-wrap");if(!w)return;var d=[].slice.call(w.querySelectorAll(":scope>details")).filter(function(e){return e.offsetParent!==null}),M=8;'
          'if(d.length<=M+1)return;var b=document.createElement("button");b.type="button";b.className="btn faq-mas";b.textContent="Ver más preguntas";b.setAttribute("aria-expanded","false");'
          'd.slice(M).forEach(function(e){e.classList.add("faq-oculta");e.hidden=!0});'
          'b.addEventListener("click",function(){d.slice(M).forEach(function(e){e.hidden=!1;e.classList.remove("faq-oculta")});b.remove()});'
          'd[d.length-1].insertAdjacentElement("afterend",b)}()</script>'
          '<style>.faq-mas{display:block;margin:22px auto 0;cursor:pointer}</style>')
uno('</details> </div> </section> <', '</details> </div> </section>' + FAQ_JS + ' <', 1) if t.count('</details> </div> </section> <') == 1 else sys.exit('FRENO: cierre de FAQ')

# 6) Actualizaciones como prueba
uno('<li>Actualizaciones incluidas y soporte humano cuando lo necesites.</li>',
    '<li>Se actualiza. Desde que salió ya sumó la IA que te enseña con tu producto, el Asistente de personalización y el Método avanzado con Claude. Cada mejora te llega sin pagar de nuevo.</li>')

for s, n in antes.items():
    if t.count(s) != n:
        sys.exit('FRENO: cambió el seguimiento o el pago: %s' % s)
open('index.html', 'wb').write((b'\xef\xbb\xbf' if bom else b'') + t.encode('utf-8'))
print('ok: index.html · BOM', bom)
