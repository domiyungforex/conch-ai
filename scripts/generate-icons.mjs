// One-off asset generator: rasterizes the Conch shell logomark (same gradient
// + nautilus path as src/components/shared/Logo.tsx) into every icon format
// browsers/OSes look for, replacing the default create-next-app/Vercel assets.
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
mkdirSync(publicDir, { recursive: true });

const VIOLET_600 = "#874f0f";
const FUCHSIA_600 = "#8e3f1c";
const BG = "#faf7f1";

// square = rounded-square app icon; solidBg = opaque background (for tiles/ICO,
// which shouldn't rely on transparency compositing)
function markSvg({ size, radiusRatio = 0.22, solidBg = false, strokeWidth = 1.9 }) {
  const r = Math.round(size * radiusRatio);
  const bg = solidBg
    ? `<rect width="${size}" height="${size}" fill="${BG}"/>`
    : "";
  const pad = size * 0.06;
  const boxSize = size - pad * 2;
  const boxR = Math.round(r * (boxSize / size));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${VIOLET_600}"/>
      <stop offset="100%" stop-color="${FUCHSIA_600}"/>
    </linearGradient>
  </defs>
  ${bg}
  <rect x="${pad}" y="${pad}" width="${boxSize}" height="${boxSize}" rx="${boxR}" fill="url(#g)"/>
  <g transform="translate(${size / 2}, ${size / 2}) scale(${size / 24}) translate(-12, -12)">
    <path d="M13.2 20c-4.6 0-7.7-3.4-7.7-7.3 0-3.2 2.3-5.6 5.2-5.6 2.4 0 4.1 1.7 4.1 3.9 0 1.8-1.2 3.1-2.8 3.1-1.3 0-2.2-.9-2.2-2.1 0-.9.6-1.6 1.5-1.6"
      stroke="white" stroke-width="${strokeWidth}" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;
}

function maskIconSvg() {
  // Safari pinned-tab / mask-icon convention: single black shape, no
  // background or gradient — Safari recolors it itself via <link color="">.
  return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M13.2 20c-4.6 0-7.7-3.4-7.7-7.3 0-3.2 2.3-5.6 5.2-5.6 2.4 0 4.1 1.7 4.1 3.9 0 1.8-1.2 3.1-2.8 3.1-1.3 0-2.2-.9-2.2-2.1 0-.9.6-1.6 1.5-1.6"
    stroke="#000000" stroke-width="2.4" stroke-linecap="round" fill="none"/>
</svg>`;
}

function icoFromPngs(pngBuffers) {
  // ICO container holding PNG-compressed frames (supported by every modern
  // browser/OS since Vista) — avoids needing a native BMP/ICO encoder dep.
  const count = pngBuffers.length;
  const headerSize = 6 + 16 * count;
  let offset = headerSize;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  for (const { size, buf } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buf)]);
}

async function main() {
  const targets = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "android-chrome-192x192.png", size: 192 },
    { name: "android-chrome-512x512.png", size: 512 },
    { name: "mstile-150x150.png", size: 150, solidBg: true },
  ];

  for (const t of targets) {
    const svg = markSvg({ size: t.size, solidBg: !!t.solidBg });
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    writeFileSync(join(publicDir, t.name), buf);
    console.log(`wrote public/${t.name}`);
  }

  // favicon.ico: 16 + 32px frames, PNG-compressed
  const ico16 = await sharp(Buffer.from(markSvg({ size: 16 }))).png().toBuffer();
  const ico32 = await sharp(Buffer.from(markSvg({ size: 32 }))).png().toBuffer();
  const ico = icoFromPngs([
    { size: 16, buf: ico16 },
    { size: 32, buf: ico32 },
  ]);
  writeFileSync(join(root, "src/app/favicon.ico"), ico);
  console.log("wrote src/app/favicon.ico");

  writeFileSync(join(publicDir, "mask-icon.svg"), maskIconSvg());
  console.log("wrote public/mask-icon.svg");
}

main();
