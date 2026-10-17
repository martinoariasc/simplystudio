# October Black, cuarta tanda de 3 días más (pedido de Martino, 17/10/2026: "y agregar 3 días más cuando llegue a 00 el contador").
# Parte de la página publicada (HEAD:index.html) y cambia SOLO lo necesario: hasta el SÁBADO 17/10 a las 12:00 de Paraguay
# queda exactamente como está; cuando el reloj llega a cero arranca de nuevo con 3 días y termina el MARTES 20/10 a las 12:00.
# Mismos textos, mismo precio (USD 67), mismo enlace de pago. El martes 12:00 pasa sola a USD 87, como iba a pasar el sábado.
#   python _armar-extension-4.py   ->  _ob-extension-4.html
import io, re, subprocess, sys

src = subprocess.run(['git', 'show', 'HEAD:index.html'], capture_output=True, check=True).stdout.decode('utf-8')
s = src

def cambia(viejo, nuevo):
    global s
    n = s.count(viejo)
    if n != 1: sys.exit('FRENO: "%s" aparece %d veces (tiene que ser 1). No se escribió nada.' % (viejo[:80], n))
    s = s.replace(viejo, nuevo)

# 1 · las fechas: el fin de la tercera tanda pasa a F4 y F pasa al martes 20
cambia("  var F = Date.parse('2026-10-17T12:00:00-03:00');     // fin con la tercera tanda de 3 días más",
       "  var F4 = Date.parse('2026-10-17T12:00:00-03:00');    // fin de la tercera tanda de 3 días más\n"
       "  var F = Date.parse('2026-10-20T12:00:00-03:00');     // fin con la cuarta tanda de 3 días más")
cambia("    if (ahora < F) { o = { estado: 'ob', precio: 67, ext: ahora >= F1, ext2: ahora >= F2, ext3: ahora >= F3, f1: ahora >= F3 ? F3 : ahora >= F2 ? F2 : F1, fin: ahora >= F3 ? F : ahora >= F2 ? F3 : F2 }; prox = ahora < F1 ? F1 : ahora < F2 ? F2 : ahora < F3 ? F3 : F; }",
       "    if (ahora < F) { o = { estado: 'ob', precio: 67, ext: ahora >= F1, ext2: ahora >= F2, ext3: ahora >= F3, ext4: ahora >= F4, f1: ahora >= F4 ? F4 : ahora >= F3 ? F3 : ahora >= F2 ? F2 : F1, fin: ahora >= F4 ? F : ahora >= F3 ? F4 : ahora >= F2 ? F3 : F2 }; prox = ahora < F1 ? F1 : ahora < F2 ? F2 : ahora < F3 ? F3 : ahora < F4 ? F4 : F; }")

# 2 · la fecha del reloj, en los dos lugares que la leen (tienen que decir lo mismo)
cambia("    const LIMITE = (window.ssOferta && window.ssOferta.ext3) ? '2026-10-17' :",
       "    const LIMITE = (window.ssOferta && window.ssOferta.ext4) ? '2026-10-20' : (window.ssOferta && window.ssOferta.ext3) ? '2026-10-17' :")
cambia('''var lim=(window.ssOferta&&window.ssOferta.ext3)?"2026-10-17":''',
       '''var lim=(window.ssOferta&&window.ssOferta.ext4)?"2026-10-20":(window.ssOferta&&window.ssOferta.ext3)?"2026-10-17":''')

# 3 · los textos fijos que nombran la fecha
cambia("  var DIA = o.ext3 ? 'sábado 17' : o.ext2 ? 'miércoles 14' : 'domingo 11', FECHA = o.ext3 ? '17 de octubre' : o.ext2 ? '14 de octubre' : '11 de octubre';",
       "  var DIA = o.ext4 ? 'martes 20' : o.ext3 ? 'sábado 17' : o.ext2 ? 'miércoles 14' : 'domingo 11', FECHA = o.ext4 ? '20 de octubre' : o.ext3 ? '17 de octubre' : o.ext2 ? '14 de octubre' : '11 de octubre';")

# controles: nada de la medición ni del pago puede haber cambiado
for clave in ("fbq('init', '1448725857302388')", 'AW-18441137893', 'off=1tbcugw1', "ssTrack('InitiateCheckout'", "ssTrack('PageView'", 'pay.hotmart.com/G107515293E'):
    if s.count(clave) != src.count(clave) or s.count(clave) == 0: sys.exit('FRENO: cambió "%s".' % clave)
def bloques(h): return [b for b in re.findall(r'<script\b.*?</script>', h.replace('\r\n', '\n'), flags=re.S) if 'fbq(' in b or 'gtag(' in b]
if not bloques(src) or bloques(src) != bloques(s): sys.exit('FRENO: cambió un script de seguimiento.')
a, b = src.replace('\r\n', '\n').split('\n'), s.replace('\r\n', '\n').split('\n')
quitados = [x for x in a if x not in set(b)]
puestos = [x for x in b if x not in set(a)]
if len(quitados) != 5 or len(puestos) != 6: sys.exit('FRENO: se esperaba cambiar 5 renglones por 6 y cambiaron %d por %d.' % (len(quitados), len(puestos)))
io.open('_ob-extension-4.html', 'w', encoding='utf-8', newline='').write(s)
print('ok: _ob-extension-4.html  (5 renglones cambiados por 6; el resto, idéntico a lo publicado)')
