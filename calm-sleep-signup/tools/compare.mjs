// Renders index.html exactly like the reference capture (393 × 852 pt at 882 / 393 px per pt),
// diffs it against reference/plan-ready.webp and writes out/{render,diff,side-by-side}.png.
//
//   npm run compare
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'out');
fs.mkdirSync(outDir, { recursive: true });

const WIDTH = 393;
const HEIGHT = 852;
const SCALE = 882 / WIDTH; // the reference is 882 px wide
const SCREEN_ROWS = 1909; // rows below this are the Mobbin footer in the reference

const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: SCALE });
await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
await page.evaluate(() => document.fonts.ready);
const render = await page.screenshot();
fs.writeFileSync(path.join(outDir, 'render.png'), render);

const toDataUrl = (buf, type) => `data:${type};base64,${buf.toString('base64')}`;
const result = await page.evaluate(
  async ({ renderUrl, refUrl, rows }) => {
    const load = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    const [a, b] = await Promise.all([load(renderUrl), load(refUrl)]);
    const w = b.naturalWidth;
    const pixels = (img) => {
      const c = new OffscreenCanvas(w, rows);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, w, rows).data;
    };
    const pa = pixels(a);
    const pb = pixels(b);

    const diff = new ImageData(w, rows);
    let sum = 0;
    let over16 = 0;
    for (let i = 0; i < pa.length; i += 4) {
      const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]));
      sum += Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]);
      if (d > 16) over16++;
      const v = Math.max(0, 255 - d * 4); // amplified ×4, white = identical
      diff.data[i] = 255;
      diff.data[i + 1] = v;
      diff.data[i + 2] = v;
      diff.data[i + 3] = 255;
    }

    const encode = async (canvas) => {
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    };
    const diffCanvas = new OffscreenCanvas(w, rows);
    diffCanvas.getContext('2d').putImageData(diff, 0, 0);

    const gap = 24;
    const side = new OffscreenCanvas(w * 3 + gap * 2, rows);
    const sctx = side.getContext('2d');
    sctx.fillStyle = '#fff';
    sctx.fillRect(0, 0, side.width, side.height);
    sctx.drawImage(b, 0, 0);
    sctx.drawImage(a, w + gap, 0);
    sctx.drawImage(diffCanvas, (w + gap) * 2, 0);

    return {
      mae: sum / ((pa.length / 4) * 3),
      over16: over16 / (pa.length / 4),
      diffPng: await encode(diffCanvas),
      sidePng: await encode(side),
    };
  },
  {
    renderUrl: toDataUrl(render, 'image/png'),
    refUrl: toDataUrl(fs.readFileSync(path.join(root, 'reference/plan-ready.webp')), 'image/webp'),
    rows: SCREEN_ROWS,
  },
);
await browser.close();

fs.writeFileSync(path.join(outDir, 'diff.png'), Buffer.from(result.diffPng, 'base64'));
fs.writeFileSync(path.join(outDir, 'side-by-side.png'), Buffer.from(result.sidePng, 'base64'));
console.log(`mean abs error: ${result.mae.toFixed(2)} / 255`);
console.log(`pixels off by > 16 levels: ${(result.over16 * 100).toFixed(2)} %`);
console.log(`wrote ${path.relative(process.cwd(), outDir)}/{render,diff,side-by-side}.png`);
