/*  Genera dos "auras" (luz difusa en los colores de la marca) como JPEG.
 *  Son la idea de Suno: un fondo que se ve premium sin ser una foto.
 *
 *    node _aura.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FF = 'C:/Users/USER/AppData/Local/CapCut/Apps/2.5.0.723/ffmpeg.exe';
const OUT = path.resolve('assets/fondos');

const AURAS = {
  'aura-clara': `
    background:#F3EFE7;
    background-image:
      radial-gradient(42% 52% at 28% 36%, rgba(201,185,138,.62) 0%, rgba(201,185,138,0) 70%),
      radial-gradient(38% 46% at 74% 28%, rgba(150,176,158,.38) 0%, rgba(150,176,158,0) 70%),
      radial-gradient(46% 40% at 62% 84%, rgba(232,186,150,.34) 0%, rgba(232,186,150,0) 70%),
      radial-gradient(30% 30% at 50% 55%, rgba(255,253,248,.9) 0%, rgba(255,253,248,0) 70%),
      linear-gradient(180deg, #F6F2EA 0%, #F3EFE7 100%);`,
  'aura-oscura': `
    background:#152218;
    background-image:
      radial-gradient(44% 56% at 24% 30%, rgba(201,185,138,.34) 0%, rgba(201,185,138,0) 70%),
      radial-gradient(40% 50% at 78% 38%, rgba(84,128,98,.42) 0%, rgba(84,128,98,0) 70%),
      radial-gradient(50% 44% at 58% 92%, rgba(40,70,50,.8) 0%, rgba(40,70,50,0) 70%),
      radial-gradient(80% 80% at 50% 50%, rgba(21,34,24,0) 40%, rgba(10,16,12,.85) 100%),
      linear-gradient(180deg, #1A2C20 0%, #121C15 100%);`,
};

fs.mkdirSync(OUT, { recursive: true });
Object.entries(AURAS).forEach(([nombre, css]) => {
  const html = '<!doctype html><html><head><style>html,body{margin:0;width:1600px;height:1000px}body{' + css + '}</style></head><body></body></html>';
  const tmp = path.join(OUT, '_' + nombre + '.html');
  const png = path.join(OUT, '_' + nombre + '.png');
  const jpg = path.join(OUT, nombre + '.jpg');
  fs.writeFileSync(tmp, html, 'utf8');
  if (fs.existsSync(png)) fs.unlinkSync(png);
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
      '--user-data-dir=' + path.join(require('os').tmpdir(), 'chrome-aura'),
      '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1600,1000',
      '--screenshot=' + png, 'file:///' + tmp.split(path.sep).join('/')], { stdio: 'pipe', timeout: 60000 });
    execFileSync(FF, ['-y', '-v', 'error', '-i', png, '-q:v', '3', jpg], { timeout: 30000 });
  } catch (e) {}
  fs.unlinkSync(tmp); if (fs.existsSync(png)) fs.unlinkSync(png);
  console.log('  ' + (fs.existsSync(jpg) ? 'OK  ' : 'FALLO  ') + nombre + (fs.existsSync(jpg) ? '  ' + Math.round(fs.statSync(jpg).size / 1024) + ' KB' : ''));
});
