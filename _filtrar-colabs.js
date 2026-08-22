/*  Clasifica cada PNG de colaboraciones: vitrina (mockup de Instagram) o anuncio.
 *  Mide con ffmpeg el brillo medio de dos zonas. Salida: _colabs.json
 */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const FF = 'C:/Users/USER/AppData/Local/CapCut/Apps/2.5.0.723/ffmpeg.exe';
const B = 'C:/Users/USER/Desktop/Jobs/Productos digitales/simply studio/ig/Feed/colaboraciones';

function brillo(archivo, crop) {
  try {
    const raw = execFileSync(FF, ['-v', 'error', '-i', archivo, '-vf', 'crop=' + crop + ',scale=1:1', '-frames:v', '1',
      '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { timeout: 20000, maxBuffer: 1 << 20 });
    return raw[0];
  } catch (e) { return -1; }
}

const carpetas = fs.readdirSync(B).filter(d => fs.statSync(path.join(B, d)).isDirectory());
const res = [];
carpetas.forEach(d => {
  const dir = path.join(B, d);
  let archivos = fs.readdirSync(dir).filter(f => /\.png$/i.test(f)).map(f => path.join(dir, f));
  /* Red Bull guarda los anuncios en Producto/ */
  const sub = path.join(dir, 'Producto');
  if (!archivos.length && fs.existsSync(sub)) archivos = fs.readdirSync(sub).filter(f => /\.png$/i.test(f)).map(f => path.join(sub, f));
  archivos.forEach(a => {
    const izq = brillo(a, '60:1200:20:100');      /* borde izquierdo */
    const logo = brillo(a, '220:130:230:200');     /* zona del logo simply studio */
    const vitrina = izq >= 0 && izq < 70 && logo > 165;
    res.push({ marca: d, archivo: a, izq, logo, vitrina });
  });
});
fs.writeFileSync('_colabs.json', JSON.stringify(res, null, 1), 'utf8');
const porMarca = {};
res.forEach(r => { porMarca[r.marca] = porMarca[r.marca] || { total: 0, vitrinas: 0 }; porMarca[r.marca].total++; if (r.vitrina) porMarca[r.marca].vitrinas++; });
Object.entries(porMarca).forEach(([m, c]) => console.log('  ' + m.padEnd(16) + c.total + ' imagenes, ' + c.vitrinas + ' vitrinas'));
console.log('  total: ' + res.length + '   anuncios: ' + res.filter(r => !r.vitrina).length);
