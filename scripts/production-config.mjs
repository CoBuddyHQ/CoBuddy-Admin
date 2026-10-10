import { isIP } from 'node:net';

export function validatePublicApiUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !url.pathname.replace(/\/$/, '').endsWith('/api') ||
      isIP(hostname) ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.invalid')
    )
      throw new Error();
    return url.href.replace(/\/$/, '');
  } catch {
    throw new Error(
      'NEXT_PUBLIC_API_URL must be an HTTPS API URL ending in /api on the deployment DNS hostname, without credentials, query or fragment.',
    );
  }
}
