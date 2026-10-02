// Renders the composition frame by frame (needs `npm i playwright` next to this file).
// 1. Serve this folder:  python3 -m http.server 8090
// 2. Render at 120fps:   FPS=120 node render.mjs                                  (wide 1920x800)
//                        FPS=120 LAYOUT=tablet OUT=frames-tablet node render.mjs     (tablet 1440x1000)
//                        FPS=120 LAYOUT=portrait OUT=frames-portrait node render.mjs (phone 1080x1350)
// 3. Blend pairs of frames into 60fps with motion blur and encode:
//    ffmpeg -framerate 120 -i frames/f%05d.png -vf "tmix=frames=2,select='mod(n\,2)',setpts=N/(60*TB)" \
//      -r 60 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -an ../../video/kazibridge.mp4
//    (tablet/portrait: same with frames-tablet/ or frames-portrait/, crf 25, output kazibridge-tablet.mp4 / kazibridge-portrait.mp4)
// 4. Poster = first frame:  ffmpeg -i frames/f00000.png -q:v 3 ../../video/kazibridge-poster.jpg
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const FPS = +(process.env.FPS || 120);
const OUT = process.env.OUT || 'frames';
const LAYOUT = process.env.LAYOUT || 'wide';
const VIEWPORT = { wide: { width: 1920, height: 800 }, tablet: { width: 1440, height: 1000 }, portrait: { width: 1080, height: 1350 } }[LAYOUT];
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: VIEWPORT });
await p.goto(`http://localhost:8090/index.html?layout=${LAYOUT}`); await p.evaluate(() => window.ready);
const N = Math.round(await p.evaluate(() => window.DUR) * FPS);
for (let i = 0; i < N; i++) {
  await p.evaluate(t => window.seek(t), i / FPS);
  await p.screenshot({ path: `${OUT}/f${String(i).padStart(5, '0')}.png` });
  if (i % 240 === 0) console.log(i, '/', N);
}
console.log('done', N);
process.exit(0);
