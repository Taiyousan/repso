import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://repso-app-android.vercel.app',
  vite: {
    // The pages read the app's data (exercise library, privacy policy) from the repository root.
    server: { fs: { allow: ['..'] } },
    // Also for the app's modules, whose own tsconfig.json needs the app's dependencies: the site
    // is built with its dependencies only.
    tsconfig: './tsconfig.json',
    // Files rather than data URIs: the favicon would be repeated in each of the 880 pages.
    build: { assetsInlineLimit: 0 },
  },
});
