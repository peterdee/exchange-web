import { defineConfig, type UserConfigExport } from 'vite';
import { readFileSync } from 'node:fs';
import vue from '@vitejs/plugin-vue';

const configuration: UserConfigExport = {
  plugins: [vue()],
  server: {
    host: true,
    port: 3000,
  },
};

if (process.env.ENV === 'local') {
  configuration.server.https = {
    cert: readFileSync('./certificates/cert.pem'),
    key: readFileSync('./certificates/key.pem'),
  };
}

export default defineConfig(configuration);
