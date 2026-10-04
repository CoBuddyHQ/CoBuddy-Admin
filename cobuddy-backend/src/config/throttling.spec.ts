import { ConfigService } from '@nestjs/config';
import { createThrottleOptions } from './throttling';
describe('rate limiting configuration', () => {
  it('uses one default bucket so auth-specific limits do not apply to other APIs', () => {
    const options = createThrottleOptions(new ConfigService({ NODE_ENV: 'development' }));
    expect(options).toMatchObject({ throttlers: [{ name: 'default', ttl: 60000, limit: 120 }] });
  });
});
