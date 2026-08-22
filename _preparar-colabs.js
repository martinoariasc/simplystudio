/*  Arma la galeria: 3 anuncios por marca (sin vitrinas), convertidos a JPEG de 900px.
 *  Las primeras 11 son las elegidas a mano. Salida: assets/colabs/*.jpg + _galeria.json
 */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const FF = 'C:/Users/USER/AppData/Local/CapCut/Apps/2.5.0.723/ffmpeg.exe';
const B = 'C:/Users/USER/Desktop/Jobs/Productos digitales/simply studio/ig/Feed/colaboraciones';
const todos = JSON.parse(fs.readFileSync('_colabs.json', 'utf8')).filter(x => !x.vitrina);

const NOMBRE = { 'aesop': 'Aesop', 'airpods': 'Apple', 'coca cola': 'Coca-Cola', 'dyson airwrap': 'Dyson', 'fenty beauty': 'Fenty Beauty',
  'Glossier': 'Glossier', 'leica': 'Leica', 'Nespresso': 'Nespresso', 'New Balance': 'New Balance', 'nike': 'Nike', 'oatly': 'Oatly',
  'Red Bull': 'Red Bull', 'rhode': 'Rhode', 'Rimowa Maleta': 'Rimowa', 'rolex': 'Rolex', 'zara home': 'Zara Home', 'Byredo perfume': 'Byredo' };
const SLUG = { 'aesop': 'aesop', 'airpods': 'apple', 'coca cola': 'coca', 'dyson airwrap': 'dyson', 'fenty beauty': 'fenty', 'Glossier': 'glossier',
  'leica': 'leica', 'Nespresso': 'nespresso', 'New Balance': 'newbalance', 'nike': 'nike', 'oatly': 'oatly', 'Red Bull': 'redbull',
  'rhode': 'rhode', 'Rimowa Maleta': 'rimowa', 'rolex': 'rolex', 'zara home': 'zarahome', 'Byredo perfume': 'byredo' };

/* las elegidas a mano van primero, en este orden */
const MANO = [['Red Bull', '3.png'], ['New Balance', '19.png'], ['Rimowa Maleta', '5.png'], ['nike', '4.png'], ['aesop', '3.png'],
  ['coca cola', '5.png'], ['Glossier', '3.png'], ['zara home', '2.png'], ['leica', '2.png'], ['fenty beauty', '3.png'], ['zara home', '3.png'], ['airpods', '2.png'],
  ['Red Bull', '2.png'], ['coca cola', '2.png'], ['New Balance', '10.png'], ['Red Bull', '4.png'], ['rolex', '7.png'], ['zara home', '7.png'], ['rolex', '5.png'], ['oatly', '9.png'], ['oatly', '24.png'], ['dyson airwrap', '6.png'], ['Rimowa Maleta', '7.png'], ['Rimowa Maleta', '12.png'], ['Rimowa Maleta', '13.png'], ['Byredo perfume', '14.png'], ['Byredo perfume', '12.png']];

const usado = new Set();
const lista = [];
const agregar = x => { if (usado.has(x.archivo)) return; usado.add(x.archivo); lista.push(x); };
MANO.forEach(([m, f]) => { const x = todos.find(z => z.marca === m && path.basename(z.archivo) === f); if (x) agregar(x); });

/* despues, ronda por ronda, una de cada marca por orden de numero de archivo */
const porMarca = {};
todos.forEach(x => { (porMarca[x.marca] = porMarca[x.marca] || []).push(x); });
Object.values(porMarca).forEach(arr => arr.sort((a, b) => parseInt(path.basename(a.archivo)) - parseInt(path.basename(b.archivo))));
const OBJETIVO = 50, POR_MARCA = 3;
const TOPE = { oatly: 2, rolex: 2, 'New Balance': 2, 'zara home': 4, 'Rimowa Maleta': 5, 'Byredo perfume': 2 };   /* Oatly: solo las dos elegidas a mano; Rolex: macro y seda */
const EXCLUIR = new Set(['Rimowa Maleta/2.png', 'Rimowa Maleta/3.png']);   /* voseo en la pieza */
const cuenta = {};
lista.forEach(x => { cuenta[x.marca] = (cuenta[x.marca] || 0) + 1; });
let agrego = true;
while (lista.length < OBJETIVO && agrego) {
  agrego = false;
  for (const m of Object.keys(porMarca)) {
    if ((cuenta[m] || 0) >= (TOPE[m] || POR_MARCA)) continue;
    const x = porMarca[m].find(z => !usado.has(z.archivo) && !EXCLUIR.has(m + '/' + path.basename(z.archivo)));
    if (!x) continue;
    agregar(x); cuenta[m] = (cuenta[m] || 0) + 1; agrego = true;
    if (lista.length >= OBJETIVO) break;
  }
}

/* conversion */
fs.mkdirSync('assets/colabs', { recursive: true });
const manifiesto = [];
let total = 0;
lista.forEach(x => {
  const slug = SLUG[x.marca] + '-' + path.basename(x.archivo).replace('.png', '');
  const dst = path.join('assets/colabs', slug + '.jpg');
  if (!fs.existsSync(dst)) {
    try { execFileSync(FF, ['-y', '-v', 'error', '-i', x.archivo, '-vf', 'scale=900:-2', '-q:v', '5', dst], { timeout: 30000 }); } catch (e) {}
  }
  if (fs.existsSync(dst)) { total += fs.statSync(dst).size; manifiesto.push({ archivo: slug, marca: NOMBRE[x.marca] }); }
});
fs.writeFileSync('_galeria.json', JSON.stringify(manifiesto, null, 1), 'utf8');
console.log('  piezas: ' + manifiesto.length + '   peso total: ' + Math.round(total / 1024) + ' KB   promedio: ' + Math.round(total / manifiesto.length / 1024) + ' KB');
const marcas = {}; manifiesto.forEach(m => { marcas[m.marca] = (marcas[m.marca] || 0) + 1; });
console.log('  ' + Object.entries(marcas).map(([m, n]) => m + ' ' + n).join(' · '));
