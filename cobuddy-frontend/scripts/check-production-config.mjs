import { validatePublicApiUrl } from './production-config.mjs';

try {
  validatePublicApiUrl(process.env.NEXT_PUBLIC_API_URL);
  console.log(
    'Frontend production configuration passed. Verify backend health, CORS and authenticated requests on the deployed site separately.',
  );
} catch (error) {
  const message = error instanceof Error ? error.message : '';
  console.error(
    message.startsWith('NEXT_PUBLIC_API_URL')
      ? message
      : 'Frontend production configuration check failed. Configure NEXT_PUBLIC_API_URL.',
  );
  process.exitCode = 1;
}
