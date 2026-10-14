import { validatePublicApiUrl } from './production-config.mjs';

try {
  // Vercel supplies the target environment before the build. Deliberately do not
  // load local .env files or require secrets from the separately hosted backend.
  validatePublicApiUrl(process.env.NEXT_PUBLIC_API_URL);
  console.log(`Vercel frontend configuration passed (Node ${process.version}).`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
