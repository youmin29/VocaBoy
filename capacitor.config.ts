import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.vocaboy.app',
  appName: 'VocaBoy',
  webDir: 'dist',
  server: {
    androidScheme: 'https',   // localStorage가 https://localhost 기준으로 저장 → 재시작해도 유지
  },
  android: {
    backgroundColor: '#1a1a2e',
  },
}

export default config
