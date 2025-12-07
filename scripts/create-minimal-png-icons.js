const fs = require("fs");
const path = require("path");

const sizes = [192, 512];
const iconsDir = path.join(__dirname, "..", "public", "img", "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const minimalPNGBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const createMinimalPNG = (size) => {
  return Buffer.from(minimalPNGBase64, "base64");
};

sizes.forEach((size) => {
  const png = createMinimalPNG(size);
  const filePath = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filePath, png);
});
