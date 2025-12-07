const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "..", "public", "img", "icons");

const sizes = [192, 512];

const createProperPNG = (size) => {
  const Canvas = require("canvas");
  const canvas = Canvas.createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#2563eb";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "white";
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BC", size / 2, size / 2);

  return canvas.toBuffer("image/png");
};

try {
  require.resolve("canvas");

  sizes.forEach((size) => {
    try {
      const png = createProperPNG(size);
      const filePath = path.join(iconsDir, `icon-${size}x${size}.png`);
      fs.writeFileSync(filePath, png);
    } catch (err) {}
  });
} catch (err) {}
