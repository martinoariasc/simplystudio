# October Black, sexta tanda de 3 días más (pedido de Martino, 23/10/2026: "agrega 3 días más cuando el contador llegue a 0 también").
# Parte de la página publicada (HEAD:index.html) y cambia SOLO lo necesario: hasta el VIERNES 23/10 a las 12:00 de Paraguay
# queda exactamente como está; cuando el reloj llega a cero arranca de nuevo con 3 días y termina el LUNES 26/10 a las 12:00.
# Mismos textos, mismo precio (USD 67), mismo enlace de pago. El lunes 12:00 pasa sola a USD 87.
#   python _armar-extension-6.py   ->  _ob-extension-6.html
import io, re, subprocess, sys

src = subprocess.run(['git', 'show', 'HEAD:index.html'], capture_output=True, check=True).stdout.decode('utf-8')
s = src

def cambia(viejo, nuevo):
    global s
    n = s.count(viejo)
    if n != 1: sys.exit('FRENO: "%s" aparece %d veces (tiene que ser 1). No se escribió nada.' % (viejo[:80], n))
    s = s.replace(viejo, nuevo)

cambia("  var F = Date.parse('2026-10-23T12:00:00-03:00');     // fin con la quinta tanda de 3 días más",
       "  var F6 = Date.parse('2026-10-23T12:00:00-03:00');    // fin de la quinta tanda de 3 días más\n"
       "  var F = Date.parse('2026-10-26T12:00:00-03:00');     // fin con la sexta tanda de 3 días más")
linea = next(l for l in s.split('\n') if l.startswith("    if (ahora < F) { o = { estado: 'ob'"))
nueva = (linea.replace("ext5: ahora >= F5, f1: ahora >= F5 ? F5 :", "ext5: ahora >= F5, ext6: ahora >= F6, f1: ahora >= F6 ? F6 : ahora >= F5 ? F5 :")
              .replace("fin: ahora >= F5 ? F : ahora >= F4 ? F5 :", "fin: ahora >= F6 ? F : ahora >= F5 ? F6 : ahora >= F4 ? F5 :")
              .replace("ahora < F5 ? F5 : F;", "ahora < F5 ? F5 : ahora < F6 ? F6 : F;"))
if nueva.count('ext6') != 1 or 'ahora < F6 ? F6 : F;' not in nueva or 'fin: ahora >= F6 ? F :' not in nueva: sys.exit('FRENO: no pude armar la línea del estado.')
cambia(linea, nueva)
cambia("    const LIMITE = (window.ssOferta && window.ssOferta.ext5) ? '2026-10-23' :",
       "    const LIMITE = (window.ssOferta && window.ssOferta.ext6) ? '2026-10-26' : (window.ssOferta && window.ssOferta.ext5) ? '2026-10-23' :")
cambia('''var lim=(window.ssOferta&&window.ssOferta.ext5)?"2026-10-23":''',
       '''var lim=(window.ssOferta&&window.ssOferta.ext6)?"2026-10-26":(window.ssOferta&&window.ssOferta.ext5)?"2026-10-23":''')
cambia("  var DIA = o.ext5 ? 'viernes 23' :", "  var DIA = o.ext6 ? 'lunes 26' : o.ext5 ? 'viernes 23' :")
cambia("FECHA = o.ext5 ? '23 de octubre' :", "FECHA = o.ext6 ? '26 de octubre' : o.ext5 ? '23 de octubre' :")

for clave in ("fbq('init', '1448725857302388')", 'AW-18441137893', 'off=1tbcugw1', "ssTrack('InitiateCheckout'", "ssTrack('PageView'", 'pay.hotmart.com/G107515293E'):
    if s.count(clave) != src.count(clave) or s.count(clave) == 0: sys.exit('FRENO: cambió "%s".' % clave)
def bloques(h): return [b for b in re.findall(r'<script\b.*?</script>', h.replace('\r\n', '\n'), flags=re.S) if 'fbq(' in b or 'gtag(' in b]
if not bloques(src) or bloques(src) != bloques(s): sys.exit('FRENO: cambió un script de seguimiento.')
a, b = src.replace('\r\n', '\n').split('\n'), s.replace('\r\n', '\n').split('\n')
quitados = [x for x in a if x not in set(b)]; puestos = [x for x in b if x not in set(a)]
if len(quitados) != 5 or len(puestos) != 6: sys.exit('FRENO: se esperaba cambiar 5 renglones por 6 y cambiaron %d por %d.' % (len(quitados), len(puestos)))
io.open('_ob-extension-6.html', 'w', encoding='utf-8', newline='').write(s)
print('ok: _ob-extension-6.html  (5 renglones cambiados por 6; el resto, idéntico a lo publicado)')
