# October Black: reloj que se reinicia SOLO con 3 días más cada vez que llega a cero (pedido de Martino, 24/10/2026:
# "cuando el contador llegue a 0 de la landing, reinicia y da 3 días más... cuando llegue a 0 vuelve a dar 3 días más",
# porque no va a poder pedir cambios hasta el jueves).
# Parte de la página publicada (HEAD:index.html). Hasta el LUNES 26/10 12:00 de Paraguay queda exactamente igual;
# desde ahí, cada 3 días a las 12:00 arranca otra tanda (jueves 29, domingo 1, miércoles 4...). Mismo precio (USD 67),
# mismos textos, mismo enlace de pago. Ya no pasa sola a USD 87.
#   python _armar-extension-auto.py   ->  _ob-extension-auto.html
import io, re, subprocess, sys

src = subprocess.run(['git', 'show', 'HEAD:index.html'], capture_output=True, check=True).stdout.decode('utf-8')
s = src

def cambia(viejo, nuevo):
    global s
    n = s.count(viejo)
    if n != 1: sys.exit('FRENO: "%s" aparece %d veces (tiene que ser 1). No se escribió nada.' % (viejo[:80], n))
    s = s.replace(viejo, nuevo)

FD = "new Date(window.ssOferta.fin - 108e5).toISOString().slice(0,10)"   # fecha de Paraguay (UTC-3) del fin vigente
cambia("  var F = Date.parse('2026-10-26T12:00:00-03:00');     // fin con la sexta tanda de 3 días más",
       "  var F = Date.parse('2026-10-26T12:00:00-03:00');     // fin con la sexta tanda de 3 días más\n"
       "  var P3 = 3 * 864e5, k3 = Date.now() >= F ? Math.ceil((Date.now() - F + 1) / P3) : 0; if (k3) { F6 = F + (k3 - 1) * P3; F += k3 * P3; }   // desde el 26/10, cada vez que llega a cero: 3 días más")
cambia("    const LIMITE = (window.ssOferta && window.ssOferta.ext6) ? '2026-10-26' :",
       "    const LIMITE = (window.ssOferta && window.ssOferta.estado === 'ob' && window.ssOferta.fin) ? " + FD + " : (window.ssOferta && window.ssOferta.ext6) ? '2026-10-26' :")
cambia('''var lim=(window.ssOferta&&window.ssOferta.ext6)?"2026-10-26":''',
       '''var lim=(window.ssOferta&&window.ssOferta.estado==='ob'&&window.ssOferta.fin)?''' + FD + ''':(window.ssOferta&&window.ssOferta.ext6)?"2026-10-26":''')
cambia("  var DIA = o.ext6 ? 'lunes 26' :",
       "  var FD = o.fin ? new Date(o.fin - 108e5) : null;\n"
       "  var DIA = FD ? ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][FD.getUTCDay()] + ' ' + FD.getUTCDate() : o.ext6 ? 'lunes 26' :")
cambia("FECHA = o.ext6 ? '26 de octubre' :",
       "FECHA = FD ? FD.getUTCDate() + ' de ' + ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][FD.getUTCMonth()] : o.ext6 ? '26 de octubre' :")

for clave in ("fbq('init', '1448725857302388')", 'AW-18441137893', 'off=1tbcugw1', "ssTrack('InitiateCheckout'", "ssTrack('PageView'", 'pay.hotmart.com/G107515293E'):
    if s.count(clave) != src.count(clave) or s.count(clave) == 0: sys.exit('FRENO: cambió "%s".' % clave)
def bloques(h): return [b for b in re.findall(r'<script\b.*?</script>', h.replace('\r\n', '\n'), flags=re.S) if 'fbq(' in b or 'gtag(' in b]
if not bloques(src) or bloques(src) != bloques(s): sys.exit('FRENO: cambió un script de seguimiento.')
a, b = src.replace('\r\n', '\n').split('\n'), s.replace('\r\n', '\n').split('\n')
quitados = [x for x in a if x not in set(b)]; puestos = [x for x in b if x not in set(a)]
if len(quitados) != 3 or len(puestos) != 5: sys.exit('FRENO: se esperaba cambiar 3 renglones por 5 y cambiaron %d por %d.' % (len(quitados), len(puestos)))
io.open('_ob-extension-auto.html', 'w', encoding='utf-8', newline='').write(s)
print('OK -> _ob-extension-auto.html')
