const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "..", "public", "img", "icons");

function createValidPNG(width, height) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(2, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = createChunk("IHDR", ihdrData);

  const idatData = Buffer.from([
    0x08, 0xd7, 0x63, 0x60, 0x64, 0xe0, 0x62, 0x00, 0x00, 0x00, 0x0e, 0x00,
    0x03,
  ]);
  const idatChunk = createChunk("IDAT", idatData);

  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, "ascii");
  const crc = calculateCRC(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function calculateCRC(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = crc ^ buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const sizes = [
  { width: 192, height: 192 },
  { width: 512, height: 512 },
];

sizes.forEach(({ width, height }) => {
  try {
    const png = createValidPNG(width, height);
    const filePath = path.join(iconsDir, `icon-${width}x${height}.png`);
    fs.writeFileSync(filePath, png);
    const stats = fs.statSync(filePath);
  } catch (err) {
  }
});
