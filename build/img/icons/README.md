# PWA Icons

## Cần tạo các icon files sau:

Để PWA hoạt động đúng, bạn cần tạo các icon files với các sizes sau:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels

## Cách tạo icons:

### Option 1: Sử dụng PWA Asset Generator (Khuyến nghị)

1. Cài đặt: `npm install -g pwa-asset-generator`
2. Tạo icon từ file ảnh gốc (1024x1024):
   ```bash
   pwa-asset-generator your-icon-1024x1024.png public/img/icons/ --manifest public/manifest.json --icon-only
   ```

### Option 2: Sử dụng online tools

- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

### Option 3: Tạo thủ công

1. Tạo một icon 1024x1024 pixels
2. Resize thành các sizes cần thiết
3. Đặt tên file theo format: `icon-{size}x{size}.png`
4. Đặt vào thư mục này

## Lưu ý:

- Tất cả icons nên có cùng design
- Nên sử dụng format PNG với transparent background (nếu cần)
- Icons nên có `purpose: "any maskable"` trong manifest.json (đã được cấu hình)

## Sau khi tạo icons:

1. Đảm bảo tất cả files được đặt trong `public/img/icons/`
2. Kiểm tra `public/manifest.json` đã reference đúng paths
3. Test PWA installation trên các browsers
