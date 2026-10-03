import { bindings, defineConfig } from 'cf/config';

const PREVIEW_DATABASE_ID = '30166e34-c12a-4b94-b298-90b8e99606f3';
const PRODUCTION_DATABASE_ID = '468b4939-9622-4192-b867-fc20fb41b456';

export default defineConfig(({ isPreview }) => {
  const databaseId = isPreview ? PREVIEW_DATABASE_ID : PRODUCTION_DATABASE_ID;

  return {
    worker: {
      name: 'gy-nav',
      entrypoint: './lib/worker.ts',
      compatibilityDate: '2024-06-18',
      // The Vite plugin requires Node.js compatibility v2. Keep the original
      // flag as well so the runtime intent remains explicit.
      compatibilityFlags: ['nodejs_compat', 'nodejs_compat_v2'],
      workersDev: true,
      assets: {
        notFoundHandling: 'single-page-application',
        runWorkerFirst: ['/api/*'],
      },
      env: {
        DB: bindings.d1({
          name: 'DB',
          id: databaseId,
        }),
      },
    },
  };
});
