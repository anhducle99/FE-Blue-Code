# FE-Blue-Code

Emergency call and incident management system built with React, TypeScript, and Tailwind CSS.

## Features

- Progressive Web App (PWA) support
- Native mobile apps (Android & iOS) via Capacitor
- Real-time communication with Socket.io
- Offline support
- Push notifications
- Camera integration
- Network status monitoring

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

For native development:

- **Android**: Android Studio, JDK 11+, Android SDK
- **iOS** (macOS only): Xcode 12+, CocoaPods

## Installation

```bash
npm install
```

## Development

### Web Development

```bash
npm start
# or
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This builds the web app and syncs with Capacitor for native platforms.

### PWA Build (Web only)

```bash
npm run build:pwa
```

## Native Development

### Setup

1. Build the web app: `npm run build`
2. Sync with native projects: `npm run cap:sync`

### Android

```bash
# Open in Android Studio
npm run cap:open:android

# Or build and run directly
npm run cap:run:android
```

### iOS

```bash
# Open in Xcode
npm run cap:open:ios

# Or build and run directly
npm run cap:run:ios
```

## Available Scripts

- `npm start` - Start development server
- `npm run dev` - Start development server
- `npm run build` - Build for production and sync with Capacitor
- `npm run build:pwa` - Build for PWA only (no Capacitor sync)
- `npm run cap:sync` - Sync web assets with native projects
- `npm run cap:copy` - Copy web assets to native projects
- `npm run cap:update` - Update Capacitor and plugins
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run cap:open:ios` - Open iOS project in Xcode
- `npm run cap:run:android` - Build and run on Android
- `npm run cap:run:ios` - Build and run on iOS

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_NATIVE_API_URL=https://api.bluecode.com
```

### Capacitor Config

Edit `capacitor.config.ts` to configure:

- App ID and name
- Server URLs for development
- Plugin settings

## Documentation

- [Capacitor Setup Guide](./CAPACITOR_SETUP.md) - Native app development
- [PWA Setup Guide](./PWA_SETUP.md) - Progressive Web App configuration

## Project Structure

```
src/
├── components/      # React components
├── contexts/        # React contexts
├── hooks/           # Custom hooks (including native hooks)
├── services/        # API and native services
├── pages/           # Page components
├── layouts/         # Layout components
├── config/          # Configuration files
├── utils/           # Utility functions
└── types/           # TypeScript type definitions

public/
├── manifest.json    # PWA manifest
├── sw.js            # Service worker
└── img/             # Images and icons

android/             # Android native project
ios/                 # iOS native project
```

## Native Features

The app includes the following native capabilities:

- **Push Notifications**: Receive notifications even when app is closed
- **Camera**: Take photos and access photo library
- **File System**: Read/write files on device
- **Network Status**: Monitor connectivity
- **Device Info**: Get device information
- **App Lifecycle**: Handle background/foreground states
- **Status Bar**: Control status bar appearance
- **Splash Screen**: Custom splash screen

## Troubleshooting

### Service Worker Issues

- Clear browser cache
- Unregister service worker in DevTools
- Check HTTPS (required except localhost)

### Native Build Issues

- Run `npm run cap:sync` after making changes
- Clean and rebuild native projects
- Check plugin installations

See [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md) and [PWA_SETUP.md](./PWA_SETUP.md) for detailed troubleshooting.

## License

[Your License Here]
