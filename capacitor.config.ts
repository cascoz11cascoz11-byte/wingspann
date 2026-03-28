import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.wingspann.app',
  appName: 'Wingspann',
  webDir: 'out',
  server: {
    url: 'https://wingspann.vercel.app',
    cleartext: true,
    allowNavigation: ['*'],
  },
  ios: {
    contentInset: 'always',
  },
};
export default config;
