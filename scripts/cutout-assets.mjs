import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve('public/assets/division-game');
mkdirSync(dir, { recursive: true });

async function cutout(name, threshold = 62, feather = 38) {
  const input = path.join(dir, `${name}.png`);
  const output = path.join(dir, `${name}-cutout.png`);
  const image = sharp(input).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const samples = [];
  const stepX = Math.max(1, Math.floor(width / 90));
  const stepY = Math.max(1, Math.floor(height / 90));
  const push = (x, y) => {
    const i = (y * width + x) * channels;
    samples.push([data[i], data[i + 1], data[i + 2]]);
  };
  for (let x = 0; x < width; x += stepX) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y += stepY) { push(0, y); push(width - 1, y); }
  const bg = samples.reduce((a, s) => [a[0] + s[0], a[1] + s[1], a[2] + s[2]], [0, 0, 0]).map(v => Math.round(v / samples.length));

  for (let i = 0; i < data.length; i += channels) {
    const dist = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    if (dist < threshold) data[i + 3] = 0;
    else if (dist < threshold + feather) data[i + 3] = Math.round(data[i + 3] * ((dist - threshold) / feather));
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(output);
  console.log(`${name}: bg=${bg.join(',')} -> ${output}`);
}

await cutout('mascot', 70, 48);
await cutout('reward', 54, 34);
await cutout('treasure', 64, 42);
await cutout('chest', 64, 42);
