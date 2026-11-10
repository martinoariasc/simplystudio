# -*- coding: utf-8 -*-
"""Suma el bloque «Qué es» a index.html, entre la portada y «Tu problema».

Brief: estrategia/sistema-de-venta-09-11/landing-que-es/brief-reconstruido.md (09/11/2026).
Frena sin escribir nada si:
  - el punto de inserción no aparece exactamente una vez;
  - el bloque ya está (id="que-es");
  - cambia la cantidad de cualquiera de las marcas de seguimiento (píxel, Google Ads, InitiateCheckout, ofertas).
Conserva el BOM UTF-8 del archivo.

Uso: python _armar-que-es.py [ruta/index.html]
"""
import sys
from pathlib import Path

RUTA = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name('index.html')
BOM = b'\xef\xbb\xbf'
ANCLA = '<section data-esc="Tu problema" class="pain">'
CUIDAR = ['1448725857302388', 'AW-18441137893', 'InitiateCheckout', '1tbcugw1', '3hjxp67m',
          "fbq('init'", 'fbq("init"', 'ssTrack', 'pay.hotmart.com']

CSS = (
    '.nov-que-es{padding-bottom:clamp(64px,9vw,128px)}'
    '.nov-que-es .nov-cab{max-width:940px}'
    '.nov-que-es .nov-cab .eyebrow{justify-content:center}'
    '.nov-que-es h2{font-size:clamp(34px,5.4vw,74px);line-height:1.02;text-wrap:balance}'
    '.nov-que-es h2 em{display:inline-block}'
    '.nov-que-es .nov-baj{max-width:50ch;text-wrap:pretty}'
    '.nov-qe-rot{margin:0 0 18px;font:500 11px/1.3 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--forest)}'
    # Cómo se usa: foto del pack + 3 pasos
    '.nov-qe-uso{display:grid;grid-template-columns:minmax(0,1fr);gap:28px;max-width:1080px;margin:clamp(36px,5vw,72px) auto 0;align-items:center}'
    '.nov-qe-foto{margin:0;border-radius:22px;overflow:hidden;aspect-ratio:4/3;background:var(--paper-2);box-shadow:0 40px 80px -56px rgba(20,20,16,.55)}'
    '.nov-qe-foto img{width:100%;height:100%;object-fit:cover}'
    '.nov-qe-pasos ol{list-style:none;margin:0;padding:0}'
    '.nov-qe-pasos li{position:relative;display:grid;grid-template-columns:44px minmax(0,1fr);column-gap:16px;padding-bottom:26px}'
    '.nov-qe-pasos li:last-child{padding-bottom:0}'
    '.nov-qe-pasos li::before{content:"";position:absolute;left:21.5px;top:52px;bottom:8px;width:1px;background:var(--line-strong)}'
    '.nov-qe-pasos li:last-child::before{content:none}'
    '.nov-qe-n{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--forest) 45%,transparent);color:var(--forest);font:400 23px/1 var(--serif)}'
    '.nov-qe-pasos b{display:block;padding-top:7px;font:400 clamp(24px,2.3vw,30px)/1.1 var(--serif);letter-spacing:-.015em;color:var(--ink)}'
    '.nov-qe-pasos li p{margin:6px 0 0;max-width:46ch;font-size:16px;line-height:1.55;color:var(--ink-2)}'
    # Lo que cambia para ti: 4 piezas
    '.nov-qe-cambia{max-width:1080px;margin:clamp(52px,6.5vw,96px) auto 0}'
    '.nov-qe-cambia .nov-qe-rot{text-align:center}'
    '.nov-qe-gana{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:minmax(0,1fr);gap:12px}'
    '.nov-qe-gana li::before{content:"";display:block;width:28px;height:2px;margin-bottom:16px;border-radius:2px;background:var(--forest)}'
    '.nov-qe-gana b{display:block;font:400 clamp(25px,2.2vw,30px)/1.08 var(--serif);letter-spacing:-.015em;color:var(--ink)}'
    '.nov-qe-gana p{margin:8px 0 0;font-size:15.5px;line-height:1.55;color:var(--ink-2)}'
    # Para quién, objeciones y botón
    '.nov-qe-pie{max-width:880px;margin:clamp(48px,6vw,84px) auto 0;text-align:center}'
    '.nov-qe-para{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:8px}'
    '.nov-qe-para li{padding:10px 16px;border:1px solid var(--line-strong);border-radius:999px;font-size:14.5px;line-height:1.2;color:var(--ink);background:color-mix(in srgb,currentColor 3%,transparent)}'
    '.nov-qe-obj{list-style:none;margin:28px 0 0;padding:0;display:inline-grid;justify-items:start;gap:10px;text-align:left}'
    '.nov-qe-obj li{display:inline-flex;align-items:center;gap:9px;font-size:15px;line-height:1.35;color:var(--ink-2)}'
    '.nov-qe-obj li::before{content:"";flex:none;width:6px;height:6px;border-radius:50%;background:var(--forest)}'
    '.nov-qe-cta{margin-top:30px}'
    '@media(min-width:620px){.nov-qe-gana{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.nov-qe-para{max-width:540px;margin-inline:auto}.nov-qe-obj{grid-template-columns:auto auto;column-gap:32px}}'
    '@media(min-width:900px){.nov-qe-para{max-width:none}.nov-qe-obj{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 24px}}'
    '@media(min-width:720px){.nov-qe-uso{grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:clamp(32px,5.5vw,84px)}.nov-qe-foto{aspect-ratio:1/1}}'
    '@media(min-width:1000px){.nov-qe-pasos li{padding-bottom:36px}.nov-qe-pasos li p{font-size:17px}}'
    '@media(min-width:1100px){.nov-qe-gana{grid-template-columns:repeat(4,minmax(0,1fr))}}'
)

FLECHA = ('<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" '
          'stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>')

PASOS = [
    ('Descargas el pack', 'Llega a tu correo apenas compras. Acceso inmediato.'),
    ('Lo arrastras a tu ChatGPT o Claude', 'No instalas nada ni necesitas saber diseñar: funciona con la IA que ya usas.'),
    ('Le das la foto de tu producto', 'Tu IA te guía paso a paso y crea contigo imágenes de marca grande para tus anuncios, tu Instagram y tu página web.'),
]
GANAS = [
    ('Ahorras tiempo', 'Lo que te llevaba una tarde en Photoshop o Canva, ahora es una instrucción.'),
    ('Ahorras dinero', 'Una agencia cobra miles de dólares por una campaña. Esto lo pagas una vez y es tuyo para siempre.'),
    ('Tu marca vale más', 'Imágenes que dan confianza hacen que tu producto se vea como lo que vale.'),
    ('Ganas una habilidad', 'Si eres diseñador, community manager o tienes una agencia, entregas un trabajo de otro nivel.'),
]
PARA = ['Tiendas online', 'Marcas', 'Emprendedores', 'Diseñadores', 'Agencias', 'Community managers']
OBJ = ['Sin saber diseñar', 'Para cualquier producto o servicio', 'Pago único', '7 días de garantía']

BLOQUE = (
    '<section class="nov-sec nov-que-es" id="que-es" data-esc="Qué es" aria-labelledby="nov-qe-t">'
    '<style>' + CSS + '</style>'
    ' <div class="shell">'
    ' <div class="nov-cab reveal"><span class="eyebrow">Qué es el Método Prompt Ads</span>'
    '<h2 id="nov-qe-t">Un pack de archivos que convierte a tu IA en <em>un genio de la publicidad.</em></h2>'
    '<p class="nov-baj">Como tener una agencia creativa de primer nivel dentro de tu ChatGPT o Claude, sin pagar miles de dólares por ella.</p></div>'
    ' <div class="nov-qe-uso reveal">'
    '<figure class="nov-qe-foto"><picture><source media="(max-width:760px)" srcset="assets/pack/00-empieza-aqui-600.webp?v=lino">'
    '<img decoding="async" src="assets/pack/00-empieza-aqui.webp?v=lino" width="900" height="900" loading="lazy" '
    'alt="El libro Empieza aquí del Método Prompt Ads, en tapa de lino gris, sobre un sillón de cuerda trenzada"></picture></figure>'
    '<div class="nov-qe-pasos"><p class="nov-qe-rot">Cómo se usa</p><ol>'
    + ''.join('<li><span class="nov-qe-n" aria-hidden="true">%d</span><div><b>%s</b><p>%s</p></div></li>' % (i + 1, t, d)
              for i, (t, d) in enumerate(PASOS))
    + '</ol></div></div>'
    ' <div class="nov-qe-cambia reveal"><p class="nov-qe-rot">Lo que cambia para ti</p><ul class="nov-qe-gana">'
    + ''.join('<li class="nov-vidrio"><b>%s</b><p>%s</p></li>' % (t, d) for t, d in GANAS)
    + '</ul></div>'
    ' <div class="nov-qe-pie reveal"><p class="nov-qe-rot">Para quién</p><ul class="nov-qe-para">'
    + ''.join('<li>%s</li>' % p for p in PARA)
    + '</ul><ul class="nov-qe-obj">'
    + ''.join('<li>%s</li>' % o for o in OBJ)
    + '</ul><div class="nov-qe-cta"><a class="btn" href="#precio">Quiero crear mis imágenes ' + FLECHA + '</a></div></div>'
    ' </div> </section> '
)


def main():
    crudo = RUTA.read_bytes()
    if not crudo.startswith(BOM):
        sys.exit('FRENO: index.html no empieza con BOM UTF-8; no lo toco.')
    html = crudo[len(BOM):].decode('utf-8')

    if 'id="que-es"' in html:
        sys.exit('FRENO: el bloque «Qué es» ya está en la página.')
    n = html.count(ANCLA)
    if n != 1:
        sys.exit('FRENO: el punto de inserción aparece %d veces (tiene que ser 1).' % n)

    antes = {k: html.count(k) for k in CUIDAR}
    nuevo = html.replace(ANCLA, BLOQUE + ANCLA, 1)
    despues = {k: nuevo.count(k) for k in CUIDAR}
    cambios = {k: (antes[k], despues[k]) for k in CUIDAR if antes[k] != despues[k]}
    if cambios:
        sys.exit('FRENO: cambió el seguimiento: %r' % cambios)
    if '\n' in BLOQUE:
        sys.exit('FRENO: el bloque tiene saltos de línea (la página es de una sola línea).')

    RUTA.write_bytes(BOM + nuevo.encode('utf-8'))
    print('OK: bloque «Qué es» sumado (%d caracteres). Seguimiento igual: %s'
          % (len(BLOQUE), ', '.join('%s=%d' % (k, v) for k, v in antes.items())))


if __name__ == '__main__':
    main()
