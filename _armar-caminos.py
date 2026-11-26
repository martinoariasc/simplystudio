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
CAMINOS = ['agencias', 'disenadores', 'negocios']
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
    partes, pos = [], dets[0][0]
    out = sec[:dets[0][0]]
    for i, e in enumerate(dets):
        out += nuevo[i]
        if i + 1 < len(dets):
            out += sec[e[1]:dets[i + 1][0]]
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
def armar(base, copy, camino):
    c = copy[camino]
    ancla = dict(copy['agencias'])  # los anclajes *_buscar viven solo en agencias
    ancla['_comun'] = copy['comun']
    s = base
    s = head(s, c, camino)
    s = edita_seccion(s, 'Inicio', lambda x: hero(x, c, ancla))
    s = edita_seccion(s, 'Qué es', lambda x: que_es(x, c, ancla))
    s = edita_seccion(s, 'Tu problema', lambda x: dolor(x, c))
    s = edita_seccion(s, 'La IA no lo sabe todo', lambda x: ia_no_sabe(x, c, ancla))
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
    return s


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
    try:
        for cam in CAMINOS:
            salidas[cam] = armar(base, copy, cam)
    except Falla as e:
        sys.exit('\nERROR: la landing general cambio o falta un anclaje; no se genero nada.\n' + str(e))
    for cam, h in salidas.items():
        with open(os.path.join(AQUI, cam + '.html'), 'w', encoding='utf-8', newline='') as f:
            f.write(h)
        print('%-12s %7.1f KB  (index.html %.1f KB)' % (
            cam + '.html', len(h.encode('utf-8')) / 1024, len(base.encode('utf-8')) / 1024))
    print('\nControl de palabras en disenadores.html (texto visible; revisar, no se reescribe):')
    for l in control_palabras(salidas['disenadores']):
        print(' -', l[:260])


if __name__ == '__main__':
    main()
