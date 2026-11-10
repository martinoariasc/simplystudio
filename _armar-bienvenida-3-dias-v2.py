# -*- coding: utf-8 -*-
# Martino 09/11/2026: el precio de bienvenida pasa de 24 horas a 3 días y «se actualiza para toda la gente»: quien ya veía USD 87 vuelve a
# USD 67 por 3 días (memoria nueva: ss_bv_v1 -> ss_bv_v2, cookie ss_bv -> ss_bv2). Se aplica sobre la landing nueva publicada (index.html
# minificado). La barra del celular decía «Termina hoy/mañana»: ahora dice hoy, mañana o el día de la semana. Precio sin cambios (67 -> 87).
#   python _armar-bienvenida-3-dias-v2.py   (edita index.html en el lugar; frena si algo no está exactamente una vez)
import io, sys
raw = open('index.html', 'rb').read()
bom = raw.startswith(b'\xef\xbb\xbf')
t = raw.decode('utf-8-sig')
SEGUIMIENTO = ['1448725857302388', 'AW-18441137893', 'InitiateCheckout', '1tbcugw1', '3hjxp67m', "fbq('init'"]
antes = {s: t.count(s) for s in SEGUIMIENTO}
CAMBIOS = [
    ("E['finBv']=b+(0x1*-0x8a7b6bf+0x4c41cdc+0x909f5e3)", "E['finBv']=b+0xf731400", 1),           # 24 h -> 72 h
    ("'horas':0x18", "'horas':0x48", 2),
    ("g='ss_bv_v1'", "g='ss_bv_v2'", 1),
    (r"/(?:^|;\s*)ss_bv=(\d{12,14})/", r"/(?:^|;\s*)ss_bv2=(\d{12,14})/", 1),
    ("='ss_bv='+b+';", "='ss_bv2='+b+';", 1),
    ("(s17_G(0xbd)+b)", "('ss_bv2='+b)", 1),
    ('Tienes 24 horas desde tu primera visita.', 'Tienes 3 días desde tu primera visita.', 1),
    ('Pasadas las 24 horas, el precio sube', 'Pasados los 3 días, el precio sube', 1),
    ('durante las 24 horas siguientes a tu primera visita', 'durante los 3 días siguientes a tu primera visita', 1),
    ('Después de esas 24 horas, el precio es', 'Después de esos 3 días, el precio es', 1),
    ('dura 24 horas desde la primera vez que entras', 'dura 3 días desde la primera vez que entras', 1),
    ('a.textContent="Termina "+(i?"hoy":"mañana")+" a las "+r',
     'a.textContent="Termina "+(function(){var h=new Date,f=new Date(o);h.setHours(0,0,0,0);f.setHours(0,0,0,0);var n=Math.round((f-h)/864e5);return n<=0?"hoy":n===1?"mañana":"el "+["domingo","lunes","martes","miércoles","jueves","viernes","sábado"][o.getDay()]})()+" a las "+r', 1),
]
for viejo, nuevo, n in CAMBIOS:
    if t.count(viejo) != n:
        sys.exit('FRENO: «%s» aparece %d veces (esperaba %d). No se cambió nada.' % (viejo[:70], t.count(viejo), n))
    t = t.replace(viejo, nuevo)
for s, n in antes.items():
    if t.count(s) != n:
        sys.exit('FRENO: cambió el seguimiento o el pago: %s' % s)
if '24 horas' in t:
    sys.exit('FRENO: queda «24 horas»')
open('index.html', 'wb').write((b'\xef\xbb\xbf' if bom else b'') + t.encode('utf-8'))
print('ok: index.html ·', len(CAMBIOS), 'cambios · BOM', bom)
