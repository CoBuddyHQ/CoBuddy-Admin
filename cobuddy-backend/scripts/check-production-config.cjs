try {
  const { validate } = require('../dist/src/config/env.validation.js');
  validate({ ...process.env, NODE_ENV: 'production' });
  console.log('Backend production configuration passed. Verify connectivity and providers separately.');
} catch (error) {
  console.error(
    error.message?.startsWith('Environment validation failed:')
      ? error.message
      : 'Build the backend and configure the production environment before running this check.',
  );
  process.exitCode = 1;
}
