// Hace una copia "solo para mirar" de una página del repo: le agrega una política de seguridad que bloquea el píxel de Meta,
// la etiqueta de Google y cualquier envío a otro dominio. Se ve y funciona igual (todo lo propio sale del mismo sitio),
// pero no manda ni un evento. Sirve para abrirla en el navegador o en el celular sin ensuciar los datos.
// Uso (desde _fuente-landings): node vista-segura.js <entrada.html> <salida.html>   (rutas relativas al repo)
const fs = require('fs'), path = require('path');
const [ent, sal] = process.argv.slice(2).map(f => path.resolve(__dirname, '..', f));
if (!/^_/.test(path.basename(sal))) throw new Error('la copia tiene que empezar con guion bajo, así nunca se publica');
let h = fs.readFileSync(ent, 'utf8');
const CSP = `<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; frame-src 'none'">`;
const aviso = '<!-- COPIA SOLO PARA MIRAR · el píxel de Meta y Google están bloqueados · NO publicar este archivo -->';
if ((h.match(/<meta charset[^>]*>/g) || []).length !== 1) throw new Error('no encontré un solo <meta charset>');
h = h.replace(/<meta charset[^>]*>/, m => m + '\n' + CSP + '\n' + aviso);
fs.writeFileSync(sal, h);
console.log('ok', path.basename(sal));
