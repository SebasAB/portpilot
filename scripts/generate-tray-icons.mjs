import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const assetDir = path.join(process.cwd(), "assets");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function writePng(filePath, width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rows = [];
  for (let y = 0; y < height; y += 1) {
    rows.push(Buffer.from([0]));
    rows.push(Buffer.from(rgba.slice(y * width * 4, (y + 1) * width * 4)));
  }

  fs.writeFileSync(
    filePath,
    Buffer.concat([
      signature,
      chunk("IHDR", ihdr),
      chunk("IDAT", zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
      chunk("IEND", Buffer.alloc(0))
    ])
  );
}

function setPixel(rgba, width, x, y, color) {
  const index = (y * width + x) * 4;
  rgba[index] = color[0];
  rgba[index + 1] = color[1];
  rgba[index + 2] = color[2];
  rgba[index + 3] = color[3];
}

function fillRect(rgba, width, x, y, rectWidth, rectHeight, color) {
  for (let row = y; row < y + rectHeight; row += 1) {
    for (let col = x; col < x + rectWidth; col += 1) {
      setPixel(rgba, width, col, row, color);
    }
  }
}

function createIcon(scale) {
  const size = 22 * scale;
  const rgba = new Uint8Array(size * size * 4);
  const center = size / 2 - 0.5;
  const radius = 10 * scale;
  const dark = [16, 24, 32, 255];
  const white = [255, 255, 255, 255];
  const green = [34, 197, 94, 255];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x - center, y - center);
      if (distance <= radius) {
        setPixel(rgba, size, x, y, dark);
      }
    }
  }

  fillRect(rgba, size, 7 * scale, 5 * scale, 3 * scale, 12 * scale, white);
  fillRect(rgba, size, 9 * scale, 5 * scale, 5 * scale, 3 * scale, white);
  fillRect(rgba, size, 13 * scale, 7 * scale, 3 * scale, 4 * scale, white);
  fillRect(rgba, size, 9 * scale, 10 * scale, 5 * scale, 3 * scale, white);

  fillRect(rgba, size, 15 * scale, 15 * scale, 3 * scale, 3 * scale, green);

  return { size, rgba };
}

fs.mkdirSync(assetDir, { recursive: true });
for (const [fileName, scale] of [
  ["tray.png", 1],
  ["tray@2x.png", 2]
]) {
  const icon = createIcon(scale);
  writePng(path.join(assetDir, fileName), icon.size, icon.size, icon.rgba);
}
