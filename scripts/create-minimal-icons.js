const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "..", "public", "img", "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const createMinimalSVG = (size) => {
  const fontSize = Math.floor(size * 0.4);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">BC</text>
</svg>`;
};

sizes.forEach((size) => {
  const svg = createMinimalSVG(size);
  const filePath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filePath, svg);
});

const transparentPNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

sizes.forEach((size) => {
  const notePath = path.join(iconsDir, `icon-${size}x${size}.png.placeholder`);
  fs.writeFileSync(
    notePath,
    `This is a placeholder. Please create icon-${size}x${size}.png with actual icon image.\nSee scripts/generate-pwa-icons.md for instructions.`
  );
});
