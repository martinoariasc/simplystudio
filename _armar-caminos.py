#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Arma las 3 landings por perfil (agencias, disenadores, negocios) a partir de index.html
(la landing general en vivo) y del JSON de textos.

Uso:   python _armar-caminos.py [ruta-al-copy-caminos.json]
Salida: agencias.html, disenadores.html, negocios.html (en la misma carpeta que index.html).

Si cambia la landing general y algun anclaje ya no se encuentra, el script FALLA con un
mensaje claro y no escribe nada (asi nunca queda una pagina rota).
Solo libreria estandar. Lectura y escritura en UTF-8 conservando BOM y saltos CRLF.
"""
import html as htmllib
import json
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(AQUI, 'index.html')
COPY_DEFECTO = os.path.normpath(os.path.join(
    AQUI, '..', 'estrategia', 'caminos-por-perfil-26-11', 'copy-caminos.json'))
DOMINIO = 'https://simplystudioai.com'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
        'param', 'source', 'track', 'wbr', 'path', 'circle', 'rect', 'line', 'polyline',
        'polygon', 'use', 'stop'}


class Falla(Exception):
    pass


# ---------------------------------------------------------------- utilidades HTML
TOKEN = re.compile(
    r'<!--.*?-->|<script\b.*?</script\s*>|<style\b.*?</style\s*>|'
    r'<(/?)([a-zA-Z][\w:-]*)((?:[^>"\']|"[^"]*"|\'[^\']*\')*?)(/?)>', re.S)


def texto(h):
    """Texto visible normalizado (sin etiquetas, entidades resueltas, espacios colapsados)."""
    h = re.sub(r'<(script|style)\b.*?</\1\s*>', ' ', h, flags=re.S)
    h = re.sub(r'</?(?:em|strong|b|i|span|a|u|small|mark)(?![\w-])[^>]*>', '', h)
    h = re.sub(r'<[^>]+>', ' ', h)
    h = htmllib.unescape(h).replace(' ', ' ')
    return re.sub(r'\s+', ' ', h).strip()


def elemento(s, pos):
    """Dado el inicio de una etiqueta de apertura en `pos`, devuelve
    (ini, fin, ini_interno, fin_interno) con anidado balanceado (ignora script/style/comentarios)."""
    m0 = TOKEN.match(s, pos)
    if not m0 or m0.group(2) is None or m0.group(1):
        raise Falla('no hay etiqueta de apertura en la posicion %d' % pos)
    tag = m0.group(2).lower()
    if tag in VOID or m0.group(4):
        return pos, m0.end(), m0.end(), m0.end()
    prof = 1
    for m in TOKEN.finditer(s, m0.end()):
        if m.group(2) is None or m.group(2).lower() != tag:
            continue
        if m.group(1):
            prof -= 1
            if prof == 0:
                return pos, m.end(), m0.end(), m.start()
        elif not m.group(4):
            prof += 1
    raise Falla('etiqueta <%s> sin cierre' % tag)


def abrir_tags(s, tag, clase=None, ini=0, fin=None, attr=None):
    """Posiciones de las etiquetas de apertura <tag> con la clase (token) o el atributo pedido."""
    fin = len(s) if fin is None else fin
    sal = []
    for m in TOKEN.finditer(s, ini, fin):
        if m.group(2) is None or m.group(1) or m.group(2).lower() != tag:
            continue
        attrs = m.group(3)
        if clase is not None:
            mc = re.search(r'\bclass\s*=\s*"([^"]*)"', attrs)
            if not mc or clase not in mc.group(1).split():
                continue
        if attr is not None:
            k, v = attr
            if not re.search(r'\b%s\s*=\s*"%s"' % (re.escape(k), re.escape(v)), attrs):
                continue
        sal.append(m.start())
    return sal


def hijos_directos(s, ini_int, fin_int, tag):
    """Elementos <tag> hijos directos (a un solo nivel) dentro del rango interno."""
    sal, pos = [], ini_int
    while pos < fin_int:
        m = TOKEN.search(s, pos, fin_int)
        if not m:
            break
        if m.group(2) is None or m.group(1):
            pos = m.end()
            continue
        if m.group(2).lower() == tag:
            e = elemento(s, m.start())
            sal.append(e)
            pos = e[1]
        elif m.group(2).lower() in VOID or m.group(4):
            pos = m.end()
        else:
            e = elemento(s, m.start())
            pos = e[1]  # saltar subarbol que no es del tag
    return sal


def uno(s, tag, clase=None, ini=0, fin=None, attr=None, donde='', cond=None):
    """Un unico elemento (o el primero que cumple cond(texto)). Falla si no esta."""
    cand = abrir_tags(s, tag, clase, ini, fin, attr)
    sel = []
    for p in cand:
        e = elemento(s, p)
        if cond is None or cond(texto(s[e[2]:e[3]])):
            sel.append(e)
    if not sel:
        raise Falla('ANCLAJE NO ENCONTRADO: <%s%s%s> %s' % (
            tag, '.' + clase if clase else '', ' ' + str(attr) if attr else '', donde))
    return sel[0]


def seccion(s, esc):
    """(ini, fin) de la <section data-esc="esc"> completa."""
    cand = abrir_tags(s, 'section', attr=('data-esc', esc))
    if not cand:
        raise Falla('ANCLAJE NO ENCONTRADO: <section data-esc="%s">' % esc)
    e = elemento(s, cand[0])
    return e[0], e[1]


def poner_interno(s, e, nuevo):
    return s[:e[2]] + nuevo + s[e[3]:]


def espera(real, esperado, donde):
    r, x = texto(real), texto(esperado)
    if x not in r:
        raise Falla('ANCLAJE CAMBIO en %s.\n   esperaba (texto): %s\n   encontre (texto): %s' % (
            donde, x[:160], r[:160]))


def edita_seccion(s, esc, fn):
    a, b = seccion(s, esc)
    return s[:a] + fn(s[a:b]) + s[b:]


# ---------------------------------------------------------------- transformaciones
def hero(sec, c, ancla):
    h = ancla['hero']
    e = uno(sec, 'span', 'nov-eye-largo', donde='(hero, eyebrow)')
    espera(sec[e[2]:e[3]], h['eyebrow_buscar'], 'hero eyebrow')
    sec = poner_interno(sec, e, c['hero']['eyebrow'])
    e = uno(sec, 'h1', 'nov-h1', donde='(hero, h1)')
    espera(sec[e[2]:e[3]], h['h1_buscar'], 'hero h1')
    sec = poner_interno(sec, e, c['hero']['h1'])
    b = h['parrafo_buscar']
    e = uno(sec, 'p', 'nov-bajada', donde='(hero, parrafo)',
            cond=lambda t: t.startswith(texto(b)))
    return poner_interno(sec, e, c['hero']['parrafo'])


CSS_HERO_UN_BOTON = (
    '<style id="hero-un-boton">'
    'html.of-bf #resultado .nov-hero-cta{display:none!important}'
    '#resultado .nov-hero-desc .bf-portada{margin:clamp(14px,2vw,20px) auto 0!important}'
    '#resultado .nov-hero-desc .bf-portada .bf-texto{display:none!important}'
    '</style>')


def hero_un_boton(sec, c):
    """Martino 26/11 noche: titulo -> imagenes pasando -> «Imagina...» -> «Metodo Prompt Ads para <perfil>»
    -> UN solo boton (el de «Conseguir el Metodo» con los medios de pago). La linea del perfil sale de arriba."""
    e = uno(sec, 'span', 'nov-eye-largo', donde='(hero, eyebrow)')
    sec = sec[:e[0]] + sec[e[1]:]
    e = uno(sec, 'p', 'nov-hero-toca', donde='(hero, linea del metodo)')
    sec = poner_interno(sec, e, c['hero']['toca'])
    b = uno(sec, 'div', 'bf-portada', donde='(hero, boton de arriba)')
    bloque = sec[b[0]:b[1]]
    sec = sec[:b[0]] + sec[b[1]:]
    e = uno(sec, 'p', 'nov-hero-toca', donde='(hero, linea del metodo)')
    return sec[:e[1]] + CSS_HERO_UN_BOTON + bloque + sec[e[1]:]


def que_es(sec, c, ancla):
    buscar = ancla['_comun']['que_es_tarjetas_buscar']
    nuevas = c['que_es_tarjetas']
    if len(buscar) != 4 or len(nuevas) != 4:
        raise Falla('que_es_tarjetas debe traer 4 tarjetas y 4 anclajes')
    ul = uno(sec, 'ul', 'nov-qe-gana', donde='(Que es, tarjetas)')
    for titulo, nueva in zip(buscar, nuevas):
        # se vuelve a ubicar la lista en cada vuelta (las posiciones cambian al reemplazar)
        ul = uno(sec, 'ul', 'nov-qe-gana')
        li = None
        for e in hijos_directos(sec, ul[2], ul[3], 'li'):
            pb = abrir_tags(sec, 'b', None, e[2], e[3])
            if pb and texto(sec[elemento(sec, pb[0])[2]:elemento(sec, pb[0])[3]]) == titulo:
                li = e
        if li is None:
            raise Falla('ANCLAJE NO ENCONTRADO: tarjeta de "Que es" con el titulo "%s"' % titulo)
        inner = sec[li[2]:li[3]]
        pb = uno(inner, 'b', donde='(Que es, titulo)')
        inner = poner_interno(inner, pb, nueva['titulo'])
        pp = uno(inner, 'p', donde='(Que es, texto)')
        inner = poner_interno(inner, pp, nueva['texto'])
        sec = sec[:li[2]] + inner + sec[li[3]:]
    # quitar el bloque "Para quien" (titulo + etiquetas de perfiles + las 2 de producto)
    pie = uno(sec, 'div', 'nov-qe-pie', donde='(Que es, bloque Para quien)')
    p_rot = uno(sec, 'p', 'nov-qe-rot', pie[0], pie[1], donde='(Que es, titulo Para quien)',
                cond=lambda t: t == 'Para quién')
    sec = sec[:p_rot[0]] + sec[p_rot[1]:]
    pie = uno(sec, 'div', 'nov-qe-pie')
    ul_para = uno(sec, 'ul', 'nov-qe-para', pie[0], pie[1], donde='(Que es, etiquetas de perfiles)')
    sec = sec[:ul_para[0]] + sec[ul_para[1]:]
    pie = uno(sec, 'div', 'nov-qe-pie')
    ul_obj = uno(sec, 'ul', 'nov-qe-obj', pie[0], pie[1], donde='(Que es, etiquetas de producto)')
    quitar = ['Sin saber diseñar', 'Para cualquier producto o servicio']
    hallados = 0
    for e in reversed(hijos_directos(sec, ul_obj[2], ul_obj[3], 'li')):
        if texto(sec[e[2]:e[3]]) in quitar:
            sec = sec[:e[0]] + sec[e[1]:]
            hallados += 1
    if hallados != len(quitar):
        raise Falla('ANCLAJE NO ENCONTRADO: etiquetas %s en la lista nov-qe-obj' % quitar)
    return sec


def dolor(sec, c):
    d = c['dolor']
    e = uno(sec, 'h2', 'nov-dolor-t', donde='(Tu problema, h2)')
    espera(sec[e[2]:e[3]], 'a mano', 'Tu problema h2')
    sec = poner_interno(sec, e, d['h2'])
    e = uno(sec, 'ul', 'nov-dolor', donde='(Tu problema, lista)')
    espera(sec[e[2]:e[3]], 'Photoshop', 'Tu problema lista')
    sec = poner_interno(sec, e, ''.join('<li>%s</li>' % li for li in d['lista']))
    e = uno(sec, 'div', 'truth', donde='(Tu problema, truth)')
    espera(sec[e[2]:e[3]], 'Queremos ayudarte a lograrlo', 'Tu problema truth')
    return poner_interno(sec, e, d['verdad'])


def ia_no_sabe(sec, c, ancla):
    buscar = ancla['ia_no_sabe_parrafo']['buscar']
    e = uno(sec, 'p', donde='(La IA no lo sabe todo, parrafo)',
            cond=lambda t: t.startswith(texto(buscar)[:40]))
    espera(sec[e[2]:e[3]], buscar, 'La IA no lo sabe todo')
    # el parrafo trae dos frases; el JSON da el parrafo completo nuevo
    return poner_interno(sec, e, c['ia_no_sabe_parrafo']['nuevo'])


def como_funciona(sec, c, ancla):
    buscar = ancla['como_funciona_intro']['buscar']
    e = uno(sec, 'p', 'nov-baj', donde='(Como funciona, parrafo)',
            cond=lambda t: t.startswith('La IA ya hace el trabajo de un estudio creativo'))
    inner = sec[e[2]:e[3]]
    if '<' in inner:
        raise Falla('Como funciona: el parrafo ahora trae etiquetas; revisar el anclaje')
    plano = htmllib.unescape(inner)
    if buscar not in plano:
        raise Falla('ANCLAJE NO ENCONTRADO en "Como funciona": ' + buscar)
    return poner_interno(sec, e, plano.replace(buscar, c['como_funciona_intro']['nuevo']))


def reordenar_testimonios(sec, primero, ocultar):
    """Dentro de la tira (.m-track): primero los nombrados (en orden), luego el resto; quita los ocultos."""
    pistas = abrir_tags(sec, 'div', 'm-track')
    if not pistas:
        raise Falla('ANCLAJE NO ENCONTRADO: .m-track de testimonios')
    tr = elemento(sec, pistas[0])
    tarjetas = hijos_directos(sec, tr[2], tr[3], 'article')
    items = []
    for e in tarjetas:
        h = sec[e[0]:e[1]]
        mn = re.search(r'<div class="tcard-id"><b>(.*?)</b>', h, re.S)
        items.append((texto(mn.group(1)) if mn else '', h))
    nombres = [n for n, _ in items]
    for n in primero + ocultar:
        pass
    ordenadas = []
    for n in primero:
        for nom, h in items:
            if nom == n and n not in ocultar:
                ordenadas.append((nom, h))
    resto = [(nom, h) for nom, h in items if nom not in primero and nom not in ocultar]
    final = ordenadas + resto
    return sec[:tr[2]] + ' ' + ' '.join(h for _, h in final) + ' ' + sec[tr[3]:], nombres


def preguntas(sec, c, camino):
    wrap = uno(sec, 'div', 'faq-wrap', donde='(Preguntas)')
    dets = hijos_directos(sec, wrap[2], wrap[3], 'details')
    items = []
    for e in dets:
        h = sec[e[0]:e[1]]
        ms = re.search(r'<summary>(.*?)</summary>', h, re.S)
        items.append((texto(ms.group(1)), h))
    existentes = [q for q, _ in items]
    for q in c['preguntas_primero']:
        if q not in existentes:
            raise Falla('ANCLAJE NO ENCONTRADO: pregunta "%s"' % q)
    primero = [h for q in c['preguntas_primero'] for qq, h in items if qq == q]
    resto = [h for qq, h in items if qq not in c['preguntas_primero']]
    nuevo = primero + resto
    # preguntas nuevas: se clona el marcado de una pregunta existente (mismo abrir/cerrar)
    molde = items[0][1]
    mm = re.match(r'(<details[^>]*>\s*)<summary>.*?</summary>(\s*)<p>.*?</p>(\s*</details>)', molde, re.S)
    if c.get('preguntas_nuevas') and not mm:
        raise Falla('ANCLAJE CAMBIO: las preguntas ya no tienen el formato <details><summary/><p/></details>')
    nuevas = []
    for pn in c.get('preguntas_nuevas', []):
        nuevas.append('%s<summary>%s</summary>%s<p>%s</p>%s' % (
            mm.group(1), htmllib.escape(pn['pregunta'], quote=False), mm.group(2),
            htmllib.escape(pn['respuesta'], quote=False), mm.group(3)))
    nuevo = nuevas + nuevo
    if 'pregunta_reescrita' in c:
        pr = c['pregunta_reescrita']
        hecho = False
        for i, h in enumerate(nuevo):
            ms = re.search(r'<summary>(.*?)</summary>', h, re.S)
            if texto(ms.group(1)) == pr['buscar']:
                if texto(pr['respuesta_buscar']) not in texto(h):
                    raise Falla('ANCLAJE CAMBIO: la respuesta de "%s" ya no dice: %s' % (
                        pr['buscar'], pr['respuesta_buscar']))
                nuevo[i] = h.replace(ms.group(0), '<summary>%s</summary>' % pr['pregunta'], 1)
                hecho = True
        if not hecho:
            raise Falla('ANCLAJE NO ENCONTRADO: pregunta a reescribir "%s"' % pr['buscar'])
    # reconstruir conservando lo que hay entre details (espacios/botones)
    out = sec[:dets[0][0]]
    for i, h in enumerate(nuevo):
        out += h
        if i + 1 < len(nuevo):
            out += sec[dets[i][1]:dets[i + 1][0]] if i + 1 < len(dets) else ' '
    out += sec[dets[-1][1]:]
    return out


def cierre(sec, c, ancla):
    cam = abrir_tags(sec, 'article', 'nov-camino')
    if len(cam) != 2:
        raise Falla('ANCLAJE NO ENCONTRADO: los dos <article class="nov-camino"> del cierre (hay %d)' % len(cam))
    for orden, (k, kb) in enumerate((('uno', 'uno_buscar'), ('dos', 'dos_buscar'))):
        cam = abrir_tags(sec, 'article', 'nov-camino')
        art = elemento(sec, cam[orden])
        p = uno(sec, 'p', ini=art[2], fin=art[3], donde='(cierre %s)' % k)
        espera(sec[p[2]:p[3]], ancla['cierre'][kb], 'cierre ' + k)
        sec = poner_interno(sec, p, c['cierre'][k])
    return sec


def head(s, c, camino):
    camino = c.get('ruta', '/' + camino).lstrip('/')
    t = uno(s, 'title', donde='(head)')
    s = poner_interno(s, t, htmllib.escape(c['title'], quote=False))
    esc = lambda v: htmllib.escape(v, quote=True)
    md = re.search(r'<meta name="description" content="[^"]*">', s)
    if not md:
        raise Falla('ANCLAJE NO ENCONTRADO: <meta name="description">')
    extra = ('<meta name="description" content="%s">'
             '<meta property="og:title" content="%s">'
             '<meta property="og:description" content="%s">'
             '<meta name="robots" content="noindex,follow">'
             '<link rel="canonical" href="%s/%s">') % (
        esc(c['description']), esc(c['title']), esc(c['description']), DOMINIO, camino)
    # si la general ya trajera og: o canonical, se reemplazan para no duplicar
    s = re.sub(r'<meta property="og:(title|description)"[^>]*>', '', s)
    s = re.sub(r'<link rel="canonical"[^>]*>', '', s)
    return s[:md.start()] + extra + s[md.end():]


# ---------------------------------------------------------------- armado por camino
def versus(sec, nombre):
    """Cambia el par de la hamburguesa por el par `nombre` (assets/nov/versus-<nombre>-feo|premium*.webp)."""
    if nombre != 'bolso':
        raise Falla('versus: solo hay textos alt para "bolso"')
    for t in ('feo', 'premium'):
        for suf in ('', '-640'):
            f = os.path.join(AQUI, 'assets', 'nov', 'versus-%s-%s%s.webp' % (nombre, t, suf))
            if not os.path.exists(f):
                raise Falla('FALTA la imagen ' + f)
        if 'versus-burguer-%s' % t not in sec:
            raise Falla('ANCLAJE NO ENCONTRADO: versus-burguer-%s en "La IA no lo sabe todo"' % t)
        sec = sec.replace('versus-burguer-%s' % t, 'versus-%s-%s' % (nombre, t))
    cambios = [
        (r'alt="Anuncio genérico de la hamburguesa[^"]*"', 'alt="Anuncio genérico de un bolso"'),
        (r'alt="Anuncio premium de la misma hamburguesa[^"]*"', 'alt="Anuncio premium del mismo bolso"'),
        (r'aria-label="Ampliar el anuncio genérico de la hamburguesa"', 'aria-label="Ampliar el anuncio genérico del bolso"'),
        (r'aria-label="Ampliar el anuncio premium de la hamburguesa"', 'aria-label="Ampliar el anuncio premium del bolso"'),
    ]
    for pat, nuevo in cambios:
        sec, n = re.subn(pat, nuevo, sec)
        if n != 1:
            raise Falla('ANCLAJE NO ENCONTRADO (versus): ' + pat)
    resto = texto(sec) + ' '.join(re.findall(r'(?:alt|aria-label)="[^"]*"', sec))
    if re.search(r'hambur', resto, re.I):
        raise Falla('Quedo la palabra "hamburguesa" en "La IA no lo sabe todo"; revisar los textos')
    return sec


def cinta(sec, nums, eager, invertir, donde):
    """Deja en la cinta solo las piezas `nums` (clonando el marcado de una pieza existente)."""
    pistas = abrir_tags(sec, 'div', 'v2-gal-set')
    if not pistas:
        raise Falla('ANCLAJE NO ENCONTRADO: .v2-gal-set en ' + donde)
    st = elemento(sec, pistas[0])
    figs = hijos_directos(sec, st[2], st[3], 'figure')
    if not figs:
        raise Falla('ANCLAJE NO ENCONTRADO: piezas <figure> en la cinta de ' + donde)
    molde = sec[figs[0][0]:figs[0][1]]
    if not re.search(r's-cinta/s-\d+\.webp', molde):
        raise Falla('ANCLAJE CAMBIO: las piezas de la cinta de %s ya no usan assets/s-cinta/s-NN.webp' % donde)
    orden = list(reversed(nums)) if invertir else list(nums)
    salida = []
    for i, n in enumerate(orden):
        nn = '%02d' % n
        if not os.path.exists(os.path.join(AQUI, 'assets', 's-cinta', 's-%s.webp' % nn)):
            raise Falla('FALTA la imagen assets/s-cinta/s-%s.webp' % nn)
        f = re.sub(r's-cinta/s-\d+\.webp', 's-cinta/s-%s.webp' % nn, molde)
        f = re.sub(r'loading="\w+"', 'loading="%s"' % ('eager' if i < eager else 'lazy'), f)
        salida.append(f)
    return sec[:st[2]] + ''.join(salida) + sec[st[3]:]


CSS_CAT = (
    '.cat-pares{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(30px,6vw,44px);max-width:1180px;'
    'margin:clamp(32px,4.5vw,56px) auto 0}'
    '.cat-par{min-width:0}'
    '.cat-nom{margin:0 0 12px;text-align:center;font:400 11px/1 var(--mono);letter-spacing:.2em;'
    'text-transform:uppercase;color:var(--muted)}'
    '.cat-duo{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;'
    'max-width:560px;margin:0 auto}'
    '.cat-fig{margin:0;min-width:0}'
    '.cat-img{display:block;width:100%;padding:0;border:0;aspect-ratio:4/5;border-radius:8px;overflow:hidden;'
    'background:var(--paper-2);cursor:zoom-in}'
    '.cat-img img{display:block;width:100%;height:100%;object-fit:cover}'
    '.cat-antes .cat-img{background:#fff;border:1px solid var(--line-strong)}'
    '.cat-antes .cat-img img{object-fit:contain}'
    '.cat-fig figcaption{margin-top:10px;text-align:center}'
    '.cat-tag{display:inline-block;padding:7px 11px;border-radius:999px;font:400 9.5px/1.2 var(--mono);'
    'letter-spacing:.12em;text-transform:uppercase}'
    '.cat-tag-a{color:var(--muted);border:1px solid var(--line-strong)}'
    '.cat-tag-d{color:var(--paper);background:var(--forest)}'
    '.cat-duo::after{content:"\\2192";position:absolute;left:50%;top:38%;width:30px;height:30px;'
    'transform:translate(-50%,-50%);border-radius:50%;display:grid;place-items:center;background:var(--forest);'
    'color:var(--paper);font:400 15px/1 var(--sans);box-shadow:0 6px 16px rgba(20,20,16,.28);z-index:2;'
    'pointer-events:none}'
    '@media(min-width:900px){.cat-pares{grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(18px,2.4vw,34px)}'
    '.cat-duo{gap:8px}.cat-tag{padding:6px 9px;letter-spacing:.08em}}'
)


def dims_webp(ruta):
    import struct
    d = open(ruta, 'rb').read(40)
    t = d[12:16]
    if t == b'VP8 ':
        return struct.unpack('<HH', d[26:30])
    if t == b'VP8L':
        v = struct.unpack('<I', d[21:25])[0]
        return (v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1
    if t == b'VP8X':
        return int.from_bytes(d[24:27], 'little') + 1, int.from_bytes(d[27:30], 'little') + 1
    raise Falla('formato webp desconocido: ' + ruta)


def bloque_catalogo(b):
    """Seccion nueva 'Del catalogo al anuncio' (se inserta despues de 'Tu problema')."""
    pares = []
    for f, a, nom in b['pares']:
        trozos = []
        for arch, clase, tag, tagc in ((f, 'cat-antes', b['etiqueta_antes'], 'cat-tag-a'),
                                       (a, 'cat-despues', b['etiqueta_despues'], 'cat-tag-d')):
            ruta = os.path.join(AQUI, 'assets', 'nov', arch)
            if not os.path.exists(ruta):
                raise Falla('FALTA la imagen assets/nov/' + arch)
            ancho, alto = dims_webp(ruta)
            grande = arch.replace('-f.webp', '-fg.webp').replace('-a.webp', '-ag.webp')
            if not os.path.exists(os.path.join(AQUI, 'assets', 'nov', grande)):
                grande = arch
            alt = '%s: %s' % (nom, 'foto de catálogo' if clase == 'cat-antes' else 'anuncio creado con el Método')
            trozos.append(
                '<figure class="cat-fig %s"><button class="zoomable cat-img" type="button" '
                'data-full="assets/nov/%s" aria-label="Ampliar: %s"><img src="assets/nov/%s" width="%d" '
                'height="%d" loading="lazy" decoding="async" alt="%s"></button>'
                '<figcaption><span class="cat-tag %s">%s</span></figcaption></figure>' % (
                    clase, grande, htmllib.escape(alt, quote=True), arch, ancho, alto,
                    htmllib.escape(alt, quote=True), tagc, htmllib.escape(tag, quote=False)))
        pares.append('<div class="cat-par"><p class="cat-nom">%s</p><div class="cat-duo">%s</div></div>' % (
            htmllib.escape(nom, quote=False), ''.join(trozos)))
    return ('<section class="nov-sec cat-sec" data-esc="Del catálogo al anuncio" aria-labelledby="cat-t">'
            '<style>' + CSS_CAT + '</style><div class="shell">'
            '<div class="nov-cab reveal"><h2 id="cat-t">' + b['titulo'] + '</h2><p class="nov-baj">' + b['texto'] +
            '</p></div><div class="cat-pares reveal">' + ''.join(pares) + '</div></div></section>')


# ---------------------------------------------------------------- dos caminos (Martino 26/11 noche)
# «Si quieres seguir así, perfecto… pero si quieres… aquí tienes el método», con una animación
# propia por perfil: tiendas = el feed que pasa de largo, dropshipping = la misma foto del
# proveedor en nueve tiendas, agencias = una tarde contra una tanda. Solo imágenes reales del sitio.
CSS_DC = r'''
.dc-sec{padding:clamp(56px,8vw,120px) 0;color:var(--ink);background:var(--paper)}
.dc-anim{position:relative;margin:clamp(30px,5vw,60px) auto 0;max-width:900px}
.dc-anim figure{margin:0;min-width:0}
.dc-lab{display:block;margin:0 0 14px;text-align:center;font:400 10px/1.2 var(--mono);letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.dc-lab-b{color:var(--forest)}
.dc-cap{margin:16px 0 0;text-align:center;font:400 clamp(18px,2vw,24px)/1.15 var(--serif);letter-spacing:-.01em;color:var(--ink)}
.dc-dos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(18px,5vw,64px);max-width:620px;margin-inline:auto}
.dc-scr{position:relative;overflow:hidden;aspect-ratio:2/3;border-radius:clamp(16px,2.6vw,26px);background:var(--white);box-shadow:0 0 0 clamp(4px,.7vw,7px) #050605,0 0 0 calc(clamp(4px,.7vw,7px) + 1px) var(--line-strong),0 34px 60px -30px rgba(0,0,0,.6)}
.dc-trk{display:flex;flex-direction:column;will-change:transform,opacity;animation:12s linear infinite paused;animation-timing-function:cubic-bezier(.7,0,.25,1)}
.dc-post{flex:none}
.dc-hd{aspect-ratio:100/12;display:flex;align-items:center;gap:5%;padding:0 6%}
.dc-hd i{width:9%;aspect-ratio:1;border-radius:50%;background:var(--line-strong)}
.dc-hd b{height:5px;width:36%;border-radius:3px;background:var(--line-strong)}
.dc-post img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover}
.dc-ac{aspect-ratio:100/13;display:flex;align-items:center;gap:6%;padding:0 6%}
.dc-ac svg{width:9%;height:auto;fill:none;stroke:var(--ink);stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round;overflow:visible}
.dc-ac svg:last-child{margin-left:auto}
.dc-ph-a .dc-trk{animation-name:dcA;animation-duration:6.4s}
.dc-ph-b .dc-trk{animation-name:dcB,dcF;animation-duration:6.4s}
.dc-like{transform-box:fill-box;transform-origin:center;animation:dcLike 6.4s infinite paused}
.dc-buy{position:absolute;left:50%;bottom:13%;z-index:2;padding:9px 15px;border-radius:999px;background:var(--ink);color:var(--paper);font:500 clamp(10px,1.3vw,13px)/1 var(--sans);letter-spacing:-.01em;white-space:nowrap;opacity:0;transform:translate(-50%,10px);box-shadow:0 10px 24px -10px rgba(20,20,16,.6);animation:dcBuy 6.4s infinite paused}
@keyframes dcA{0%,16%{transform:translateY(0)}22%,36%{transform:translateY(-20%)}42%,56%{transform:translateY(-40%)}62%,76%{transform:translateY(-60%)}82%,100%{transform:translateY(-80%)}}
@keyframes dcB{0%,14%{transform:translateY(0)}21%,30%{transform:translateY(-33.3333%);animation-timing-function:cubic-bezier(.12,.85,.22,1)}42%,100%{transform:translateY(-66.6667%)}}
@keyframes dcF{0%{opacity:0}4%,91%{opacity:1}97%,100%{opacity:0}}
@keyframes dcLike{0%,52%{fill:transparent;stroke:var(--ink);transform:scale(1)}56%{fill:#B8453B;stroke:#B8453B;transform:scale(1.3)}61%,100%{fill:#B8453B;stroke:#B8453B;transform:scale(1)}}
@keyframes dcBuy{0%,58%{opacity:0;transform:translate(-50%,10px) scale(.94)}64%{opacity:1;transform:translate(-50%,-3px) scale(1.03)}68%,90%{opacity:1;transform:translate(-50%,0) scale(1)}95%,100%{opacity:0;transform:translate(-50%,0) scale(1)}}
.dc-prov{max-width:420px}
.dc-g9{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(7px,1.5vw,12px)}
.dc-t{position:relative;aspect-ratio:4/5;border-radius:8px;background:#fff;box-shadow:0 0 0 1px var(--line-strong);overflow:hidden;opacity:0;animation:dcT 7.2s infinite paused;animation-delay:calc(var(--i)*70ms);animation-timing-function:cubic-bezier(.22,1,.36,1)}
.dc-t img{position:absolute;inset:0;width:100%;height:100%}
.dc-f{object-fit:contain;padding:9%}
.dc-p{object-fit:cover;opacity:0;animation:dcP 7.2s infinite paused;animation-delay:calc(var(--i)*70ms)}
.dc-t-c{z-index:2;animation-name:dcC}
.dc-caps{position:relative;min-height:3.2em;margin-top:22px}
.dc-caps .dc-cap{position:absolute;left:0;right:0;top:0;margin:0;opacity:0;animation:7.2s infinite paused;animation-timing-function:cubic-bezier(.22,1,.36,1)}
.dc-k1{animation-name:dcK1!important}.dc-k2{animation-name:dcK2!important}
@keyframes dcT{0%,3%{opacity:0;transform:translateY(10px)}10%,46%{opacity:1;transform:none}54%,86%{opacity:.22;transform:none}92%,100%{opacity:0;transform:none}}
@keyframes dcC{0%,3%{opacity:0;transform:translateY(10px)}10%,46%{opacity:1;transform:none;box-shadow:0 0 0 1px var(--line-strong)}54%{opacity:1;transform:scale(1.16);box-shadow:0 30px 60px -22px rgba(20,20,16,.55)}58%,86%{opacity:1;transform:scale(1.12);box-shadow:0 30px 60px -22px rgba(20,20,16,.55)}92%,100%{opacity:0;transform:scale(1.12)}}
@keyframes dcP{0%,47%{opacity:0}55%,100%{opacity:1}}
@keyframes dcK1{0%,6%{opacity:0;transform:translateY(6px)}12%,42%{opacity:1;transform:none}47%,100%{opacity:0;transform:none}}
@keyframes dcK2{0%,54%{opacity:0;transform:translateY(6px)}60%,86%{opacity:1;transform:none}91%,100%{opacity:0;transform:none}}
.dc-board{position:relative;aspect-ratio:1;border-radius:16px;background:var(--white);box-shadow:0 0 0 1px var(--line-strong),0 30px 60px -34px rgba(20,20,16,.45);padding:clamp(6px,1.4vw,12px);display:grid;gap:clamp(4px,1vw,8px)}
.dc-board-a{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr))}
.dc-board-b{grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr))}
.dc-slot,.dc-cell{position:relative;min-width:0;border-radius:6px;overflow:hidden;border:1px dashed var(--line-strong)}
.dc-slot img,.dc-cell img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;animation:7.2s infinite paused;animation-timing-function:cubic-bezier(.34,1.35,.64,1)}
.dc-s1 img{animation-name:dcS1}.dc-s2 img{animation-name:dcS2}.dc-s3 img{animation-name:dcS3}
.dc-cell img{animation-name:dcE;animation-delay:calc(var(--i)*45ms)}
.dc-clock{display:grid;place-items:center;border-style:solid;border-color:transparent}
.dc-clock svg{width:62%;height:auto;fill:none;stroke:var(--muted);stroke-width:2;stroke-linecap:round}
.dc-hand{transform-box:view-box;transform-origin:50% 50%;animation:dcHand 7.2s steps(12) infinite paused}
@keyframes dcS1{0%,8%{opacity:0;transform:scale(.9)}14%,90%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}}
@keyframes dcS2{0%,36%{opacity:0;transform:scale(.9)}42%,90%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}}
@keyframes dcS3{0%,64%{opacity:0;transform:scale(.9)}70%,90%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}}
@keyframes dcE{0%,7%{opacity:0;transform:translateY(8px) scale(.94)}13%,90%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}}
@keyframes dcHand{to{transform:rotate(360deg)}}
.dc-on .dc-trk,.dc-on .dc-like,.dc-on .dc-buy,.dc-on .dc-t,.dc-on .dc-p,.dc-on .dc-cap,.dc-on .dc-slot img,.dc-on .dc-cell img,.dc-on .dc-hand{animation-play-state:running}
.dc-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;max-width:980px;margin:clamp(40px,6vw,72px) auto 0}
.dc-col{border-radius:22px;padding:clamp(24px,3.4vw,38px)}
.dc-a{box-shadow:inset 0 0 0 1px var(--line-strong)}
.dc-b{background:var(--forest);color:var(--paper)}
.dc-col h3{font:400 clamp(28px,3.2vw,40px)/1.02 var(--serif);letter-spacing:-.02em;margin:0 0 20px}
.dc-b h3 em{font-style:italic;color:inherit}
.dc-col ul{list-style:none;margin:0;padding:0;display:grid;gap:15px}
.dc-col li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:12px;font-size:clamp(15px,1.4vw,17px);line-height:1.5}
.dc-col li svg{width:22px;height:22px;margin-top:1px;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.dc-a li{color:var(--muted)}.dc-a li svg{stroke:var(--muted)}
.dc-b li svg{stroke:currentColor}
.dc-fin{text-align:center;margin-top:clamp(44px,6vw,80px)}
.dc-big{margin:0;font:400 clamp(44px,7vw,96px)/.95 var(--serif);letter-spacing:-.03em}
.dc-big em{font-style:italic;color:var(--forest)}
.dc-sub{margin:18px auto 0;max-width:46ch;font-size:clamp(16px,1.6vw,19px);line-height:1.55;color:var(--ink-2)}
.dc-sec .v2-cta{margin-top:clamp(28px,4vw,44px)}
.dc-sec .v2-cta .btn{background:var(--ink);color:var(--paper)}
.dc-sec .v2-cta .btn:hover{background:var(--forest)}
@media(min-width:760px){.dc-cols{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}}
@media (prefers-reduced-motion:reduce){.dc-anim *{animation:none!important}
.dc-ph-a .dc-trk{transform:translateY(-20%)}.dc-ph-b .dc-trk{transform:translateY(-66.6667%)}
.dc-buy{opacity:1;transform:translate(-50%,0)}.dc-like{fill:#B8453B;stroke:#B8453B}
.dc-t{opacity:.22}.dc-t-c{opacity:1;transform:scale(1.12)}.dc-p{opacity:1}.dc-k2{opacity:1}
.dc-slot img,.dc-cell img{opacity:1}}
'''

JS_DC = ('(function(){var s=document.currentScript&&document.currentScript.parentNode;if(!s)return;'
         'var a=s.querySelector(".dc-anim");if(!a)return;var sets=null,i=0;'
         'function go(on){a.classList.toggle("dc-on",on);if(on&&!sets&&a.dataset.sets){sets=JSON.parse(a.dataset.sets);'
         'sets.forEach(function(f){new Image().src=f[0];new Image().src=f[1]})}}'
         'if("IntersectionObserver" in window){new IntersectionObserver(function(e){go(e[e.length-1].isIntersecting)},'
         '{threshold:.2}).observe(a)}else go(true);'
         'var t0=a.querySelector(".dc-t");if(t0&&a.dataset.sets){t0.addEventListener("animationiteration",function(e){'
         'if(e.target!==t0||!sets)return;i=(i+1)%sets.length;var f=sets[i];'
         'a.querySelectorAll(".dc-f").forEach(function(m){m.src=f[0]});var p=a.querySelector(".dc-p");if(p)p.src=f[1]})}})();')

SVG_ICO = {
    'heart': '<path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4.5 6.9 4.5c2 0 3.6 1.1 4.6 2.7 1-1.6 2.6-2.7 4.6-2.7 3.3 0 5.5 3.1 4.2 6.6-1.8 4.8-9.3 9.4-9.3 9.4z"/>',
    'com': '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.4A8.5 8.5 0 1 1 20.5 11.5z"/>',
    'send': '<path d="M21 3 10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
    'save': '<path d="M6 3.5h12v17l-6-4.5-6 4.5z"/>',
}


def _img(src, w, h, alt=''):
    if not os.path.exists(os.path.join(AQUI, src)):
        raise Falla('FALTA la imagen ' + src)
    return '<img src="%s" width="%d" height="%d" alt="%s" loading="lazy" decoding="async">' % (src, w, h, alt)


def _post(src, like=False):
    ico = lambda k, extra='': '<svg viewBox="0 0 24 24"%s>%s</svg>' % (extra, SVG_ICO[k])
    corazon = ('<svg viewBox="0 0 24 24"><path class="dc-like" d="%s"/></svg>' % re.search(r'd="([^"]+)"', SVG_ICO['heart']).group(1)
               if like else ico('heart'))
    return ('<div class="dc-post"><div class="dc-hd"><i></i><b></b></div>' + _img(src, 640, 800) +
            '<div class="dc-ac">' + corazon + ico('com') + ico('send') + ico('save') + '</div></div>')


def anim_scroll(t):
    feos = ['assets/versus-nb/generico-640.webp', 'assets/nov/versus-bolso-feo-640.webp',
            'assets/prompt-ads/05-comparacion-anuncio-generico-640.webp', 'assets/nov/versus-burguer-feo-640.webp']
    izq = ''.join(_post(x) for x in feos + feos[:1])
    der = ''.join(_post(x) for x in (feos[0], feos[2])) + _post('assets/nov/par-bolso-a.webp', like=True)
    return ('<div class="dc-anim dc-scroll reveal" role="img" aria-label="%s"><div class="dc-dos">'
            '<figure class="dc-ph-a"><figcaption class="dc-lab">%s</figcaption><div class="dc-scr"><div class="dc-trk">%s</div></div>'
            '<p class="dc-cap">%s</p></figure>'
            '<figure class="dc-ph-b"><figcaption class="dc-lab dc-lab-b">%s</figcaption><div class="dc-scr"><div class="dc-trk">%s</div>'
            '<span class="dc-buy" aria-hidden="true">%s</span></div><p class="dc-cap">%s</p></figure>'
            '</div></div>') % (t['aria'], t['lab_a'], izq, t['cap_a'], t['lab_b'], der, t['boton'], t['cap_b'])


def anim_proveedor(t):
    sets = [['assets/nov/par-bolso-f.webp', 'assets/nov/par-bolso-a.webp'],
            ['assets/nov/par-samba-f.webp', 'assets/nov/par-samba-a.webp'],
            ['assets/nov/par-peine-f.webp', 'assets/nov/par-peine-a.webp']]
    for f in sum(sets, []):
        if not os.path.exists(os.path.join(AQUI, f)):
            raise Falla('FALTA la imagen ' + f)
    tiles = []
    for i in range(9):
        f = _img(sets[0][0], 360, 540).replace('<img ', '<img class="dc-f" ')
        if i == 4:
            p = _img(sets[0][1], 720, 900).replace('<img ', '<img class="dc-p" ')
            tiles.append('<div class="dc-t dc-t-c" style="--i:%d">%s%s</div>' % (i, f, p))
        else:
            tiles.append('<div class="dc-t" style="--i:%d">%s</div>' % (i, f))
    return ("<div class=\"dc-anim dc-prov reveal\" role=\"img\" aria-label=\"%s\" data-sets='%s'>"
            '<div class="dc-g9">%s</div><div class="dc-caps"><p class="dc-cap dc-k1">%s</p><p class="dc-cap dc-k2">%s</p></div>'
            '</div>') % (t['aria'], json.dumps(sets), ''.join(tiles), t['cap_a'], t['cap_b'])


def anim_tanda(t):
    feos = ['assets/nov/versus-bolso-feo-640.webp', 'assets/versus-nb/generico-640.webp',
            'assets/prompt-ads/05-comparacion-anuncio-generico-640.webp']
    slots = ''.join('<div class="dc-slot dc-s%d">%s</div>' % (i + 1, _img(x, 640, 800)) for i, x in enumerate(feos))
    reloj = ('<div class="dc-slot dc-clock"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/>'
             '<path d="M50 50V30"/><path class="dc-hand" d="M50 50l17 9"/></svg></div>')
    cells = ''.join('<div class="dc-cell" style="--i:%d">%s</div>' % (i, _img('assets/s-cinta/s-%02d.webp' % n, 480, 600))
                    for i, n in enumerate(t['cinta']))
    return ('<div class="dc-anim dc-tanda reveal" role="img" aria-label="%s"><div class="dc-dos">'
            '<figure><figcaption class="dc-lab">%s</figcaption><div class="dc-board dc-board-a">%s%s</div><p class="dc-cap">%s</p></figure>'
            '<figure><figcaption class="dc-lab dc-lab-b">%s</figcaption><div class="dc-board dc-board-b">%s</div><p class="dc-cap">%s</p></figure>'
            '</div></div>') % (t['aria'], t['lab_a'], slots, reloj, t['cap_a'], t['lab_b'], cells, t['cap_b'])


def bloque_dos_caminos(b, cta):
    anim = {'scroll': anim_scroll, 'proveedor': anim_proveedor, 'tanda': anim_tanda}[b['animacion']](b['anim'])
    no = ('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/>'
          '<path d="M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4"/></svg>')
    si = ('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/>'
          '<path d="M7.6 12.4l3 3 5.8-6.6"/></svg>')
    lista = lambda xs, ico: '<ul>' + ''.join('<li>%s<span>%s</span></li>' % (ico, x) for x in xs) + '</ul>'
    return ('<section class="nov-sec dc-sec" data-esc="Dos caminos" id="dos-caminos" aria-labelledby="dc-t">'
            '<style>' + CSS_DC + '</style><div class="shell">'
            '<div class="nov-cab reveal"><span class="eyebrow">' + b['eyebrow'] + '</span><h2 id="dc-t">' + b['titulo'] +
            '</h2></div>' + anim +
            '<div class="dc-cols"><div class="dc-col dc-a reveal"><h3>' + b['seguir_titulo'] + '</h3>' + lista(b['seguir'], no) +
            '</div><div class="dc-col dc-b reveal"><h3>' + b['pero_titulo'] + '</h3>' + lista(b['pero'], si) + '</div></div>'
            '<div class="dc-fin reveal"><p class="dc-big">' + b['final'] + '</p><p class="dc-sub">' + b['final_sub'] +
            '</p></div></div>' + cta + '<script>' + JS_DC + '</script></section>')


def mover_cta_a_dos_caminos(s, b):
    """Saca el botón del final de «La IA no lo sabe todo» y lo pone al final del bloque nuevo (mismo HTML)."""
    a, e = seccion(s, 'La IA no lo sabe todo')
    sec = s[a:e]
    m = re.search(r'<div class="shell v2-cta reveal">.*?</div>', sec, re.S)
    if not m:
        raise Falla('ANCLAJE NO ENCONTRADO: el botón v2-cta en "La IA no lo sabe todo"')
    sec = sec[:m.start()] + sec[m.end():]
    return s[:a] + sec + bloque_dos_caminos(b, m.group(0)) + s[e:]


def armar(base, copy, camino):
    c = copy[camino]
    ancla = dict(copy['agencias'])  # los anclajes *_buscar viven solo en agencias
    ancla['_comun'] = copy['comun']
    s = base
    s = head(s, c, camino)
    s = edita_seccion(s, 'Inicio', lambda x: hero(x, c, ancla))
    if c['hero'].get('toca'):
        s = edita_seccion(s, 'Inicio', lambda x: hero_un_boton(x, c))
    s = edita_seccion(s, 'Qué es', lambda x: que_es(x, c, ancla))
    s = edita_seccion(s, 'Tu problema', lambda x: dolor(x, c))
    if c.get('bloque_catalogo'):
        a, b = seccion(s, 'Tu problema')
        s = s[:b] + bloque_catalogo(c['bloque_catalogo']) + s[b:]
    s = edita_seccion(s, 'La IA no lo sabe todo', lambda x: ia_no_sabe(x, c, ancla))
    if c.get('versus'):
        s = edita_seccion(s, 'La IA no lo sabe todo', lambda x: versus(x, c['versus']))
    if c.get('dos_caminos'):
        s = mover_cta_a_dos_caminos(s, c['dos_caminos'])
    if c.get('galeria_cinta'):
        s = edita_seccion(s, 'Inicio', lambda x: cinta(x, c['galeria_cinta'], 2, False, 'Inicio'))
        s = edita_seccion(s, 'Más historias', lambda x: cinta(x, c['galeria_cinta'], 0, True, 'Más historias'))
    s = edita_seccion(s, 'Cómo funciona', lambda x: como_funciona(x, c, ancla))
    vistos = []

    def tira(x, primero, ocultar):
        y, nombres = reordenar_testimonios(x, primero, ocultar)
        vistos.extend(nombres)
        return y
    s = edita_seccion(s, 'Testimonios', lambda x: tira(x, c['testimonios_primero'], c.get('testimonios_ocultar', [])))
    s = edita_seccion(s, 'Más historias', lambda x: tira(x, c['testimonios_primero'], c.get('testimonios_ocultar', [])))
    for n in c['testimonios_primero'] + c.get('testimonios_ocultar', []):
        if n not in vistos:
            raise Falla('ANCLAJE NO ENCONTRADO: testimonio de "%s" en ninguna de las dos tiras' % n)
    s = edita_seccion(s, 'Preguntas', lambda x: preguntas(x, c, camino))
    s = edita_seccion(s, 'Empieza hoy', lambda x: cierre(x, c, ancla))
    for esc in c['quitar_secciones'] + ['Para quién']:
        a, b = seccion(s, esc)
        s = s[:a] + s[b:]
    control_fijas(base, s, copy, c, camino)
    return s


def seccion_fija(s, nombre):
    """Texto completo de una seccion fija: por data-esc, o por clase si el nombre es 'inside'."""
    if nombre == 'inside':
        cand = abrir_tags(s, 'section', clase='inside')
        if not cand:
            raise Falla('ANCLAJE NO ENCONTRADO: <section class="inside">')
        e = elemento(s, cand[0])
        return s[e[0]:e[1]]
    a, b = seccion(s, nombre)
    return s[a:b]


def control_fijas(base, out, copy, c, camino):
    """Las secciones que explican y venden el producto deben quedar IDENTICAS a index.html."""
    for nombre in copy['comun']['secciones_fijas']:
        if seccion_fija(base, nombre) != seccion_fija(out, nombre):
            raise Falla('SECCION FIJA ALTERADA en %s: "%s" ya no es identica a index.html' % (camino, nombre))
    original = seccion_fija(base, 'Cómo funciona')
    buscar = copy['agencias']['como_funciona_intro']['buscar']
    esperada = htmllib.unescape(original).replace(buscar, c['como_funciona_intro']['nuevo'])
    obtenida = htmllib.unescape(seccion_fija(out, 'Cómo funciona'))
    if esperada != obtenida:
        raise Falla('SECCION FIJA ALTERADA en %s: "Cómo funciona" difiere de index.html en algo mas que la frase del perfil' % camino)


def control_palabras(s):
    """Apariciones (texto visible) de diseñador / Photoshop / Canva / Illustrator, con su contexto."""
    vis = re.sub(r'<(script|style)\b.*?</\1\s*>', ' ', s, flags=re.S)
    vis = re.sub(r'<(?:/p|/li|/h\d|/div|/summary|/b|br\s*/?)>', '\n', vis)
    vis = htmllib.unescape(re.sub(r'<[^>]+>', ' ', vis))
    vis = re.sub(r'[ \t ]+', ' ', vis)
    sal = []
    for linea in vis.split('\n'):
        linea = linea.strip()
        if re.search(r'dise[ñn]ador|dise[ñn]adora|photoshop|canva|illustrator', linea, re.I):
            sal.append(linea)
    return sal


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    ruta_copy = sys.argv[1] if len(sys.argv) > 1 else COPY_DEFECTO
    if not os.path.exists(INDEX):
        sys.exit('ERROR: no encuentro ' + INDEX)
    if not os.path.exists(ruta_copy):
        sys.exit('ERROR: no encuentro el JSON de textos: ' + ruta_copy)
    with open(INDEX, 'r', encoding='utf-8', newline='') as f:
        base = f.read()
    with open(ruta_copy, 'r', encoding='utf-8') as f:
        copy = json.load(f)
    salidas = {}
    caminos = [k for k, v in copy.items()
               if isinstance(v, dict) and 'ruta' in v and v.get('activo', True) is not False]
    try:
        for cam in caminos:
            salidas[cam] = armar(base, copy, cam)
    except Falla as e:
        sys.exit('\nERROR: la landing general cambio o falta un anclaje; no se genero nada.\n' + str(e))
    for cam, h in salidas.items():
        with open(os.path.join(AQUI, cam + '.html'), 'w', encoding='utf-8', newline='') as f:
            f.write(h)
        print('%-12s %7.1f KB  (index.html %.1f KB)' % (
            cam + '.html', len(h.encode('utf-8')) / 1024, len(base.encode('utf-8')) / 1024))
    for cam in salidas:
        if copy[cam].get('control_palabras'):
            print('\nControl de palabras en %s.html (texto visible; revisar, no se reescribe):' % cam)
            for l in control_palabras(salidas[cam]):
                print(' -', l[:260])


if __name__ == '__main__':
    main()
