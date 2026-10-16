import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

async function generateIcons() {
  const src = 'public/Vocabee.png';
  if (!fs.existsSync(src)) {
    throw new Error(`Source image ${src} does not exist`);
  }

  // 1. Standard PNG favicon and web icon sizes
  const configs = [
    { size: 16, out: 'public/favicon-16x16.png' },
    { size: 32, out: 'public/favicon-32x32.png' },
    { size: 48, out: 'public/favicon-48x48.png' },
    { size: 180, out: 'public/apple-touch-icon.png' },
    { size: 180, out: 'src/app/apple-icon.png' },
    { size: 32, out: 'src/app/icon.png' },
    { size: 192, out: 'public/icon-192.png' },
    { size: 512, out: 'public/icon-512.png' },
  ];

  for (const cfg of configs) {
    await sharp(src)
      .resize(cfg.size, cfg.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toFile(cfg.out);
    console.log(`Generated ${cfg.out} (${cfg.size}x${cfg.size})`);
  }

  // 2. Generate multi-resolution ICO (16x16, 32x32, 48x48)
  const icoSizes = [16, 32, 48];
  const buffers = await Promise.all(
    icoSizes.map((size) =>
      sharp(src)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ compressionLevel: 9 })
        .toBuffer()
    )
  );

  let offset = 6 + icoSizes.length * 16;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type
  header.writeUInt16LE(icoSizes.length, 4); // count

  const entries = [];
  for (let i = 0; i < icoSizes.length; i++) {
    const size = icoSizes[i];
    const buf = buffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // size in bytes
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += buf.length;
  }

  const icoBuf = Buffer.concat([header, ...entries, ...buffers]);
  fs.writeFileSync('src/app/favicon.ico', icoBuf);
  console.log(`Saved src/app/favicon.ico (${icoBuf.length} bytes)`);
  fs.writeFileSync('public/favicon.ico', icoBuf);
  console.log(`Saved public/favicon.ico (${icoBuf.length} bytes)`);
  console.log('All icons and favicons successfully generated!');
}

generateIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
