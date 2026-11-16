import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://repso-app-android.vercel.app',
  vite: {
    // The pages read the app's data (exercise library, privacy policy) from the repository root.
    server: { fs: { allow: ['..'] } },
    // Files rather than data URIs: the favicon would be repeated in each of the 880 pages.
    build: { assetsInlineLimit: 0 },
  },
});
