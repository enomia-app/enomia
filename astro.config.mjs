import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.enomia.app',
  integrations: [react(), keystatic()],
  output: 'server',
  adapter: vercel(),
});
