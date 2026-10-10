import { createRequire } from 'node:module';
import { validatePublicApiUrl } from './production-config.mjs';

const require = createRequire(import.meta.url);
try {
  const { validate } = require('../cobuddy-backend/dist/src/config/env.validation.js');
  validate({ ...process.env, NODE_ENV: 'production' });
  validatePublicApiUrl(process.env.NEXT_PUBLIC_API_URL);
  console.log(
    'Production configuration validation passed. Provider delivery, infrastructure and staging acceptance still require verification.',
  );
} catch (error) {
  const message = error instanceof Error ? error.message : '';
  console.error(
    message.startsWith('Environment validation failed:') ||
      message.startsWith('NEXT_PUBLIC_API_URL')
      ? message
      : 'Production configuration check failed. Build the backend first and configure deployment environment variables.',
  );
  process.exitCode = 1;
}
