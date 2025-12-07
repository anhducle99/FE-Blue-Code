const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "..", "public", "img", "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${
    size * 0.4
  }" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">BC</text>
</svg>`;
};

sizes.forEach((size) => {
  const svg = createSVGIcon(size);
  const filePath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filePath, svg);
});
