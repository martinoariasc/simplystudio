# -*- coding: utf-8 -*-
# October Black hasta el último día de octubre (pedido de Martino del 28/10/2026: «cuando el contador llegue a 0 se sume hasta el
# último día de octubre… llega noviembre y vuelve a la normalidad como estaba antes»).
#   · Hasta el jueves 29/10 12:00 de Paraguay: igual que ahora (el reloj termina el 29/10 12:00).
#   · Del 29/10 12:00 al sábado 31/10 23:59: el reloj termina el sábado 31/10 a las 23:59.
#   · Desde el 31/10 23:59: vuelve al reloj automático de antes (3 días más cada vez que llega a cero), sin cambiar precio ni pago.
# Solo cambia la línea del reloj automático de index.html (HEAD). Frena si la línea no está igual.
#   python _armar-extension-octubre.py   -> _ob-extension-octubre.html (después: copiar a index.html, probar y publicar)
import io, subprocess
ACTUAL = "  var P3 = 3 * 864e5, k3 = Date.now() >= F ? Math.ceil((Date.now() - F + 1) / P3) : 0; if (k3) { F6 = F + (k3 - 1) * P3; F += k3 * P3; }   // desde el 26/10, cada vez que llega a cero: 3 días más"
NUEVA = ("  var P3 = 3 * 864e5, k3 = Date.now() >= F ? Math.ceil((Date.now() - F + 1) / P3) : 0; if (k3) { F6 = F + (k3 - 1) * P3; F += k3 * P3; }   // desde el 26/10, cada vez que llega a cero: 3 días más\n"
         "  var C29 = Date.parse('2026-10-29T12:00:00-03:00'), FOCT = Date.parse('2026-10-31T23:59:00-03:00');   // 28/10: al llegar a cero el 29/10, hasta el último día de octubre\n"
         "  if (Date.now() >= C29 && Date.now() < FOCT) { F6 = C29; F = FOCT; }\n"
         "  else if (Date.now() >= FOCT) { var k4 = Math.ceil((Date.now() - FOCT + 1) / P3); F6 = FOCT + (k4 - 1) * P3; F = FOCT + k4 * P3; }   // después, otra vez 3 días más cada vez")
html = subprocess.run(['git', 'show', 'HEAD:index.html'], capture_output=True).stdout.decode('utf-8')
assert html.count(ACTUAL) == 1, 'La línea del reloj automático no está igual: no se cambia nada.'
out = html.replace(ACTUAL, NUEVA, 1)
io.open('_ob-extension-octubre.html', 'w', encoding='utf-8', newline='').write(out)
print('ok: _ob-extension-octubre.html', len(html), '->', len(out))
