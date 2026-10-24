import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.gov.sehatsetu',
  appName: 'SehatSetu',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // Tip: For live reload on your phone during development, uncomment below with your Wi-Fi IP:
    // url: 'http://192.168.1.X:3000',
    // cleartext: true,
  },
};

export default config;
