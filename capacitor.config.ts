import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bluecode.app',
  appName: 'Blue Code',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // For development, uncomment and set your local IP
    // url: 'http://192.168.1.xxx:3000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#2563eb',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#2563eb',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      permissions: {
        camera: 'Allow Blue Code to access your camera to take photos for incidents.',
        photos: 'Allow Blue Code to access your photos to attach images.',
      },
    },
  },
};

export default config;

